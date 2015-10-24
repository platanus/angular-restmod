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

  describe('equality', function() {

    // record equality test, I'll keep this here just in case a restmod-jasmine adaptor is built

    var recordEquality = function(_first, _second) {
      if (typeof _first === 'object' && typeof _second === 'object' &&
        _first && _second && _first.$type === _second.$type) {
        for(var key in _first) {
          if(_first.hasOwnProperty(key) && key[0] !== '$') {
            if(!jasmine.matchersUtil.equals(_first[key], _second[key], [])) { return false; }
          }
        }
        return true;
      }
    };

    beforeEach(function() {
      jasmine.addCustomEqualityTester(recordEquality);
    });

    it('should work for instances that are equal', function() {
      expect(Bike.$build({ model: 'slash' })).toEqual(Bike.$build({ model: 'slash' }));
    });
  });

  describe('constructor', function() {

    it('should fire the after-init hook', function() {
      var spy = jasmine.createSpy('hook');
      Bike = restmod.model('/api/bikes', {
        $hooks: {
          'after-init': spy
        }
      });
      (new Bike());
      expect(spy).toHaveBeenCalled();
    });

    it('should remove trailing slashes from url', function() {
      var Bike = restmod.model('/api/bikes/');
      expect(Bike.$url()).not.toMatch(/\/$/);
    });
  });

  describe('getProperty', function() {

    it('should retrieve an internal property', function() {
      expect(Bike.getProperty('primaryKey')).toEqual('id');
    });

    it('should return default value if requested property is not set', function() {
      expect(Bike.getProperty('teapot', 'banzai')).toEqual('banzai');
    });
  });

  describe('single', function() {

    it('should create a resource bound to a given url', function() {
      var bike = Bike.single('/user/bike');
      expect(bike.$url()).toEqual('/user/bike');
    });
  });

  describe('identity', function() {

    it('should infer the model identity from the url', function() {
      expect(Bike.identity()).toEqual('bike');
    });

    it('should infer the model plural identity from the name', function() {
      expect(Bike.identity(true)).toEqual('bikes');
    });

    it('should use the specified plural identity if given', function() {
      expect(Bike.mix({ $config: { plural: 'cletas' } }).identity(true)).toEqual('cletas');
    });
  });

  describe('dummy', function() {

    it('should create a new dummy resource with common api infrastructure', function() {
      var dummy = Bike.dummy();
      expect(dummy.$send).toBeDefined();
      expect(dummy.$then).toBeDefined();
      expect(dummy.$always).toBeDefined();
      expect(dummy.$dispatch).toBeDefined();
    });

    it('should accept a first argument true to cahnge the dummy arity', function() {
      var dummy = Bike.dummy();
      expect(dummy.$isCollection).toBeFalsy();
      dummy = Bike.dummy(true);
      expect(dummy.$isCollection).toBeTruthy();
    });

    it('should create a new dummy that dispatches events to model', function() {
      var spy = jasmine.createSpy();
      Bike = restmod.model('/api/bikes', {
        $hooks: { 'on-event': spy }
      });
      Bike.dummy().$dispatch('on-event');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('$extend', function() {

    it('should be called in the promise chain', function() {
      $httpBackend.when('GET', '/api/bikes/1').respond(200, { category: 'XC' });

      var bike = Bike.$find(1).$extend({ category: 'Trail' });
      $httpBackend.flush();
      expect(bike.category).toEqual('Trail');
    });

    it('should ignore properties that start with $', function() {
      var bike = Bike.$new().$extend({ category: 'Trail', $ignored: 'internal' });
      expect(bike.category).toBeDefined();
      expect(bike.ignored).toBeUndefined();
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

    describe('when record is identified and a patch array is given', function() {

      var bike;

      beforeEach(function() {
        bike = Bike.$new(1).$extend({
          brand: 'Santa Cruz',
          model: 'Bronson',
          wheelSz: 27.5,
          dim: { height: 10, width: 10 },
          parts: [ { name: 'i25', brand: 'WTB' }, { name: 'MTX', brand: 'Sunn' } ]
        });
      });

      it('should begin a PATCH action', function() {
        bike.$save(['brand']);
        $httpBackend.expectPATCH('/api/bikes/1').respond(200, {});
        $httpBackend.flush();
      });

      it('should begin a PUT action if configured to do so', function() {
        Bike.mix({ $config: { patchMethod: 'PUT' } });
        bike.$save(['brand']);
        $httpBackend.expectPUT('/api/bikes/1').respond(200, {});
        $httpBackend.flush();
      });

      it('should only send requested properties', function() {
        bike.$save(['brand', 'wheelSz']);
        $httpBackend.expectPATCH('/api/bikes/1', { brand: 'Santa Cruz', wheelSz: 27.5 }).respond(200, {});
        $httpBackend.flush();
      });

      it('should include explicitly specified subproperties', function() {
        bike.$save(['brand', 'dim.width']);
        $httpBackend.expectPATCH('/api/bikes/1', { brand: 'Santa Cruz', dim: { width: 10 } }).respond(200, {});
        $httpBackend.flush();
      });

      it('should include every sub property in a property if parent name is given', function() {
        bike.$save(['brand', 'dim']);
        $httpBackend.expectPATCH('/api/bikes/1', { brand: 'Santa Cruz', dim: { height: 10, width: 10 } }).respond(200, {});
        $httpBackend.flush();
      });

      it('should include a complete array of objects if array property name is given', function() {
        bike.$save(['parts']);
        $httpBackend.expectPATCH('/api/bikes/1', { parts: [ { name: 'i25', brand: 'WTB' }, { name: 'MTX', brand: 'Sunn' } ] }).respond(200, {});
        $httpBackend.flush();
      });

      it('should include every arrays object property if a nested property is given', function() {
        bike.$save(['parts.name']);
        $httpBackend.expectPATCH('/api/bikes/1', { parts: [ { name: 'i25' }, { name: 'MTX' } ] }).respond(200, {});
        $httpBackend.flush();
      });

      it('should ignore empty responses', function() {
        expect(function() {
          bike.$save();
          $httpBackend.when('PUT', '/api/bikes/1').respond(200, '');
          $httpBackend.flush();
        }).not.toThrow();
      });
    });

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

    it('should immediately remove item from collection if not identified', function() {
      var col = Bike.$collection(),
          bike = col.$buildRaw({ gears: 21 }).$reveal();

      expect(col.length).toEqual(1);
      bike.$destroy();
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

    it('should call the type\'s unpack method', function() {
      var spy = jasmine.createSpy().and.returnValue({});
      var bike = restmod.model('/api/bikes', {
        'Model.unpack': spy
      }).$build();

      var raw = {};
      bike.$unwrap(raw);
      expect(spy).toHaveBeenCalledWith(bike, raw);
    });

    it('should call $decode', function() {
      var bike = Bike.$build();
      bike.$decode = jasmine.createSpy();
      bike.$unwrap({});
      expect(bike.$decode).toHaveBeenCalled();
    });

  });

  describe('$wrap', function() {

    it('should call the the type\'s pack method', function() {
      var spy = jasmine.createSpy();
      var bike = restmod.model('/api/bikes', {
        'Model.pack': spy
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

