'use strict';

describe('Restmod model relation:', function() {

  var $httpBackend, restmod, $injector, Bike;

  beforeEach(module('restmod'));

  // generate a dummy module
  beforeEach(module(function($provide) {
    $provide.factory('Part', function(restmod) {
      return restmod.model('/api/parts');
    });

    $provide.factory('BikeRide', function(restmod) {
      return restmod.model(null, {
        bike: { belongsTo: 'Bike' }
      });
    });

    $provide.factory('User', function(restmod) {
      return restmod.model('/api/users');
    });

    $provide.factory('SerialNo', function(restmod) {
      return restmod.model(null, {
        bike: { belongsTo: 'Bike' }
      });
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(['$injector', function(_$injector) {
    $injector = _$injector;
    $httpBackend = $injector.get('$httpBackend');
    restmod = $injector.get('restmod');
  }]));

  describe('hasMany', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', {
        allParts: { hasMany: 'Part' },
        activity: { hasMany: 'BikeRide', path: 'rides', inverseOf: 'bike' },
        todayActivity: { hasMany: 'BikeRide', path: 'rides', inverseOf: 'bike', params: { since: 'today' } }
      });
    });

    it('should use the parameterized attribute name if no url is provided', function() {
      expect(Bike.$new(1).allParts.$url()).toEqual('/api/bikes/1/all-parts');
    });

    it('should use url provided in path option', function() {
      expect(Bike.$new(1).activity.$url()).toEqual('/api/bikes/1/rides');
    });

    it('should use parameters provided in params option', function() {
      Bike = restmod.model('/api/bikes', {
        wheels: { hasMany: 'Part', params: { category: 'wheel' } }
      });

      expect(Bike.$new(1).wheels.$params.category).toEqual('wheel');
    });

    it('should use hooks provided in hooks option', function() {
      var owner, added;
      Bike = restmod.model('/api/bikes').mix({
        wheels: {
          hasMany: 'Part',
          hooks: {
            'a-hook': function(_value) {
              owner = this.$owner;
              added = _value;
            }
          }
        }
      });

      var bike = Bike.$new(1);
      bike.wheels.$dispatch('a-hook', ['param1']);
      expect(owner).toEqual(bike);
      expect(added).toEqual('param1');
    });

    it('should trigger an after-has-many-init hook on creation', function() {
      var spy = jasmine.createSpy();
      Bike = restmod.model('/api/bikes').mix({
        wheels: {
          hasMany: 'Part',
          hooks: {
            'after-has-many-init': spy
          }
        }
      });

      Bike.$new(1);
      expect(spy).toHaveBeenCalled();
    });

    it('should set the inverse property of each child if required', function() {
      var bike = Bike.$new(1).$decode({ rides: [{ id: 1 }, { id: 2 }] });
      expect(bike.activity[0].bike).toEqual(bike);
      expect(bike.activity[1].bike).toEqual(bike);
    });

    it('should use nested url only for create if resource is not anonymous', function() {
      var part = Bike.$new(1).allParts.$buildRaw({ id: 'HW101' });

      part.$fetch();
      part.$save();

      $httpBackend.when('GET', '/api/parts/HW101').respond(200, '{}');
      $httpBackend.when('PUT', '/api/parts/HW101').respond(200, '{}');
      $httpBackend.flush();
    });

    it('should use nested url if resource anonymous', function() {
      var ride = Bike.$new(1).activity.$buildRaw({ id: 20 });

      ride.$fetch();
      ride.$save();

      $httpBackend.when('GET', '/api/bikes/1/rides/20').respond(200, '{}');
      $httpBackend.when('PUT', '/api/bikes/1/rides/20').respond(200, '{}');
      $httpBackend.flush();
    });

    it('should load inline content into relation if available and use path as source', function() {
      var bike = Bike.$new(1).$decode({ rides: [{ id: 1 }, { id: 2 }] });
      expect(bike.activity.length).toEqual(2);
    });

    it('should clear collection if inlined content is null', function() {
      var bike = Bike.$new(1).$decode({ rides: null });
      expect(bike.activity.length).toEqual(0);
    });

    it('should reset collection content if new inline content is fed', function() {
      var bike = Bike.$new(1).$decode({ rides: [{ id: 1 }, { id: 2 }] });
      bike.$decode({ rides: [{ id: 3 }] });
      expect(bike.activity.length).toEqual(1);
    });

    it('should bubble child events to child type', function() {
      var spy = jasmine.createSpy();
      $injector.get('BikeRide').mix({
        $hooks: {
          'after-init': spy
        }
      });
      Bike.$new(1).$decode({ rides: [{ id: 1 }] });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('hasOne', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', {
        owner: { hasOne: 'User' },
        activity: { hasMany: 'BikeRide' },
        serialNo: { hasOne: 'SerialNo', path: 'serial', inverseOf: 'bike' }
      });
    });

    it('should use parameterized attribute name if no path option is provided', function() {
      expect(Bike.$new(1).activity.$url()).toEqual('/api/bikes/1/activity');
    });

    it('should use url provided in path option', function() {
      expect(Bike.$new(1).serialNo.$url()).toEqual('/api/bikes/1/serial');
    });

    it('should generate a child resource that uses the canonical url if not anonymous', function() {
      var bike = Bike.$new(1).$decode({ owner: { id: 'XX' } });
      expect(bike.owner.$url()).toEqual('/api/users/XX');
    });

    it('should not use nested url for update/delete if child resource is not anonymous', function() {
      var bike = Bike.$new(1).$decode({ owner: { id: 'XX' } });

      bike.owner.$fetch();
      bike.owner.$save();
      bike.owner.$destroy();

      $httpBackend.expectGET('/api/bikes/1/owner').respond(200, '{}'); // nested
      $httpBackend.expectPUT('/api/users/XX').respond(200, '{}'); // not nested
      $httpBackend.expectDELETE('/api/users/XX').respond(200, '{}'); // not nested
      $httpBackend.flush();
    });

    it('should generate a child resource that uses the nested url if anonymous', function() {
      var bike = Bike.$new(1).$decode({ serial: { id: 'XX' } });
      expect(bike.serialNo.$url()).toEqual('/api/bikes/1/serial');
    });

    it('should use nested url if resource anonymous', function() {
      var bike = Bike.$new(1).$decode({ serial: { id: 'XX' } });

      bike.serialNo.$fetch();
      bike.serialNo.$save();
      bike.serialNo.$destroy();

      $httpBackend.expectGET('/api/bikes/1/serial').respond(200, '{}');
      $httpBackend.when('PUT', '/api/bikes/1/serial').respond(200, '{}');
      $httpBackend.when('DELETE', '/api/bikes/1/serial').respond(200, '{}');
      $httpBackend.flush();
    });

    it('should not be able to destroy when resource is nested', function() {
      expect(function() {
        Bike.$decode({ id: 1, owner: { id: 2 } }).owner.$destroy();
      }).toThrow();
    });

    it('should load inline content into relation if available and use path as source', function() {
      var bike = Bike.$new(1).$decode({ serial: { value: 'SERIAL' } });
      expect(bike.serialNo.value).toEqual('SERIAL');
    });

    it('should do nothing if inline content is null', function() {
      var bike = Bike.$new(1).$decode({ serial: null });
      expect(bike.serialNo).not.toBeNull();
    });

    it('should bubble child events to child type', function() {
      var spy = jasmine.createSpy();
      $injector.get('SerialNo').mix({
        $hooks: {
          'after-init': spy
        }
      });
      Bike.$new(1).$decode({ serial: { value: 'SERIAL' } });
      expect(spy).toHaveBeenCalled();
    });

    it('should assign inverse relation with host instance', function() {
      var bike = Bike.$new(1).$decode({ serial: { id: 'XX' } });
      expect(bike.serialNo.bike).toEqual(bike);
    });

    it('should use hooks provided in hooks option', function() {
      var owner, added;
      Bike = restmod.model('/api/bikes').mix({
        serial: {
          hasOne: 'SerialNo',
          hooks: {
            'a-hook': function(_value) {
              owner = this.$owner;
              added = _value;
            }
          }
        }
      });

      var bike = Bike.$new(1);
      bike.serial.$dispatch('a-hook', ['param1']);
      expect(owner).toEqual(bike);
      expect(added).toEqual('param1');
    });

    it('should trigger an after-has-many-init hook on creation', function() {
      var spy = jasmine.createSpy();
      Bike = restmod.model('/api/bikes').mix({
        serial: {
          hasOne: 'SerialNo',
          hooks: {
            'after-has-one-init': spy
          }
        }
      });

      Bike.$new(1);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('belongsTo', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', {
        frame: { belongsTo: 'Part' },
        user: { belongsTo: 'User', key: 'owner_id', map: 'owner' }
      });
    });

    it('should initialize resource as null', function() {
      var bike = Bike.$new(1);
      expect(bike.frame).toBeDefined();
    });

    it('should set resource foreign key when host object is encoded', function() {
      var bike = Bike.$new(1);
      bike.frame = $injector.get('Part').$new(2);
      expect(bike.$encode().frameId).toEqual(2);
    });

    it('should load resource after fetching id', function() {
      var bike = Bike.$new(1);
      expect(bike.frame).toBeNull();
      bike.$decode({ frameId: 'XX' });
      expect(bike.frame).not.toBeNull();
      expect(bike.frame.$pk).toEqual('XX');
    });

    it('should load resource using id specified in key', function() {
      var bike = Bike.$new(1);
      bike.$decode({ owner_id: 'XX' });
      expect(bike.user.$pk).toEqual('XX');
    });

    it('should behave as an independent resource', function() {
      var bike = Bike.$new(1).$decode({ frameId: 'XX' });
      expect(bike.frame.$url()).toEqual('/api/parts/XX');
    });

    it('should reload resource only if id changes', function() {
      var bike = Bike.$new(1).$decode({ frameId: 'XX' }),
          original = bike.frame;

      bike.$decode({ frameId: 'XX' });
      expect(bike.frame).toEqual(original);

      bike.$decode({ frameId: 'XY' });
      expect(bike.frame).not.toEqual(original);
    });

    it('should load resource after fetching id', function() {
      var bike = Bike.$new(1);
      expect(bike.frame).toBeNull();
      bike.$decode({ frame: { name: 'XX' } });
      expect(bike.frame.name).toEqual('XX');
    });

    it('should load resource from property specified in map', function() {
      var bike = Bike.$build({ id: 1 }).$decode({ owner: { name: 'XX' } });
      expect(bike.user.name).toEqual('XX');
    });

    it('should behave as an independent resource', function() {
      var bike = Bike.$build({ id: 1 }).$decode({ frame: { id: 'XX' } });
      expect(bike.frame.$url()).toEqual('/api/parts/XX');
    });

    it('should reload resource only if id changes', function() {
      var bike = Bike.$build({ id: 1 }).$decode({ frame: { id: 'XX' } }),
          original = bike.frame;

      bike.$decode({ frame: { id: 'XX' } });
      expect(bike.frame).toEqual(original);

      bike.$decode({ frame: { id: 'XY' } });
      expect(bike.frame).not.toEqual(original);
    });

    it('should be encoded as a $pk reference', function() {
      var bike = Bike.$build({ id: 1, frame: $injector.get('Part').$new('XX'), user: $injector.get('User').$new('YY') });
      expect(bike.$encode().frameId).toEqual('XX');
      expect(bike.$encode().owner_id).toEqual('YY');
    });

    it('should properly load content from packerCache', function() {

      // this is more of an integration test, place it somewhere else

      var model = restmod.model('/api/bikes', 'DefaultPacker', {
        user: { belongsTo: 'User' }
      });

      var record = model.$new(1);
      record.$unwrap({
        bike: { model: 'Slash', userId: 1 },
        included: {
          users: [ { id: 1, name: 'Hill' } ]
        }
      });

      expect(record.user.name).toEqual('Hill');
    });
  });

  describe('belongsToMany', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', {
        parts: { belongsToMany: 'Part' }
      });
    });

    it('should initialize resource as ampty array', function() {
      var bike = Bike.$new(1);
      expect(bike.parts).toBeDefined();
      expect(bike.parts instanceof Array).toBeTruthy();
      expect(bike.parts.length).toEqual(0);
    });

    it('should load resources after fetching host with inline data', function() {
      var bike = Bike.$buildRaw({ parts: [{ id: 1, brand: 'Shimano' }, { id: 2, brand: 'SRAM' }] });
      expect(bike.parts.length).toEqual(2);
      expect(bike.parts[0].$pk).toEqual(1);
      expect(bike.parts[0].brand).toEqual('Shimano');
      expect(bike.parts[1].$pk).toEqual(2);
    });

    it('should load resources after fetching host with ids', function() {
      var bike = Bike.$buildRaw({ partIds: [1, 2, 3] });
      expect(bike.parts.length).toEqual(3);
      expect(bike.parts[0].$pk).toEqual(1);
      expect(bike.parts[1].$pk).toEqual(2);
      expect(bike.parts[2].$pk).toEqual(3);
    });

    it('should set resource foreign key when host object is encoded', function() {
      var bike = Bike.$new(1);
      bike.parts.push($injector.get('Part').$new(1));
      bike.parts.push($injector.get('Part').$new(2));
      expect(bike.$encode().partIds).toEqual([1, 2]);
    });

    it('should load references as independent resources', function() {
      var bike = Bike.$buildRaw({ partIds: [1, 2, 3] });
      expect(bike.parts[0].$url()).toEqual('/api/parts/1');
    });

    it('should load keys to/from the property specified in \'keys\'', function() {
      Bike = restmod.model('/api/bikes', {
        parts: { belongsToMany: 'Part', keys: 'part_keys' }
      });

      var bike = Bike.$buildRaw({ part_keys: [1, 2, 3] });
      expect(bike.parts.length).toEqual(3);
      expect(bike.$encode().part_keys.length).toEqual(3);
    });

    it('should properly load content from packerCache', function() {

      // this is more of an integration test, place it somewhere else

      var model = restmod.model('/api/bikes', 'DefaultPacker', {
        parts: { belongsToMany: 'Part' }
      });

      var record = model.$new(1);
      record.$unwrap({
        bike: { model: 'Slash', partIds: [1, 2] },
        included: {
          parts: [ { id: 1, name: 'headset' }, { id: 2, name: 'brake' } ]
        }
      });

      expect(record.parts[0].name).toEqual('headset');
      expect(record.parts[1].name).toEqual('brake');
    });
  });

});

