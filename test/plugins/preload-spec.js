'use strict';

describe('Plugin: Preload function', function() {

  var Bike, User, Ride, $q, $rootScope, $httpBackend;

  beforeEach(module('restmod'));

  beforeEach(inject(function(restmod, $injector) {

    Ride = restmod.model('/api/rides');

    User = restmod.model('/api/users');
    User.mix({
      rides: { belongsToMany: Ride },
      friends: { belongsToMany: User }
    });

    Bike = restmod.model('/api/bikes').mix('restmod.Preload', {
      user: { belongsTo: User }
    });

    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
  }));

  describe('$preload', function() {

    var bikes;

    beforeEach(function() {
      bikes = Bike.$collection().$decode([
        { userId: 10, brand: 'Santa Cruz' },
        { userId: 11, brand: 'BMC' },
        { userId: 13, brand: 'Iron Horse' }
      ]);
    });

    it('should call populate on preloaded resource ', function() {
      User.$populate = jasmine.createSpy().and.returnValue(User.dummy(true));

      bikes.$preload('user');
      expect(User.$populate).toHaveBeenCalledWith([
        jasmine.objectContaining({ $pk: 10 }),
        jasmine.objectContaining({ $pk: 11 }),
        jasmine.objectContaining({ $pk: 13 })
      ], undefined);
      expect(User.$populate.calls.count()).toEqual(1);
    });

    it('should support parameters', function() {
      User.$populate = jasmine.createSpy().and.returnValue(User.dummy(true));

      bikes.$preload({ path: 'user', params: { include: 'all' } });
      expect(User.$populate).toHaveBeenCalledWith([
        jasmine.objectContaining({ $pk: 10 }),
        jasmine.objectContaining({ $pk: 11 }),
        jasmine.objectContaining({ $pk: 13 })
      ], { include: 'all' });
    });

    it('should work on single records too', function() {
      var bike = Bike.$new(1).$decode({ userId: 10, brand: 'Santa Cruz' });
      User.$populate = jasmine.createSpy().and.returnValue(User.dummy(true));

      bike.$preload('user');
      expect(User.$populate).toHaveBeenCalledWith(
        [ jasmine.objectContaining({ $pk: 10 }) ],
        undefined
      );
    });

    it('should properly manager hierachies', function() {
      User.$populate = jasmine.createSpy().and.callFake(function(_records) {
        _records[0].$decode({ rideIds: [1], friendIds: [1] });
        _records[1].$decode({ rideIds: [5], friendIds: [] });
        _records[2].$decode({ rideIds: [5], friendIds: [2, 3] });
        return User.dummy(true);
      });

      Ride.$populate = jasmine.createSpy().and.returnValue(User.dummy(true));

      bikes.$preload('user.friends', 'user.rides');
      expect(Ride.$populate.calls.count()).toEqual(1);
      expect(Ride.$populate).toHaveBeenCalledWith([
        jasmine.objectContaining({ $pk: 1 }),
        jasmine.objectContaining({ $pk: 5 }),
        jasmine.objectContaining({ $pk: 5 })
      ], undefined);

      expect(User.$populate.calls.count()).toEqual(2);
      expect(User.$populate).toHaveBeenCalledWith([
        jasmine.objectContaining({ $pk: 1 }),
        jasmine.objectContaining({ $pk: 2 }),
        jasmine.objectContaining({ $pk: 3 })
      ], undefined);

    });

    it('should fallback to $resolve if $populate is not defined', function() {
      bikes.$preload('user');
      $httpBackend.expectGET('/api/users/10').respond(200, {});
      $httpBackend.expectGET('/api/users/11').respond(200, {});
      $httpBackend.expectGET('/api/users/13').respond(200, {});
      $httpBackend.flush();
    });
  });


});
