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

    it('should rename all snake case attributes by default', function() {
      var bike = restmod.model(null).$build();
      bike.$decode({ snake_case: true });
      expect(bike.snake_case).toBeUndefined();
      expect(bike.snakeCase).toBeDefined();
    });

    it('should rename nested values', function() {
      var bike = restmod.model(null).$build();
      bike.$decode({ nested: { snake_case: true } });
      expect(bike.nested.snake_case).toBeUndefined();
      expect(bike.nested.snakeCase).toBeDefined();
    });

    it('should rename nested object arrays', function() {
      var bike = restmod.model(null).$build();
      bike.$decode({ nested: [ { snake_case: true } ] });
      expect(bike.nested[0].snake_case).toBeUndefined();
      expect(bike.nested[0].snakeCase).toBeDefined();
    });

    it('should allow server simple property mapping', function() {
      var bike = restmod.model(null, {
        brand: { map: 'full_brand' },
      }).$build().$decode({ full_brand: 'Trek' });

      expect(bike.brand).toEqual('Trek');
      expect(bike.fullBrand).toBeUndefined();
      bike.brand = 'Giant';
      expect(bike.$encode().full_brand).toEqual('Giant');
    });

    it('should allow server nested property mapping', function() {
      var bike = restmod.model(null, {
        brand: { map: 'brand.full_name' }
      }).$build().$decode({ brand: { full_name: 'Trek' } });

      expect(bike.brand).toEqual('Trek');
      bike.brand = 'Giant';
      expect(bike.$encode().brand).toBeDefined();
      expect(bike.$encode().brand.full_name).toEqual('Giant');
    });

    it('should allow server nested property mapping inside ignored property', function() {
      var bike = restmod.model(null, {
        brand: { ignore: true },
        brandName: { map: 'brand.full_name' }
      }).$build().$decode({ brand: { full_name: 'Trek' } });

      expect(bike.brand).toBeUndefined();
      expect(bike.brandName).toEqual('Trek');
    });

    it('should allow server nested property mapping inside an array', function() {
      var bike = restmod.model(null, {
        'allParts[].brand': { map: 'brand_name' }
      }).$build().$decode({
        all_parts: [
          { brand_name: 'Shimano' },
          { brand_name: 'SRAM' }
        ]
      });

      // expect(bike.allParts[0].brandName).toBeUndefined();
      expect(bike.allParts[0].brand).toEqual('Shimano');
    });

    it('should allow decoders on mapped properties', function() {
      var bike = restmod.model(null, {
        brand: { map: 'full_brand', decode: function(v) { return v + '!'; } }
      }).$build().$decode({ full_brand: 'Trek' });

      expect(bike.brand).toEqual('Trek!');
    });

    it('should skip masked properties', function() {
      var bike = restmod.model(null, {
        imMasked: { ignore: 'R' },
        imMaskedToo: { ignore: true },
        imNotMasked: { ignore: 'U' }
      }).$build();

      bike.$decode({ imMasked: true, imMaskedToo: true, imNotMasked: true, imNotMaskedEither: true });

      expect(bike.imMasked).toBeUndefined();
      expect(bike.imMaskedToo).toBeUndefined();
      expect(bike.imNotMasked).toBeDefined();
      expect(bike.imNotMaskedEither).toBeDefined();
    });

    it('should apply registered decoders', function() {
      var bike = restmod.model(null, function() {
        this.attrDecoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });
      }).$build();

      bike.$decode({ size: 'S' });
      expect(bike.size).toEqual('small');
    });

    it('should apply decoders to nested values', function() {
      var bike = restmod.model(null, function() {
        this.attrDecoder('user.name', function(_name) { return 'Mr. ' + _name; });
      }).$build();

      bike.$decode({ user: { name: 'Petty' } });
      expect(bike.user.name).toEqual('Mr. Petty');
    });

    it('should apply decoders to values in nested arrays', function() {
      var bike = restmod.model(null, function() {
        this.attrDecoder('users[].name', function(_name) { return 'Mr. ' + _name; });
      }).$build();

      bike.$decode({ users: [{ name: 'Peety' }] });
      expect(bike.users[0].name).toEqual('Mr. Peety');
    });
  });

  describe('$encode', function() {

    it('should rename all camel case attributes by default', function() {
      var bike = Bike.$build({ camelCase: true }),
          encoded = bike.$encode();

      expect(encoded.camelCase).toBeUndefined();
      expect(encoded.camel_case).toBeDefined();
    });

    it('should rename nested values', function() {
      var bike = restmod.model(null).$build({ user: { lastName: 'Peat' } }),
          raw = bike.$encode();

      expect(raw.user.lastName).toBeUndefined();
      expect(raw.user.last_name).toBeDefined();
    });

    it('should skip masked properties', function() {
      var bike = restmod.model(null, {
        imMasked: { ignore: 'C' },
        imMaskedToo: { ignore: true },
        imNotMasked: { ignore: 'R' }
      }).$build();

      angular.extend(bike, { imMasked: true, imMaskedToo: true, imNotMasked: true, imNotMaskedEither: true });
      var raw = bike.$encode('C');
      expect(raw.im_masked).toBeUndefined();
      expect(raw.im_masked_too).toBeUndefined();
      expect(raw.im_not_masked).toBeDefined();
      expect(raw.im_not_masked_either).toBeDefined();

      var raw = bike.$encode('U');
      expect(raw.im_masked).toBeDefined(); // not this time!
      expect(raw.im_masked_too).toBeUndefined();
    });

    it('should apply registered encoders', function() {
      var bike = restmod.model(null, function() {
        this.attrEncoder('size', function(_val) { return _val === 'small' ? 'S' : 'M'; });
      }).$build({ size: 'small' });

      expect(bike.$encode().size).toEqual('S');
    });

    it('should not encode objects with a toJSON implementation', function() {
      var now = new Date(),
          bike = restmod.model(null).$build({ created: now }),
          raw = bike.$encode();

      expect(raw.created instanceof Date).toBeTruthy();
    });

    it('should ignore relations', function() {
      var User = restmod.model(null),
          bike = restmod
            .model(null, { user: { hasOne: User } })
            .$buildRaw({ user: { name: 'Petty' }, size: 'M'}),
          raw = bike.$encode();

      expect(raw.user).toBeUndefined();
    });

    it('should ignore angular private properties (prefixed with $$)', function() {
      var bike = restmod.model(null).$build({ brand: 'Commencal', $$hashKey: '00F' }),
          raw = bike.$encode();

      expect(raw.brand).toBeDefined();
      expect(raw.$$hashKey).toBeUndefined();
    });
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

