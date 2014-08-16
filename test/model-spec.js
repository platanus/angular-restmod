'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, restmod, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    restmod = $injector.get('restmod');
    Bike = restmod.model('/api/bikes');
    query = Bike.$collection();
  }));

  describe('constructor', function() {

    it('should fire the after-init hook', function() {
      var spy = jasmine.createSpy('hook');
      Bike.$on('after-init', spy);
      (new Bike());
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('$single', function() {

    it('should create a resource bound to a given url', function() {
      var bike = Bike.$single('/user/bike');
      expect(bike.$url()).toEqual('/user/bike');
    });
  });

  describe('$fetch', function() {

    it('should call callbacks in proper order', function() {
      var calls = [];

      Bike.$new(1)
          .$on('before-fetch', function() { calls.push('bf'); })
          .$on('before-request', function() { calls.push('br'); })
          .$on('after-request', function() { calls.push('ar'); })
          .$on('after-fetch', function() { calls.push('af'); })
          .$fetch();

      $httpBackend.when('GET', '/api/bikes/1').respond(200, {});
      $httpBackend.flush();

      expect(calls).toEqual(['bf','br','ar','af']);
    });

    it('should call error callbacks in proper order', function() {
      var calls = [];

      Bike.$new(1)
          .$on('before-fetch', function() { calls.push('bf'); })
          .$on('before-request', function() { calls.push('br'); })
          .$on('after-request-error', function() { calls.push('are'); })
          .$on('after-fetch-error', function() { calls.push('afe'); })
          .$fetch();

      $httpBackend.when('GET', '/api/bikes/1').respond(400, {});
      $httpBackend.flush();

      expect(calls).toEqual(['bf','br','are','afe']);
    });
  });

  describe('$save', function() {

    it('should call callbacks in proper order when creating', function() {
      var calls = [];

      Bike.$build()
          .$on('before-save', function() { calls.push('bs'); })
          .$on('before-create', function() { calls.push('bc'); })
          .$on('before-request', function() { calls.push('br'); })
          .$on('after-request', function() { calls.push('ar'); })
          .$on('after-create', function() { calls.push('ac'); })
          .$on('after-save', function() { calls.push('as'); })
          .$save();

      $httpBackend.when('POST', '/api/bikes').respond(200, {});
      $httpBackend.flush();

      expect(calls).toEqual(['bs','bc','br','ar','ac','as']);
    });

    it('should add unrevealed item to its parent collection', function() {

      var bike = query.$build();
      expect(query.length).toEqual(0);
      bike.$save();

      $httpBackend.when('POST', '/api/bikes').respond(200, {});
      $httpBackend.flush();

      expect(query.length).toEqual(1);
    });

  });

  describe('$destroy', function() {

    it('should call callbacks in proper order', function() {
      var calls = [];

      Bike.$new(1)
          .$on('before-destroy', function() { calls.push('bd'); })
          .$on('before-request', function() { calls.push('br'); })
          .$on('after-request', function() { calls.push('ar'); })
          .$on('after-destroy', function() { calls.push('ad'); })
          .$destroy();

      $httpBackend.when('DELETE', '/api/bikes/1').respond(200, {});
      $httpBackend.flush();

      expect(calls).toEqual(['bd','br','ar','ad']);
    });

    it('should remove item from collection if bound to colletion', function() {
      var col = Bike.$collection(),
          bike = col.$buildRaw({ id: 1 }).$reveal();

      expect(col.length).toEqual(1);
      bike.$destroy();

      $httpBackend.when('DELETE', '/api/bikes/1').respond(200, {});
      $httpBackend.flush();

      expect(col.length).toEqual(0);
    });
  });

  describe('$decode', function() {
    it('should call callbacks in proper order', function() {
      var calls = [];

      Bike.$new(1)
          .$on('after-feed', function() { calls.push('af'); })
          .$decode({});

      expect(calls).toEqual(['af']);
    });

    // TODO: test interaction with serializer.
  });

  describe('$encode', function() {
    it('should call callbacks in proper order', function() {
      var calls = [];

      Bike.$new(1)
          .$on('before-render', function() { calls.push('br'); })
          .$encode();

      expect(calls).toEqual(['br']);
    });

    // TODO: test interaction with serializer.
  });

  describe('$unwrap', function() {

    it('should call the packer unpack method if a packer is provided', function() {
      var spy = jasmine.createSpy();
      var bike = restmod.model('/api/bikes', function() {
        this.setPacker({
          unpack: spy
        });
      }).$build();

      var raw = {};
      bike.$unwrap(raw);
      expect(spy).toHaveBeenCalledWith(raw, bike);
    });

    it('should call $decode', function() {
      var bike = Bike.$build();
      bike.$decode = jasmine.createSpy();
      bike.$unwrap({});
      expect(bike.$decode).toHaveBeenCalled();
    });

  });

  describe('$wrap', function() {

    it('should call the packer pack method if a packer is provided', function() {
      var spy = jasmine.createSpy();
      var bike = restmod.model('/api/bikes', function() {
        this.setPacker({
          pack: spy
        });
      }).$build();

      bike.$wrap();
      expect(spy).toHaveBeenCalled();
    });

    it('should call $decode', function() {
      var bike = Bike.$build();
      bike.$encode = jasmine.createSpy();
      bike.$wrap();
      expect(bike.$encode).toHaveBeenCalled();
    });

  });

  describe('$extend', function() {

    it('should copy other item\'s non private properties', function() {
      var bike = Bike.$new().$extend({ brand: 'Trek', $show: true });
      expect(bike.brand).toBeDefined();
      expect(bike.$show).not.toBeDefined();
    });

  });

  describe('$each', function() {

    it('should iterate only over public properties', function() {
      var bike = Bike.$build({ brand: 'Trek' }), props = [];
      bike.$each(function(_val, _key) {
        props.push(_key);
      });

      expect(props).toContain('brand');
      expect(props).not.toContain('$pending');
      expect(props).not.toContain('$scope');
    });
  });

  describe('$reveal', function() {

    it('should add unrevealed item to its parent collection', function() {
      var bike = query.$build();
      expect(query.length).toEqual(0);
      bike.$reveal();
      expect(query.length).toEqual(1);
    });

    it('should prevent objects to be added on $save success if called with false', function() {
      query.$create({ brand: 'Trek' }).$reveal(false);

      $httpBackend.when('POST', '/api/bikes').respond(200, {});
      $httpBackend.flush();
      expect(query.length).toEqual(0);
    });

  });

  describe('$moveTo', function() {

    it('should change the place where item is revelaed in a collection', function() {
      query.$build().$reveal();
      var bike = query.$build().$reveal();
      expect(query[0]).not.toBe(bike);

      var bike2 = query.$build().$moveTo(0).$reveal();
      expect(query[0]).toBe(bike2);
    });

  });
});

