'use strict';

describe('Restmod serializer', function() {

  var serializer;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    serializer = $injector.get('RMSerializerFactory')();
  }));

  describe('encode', function() {
    it('should rename all camel case attributes by default', function() {
      var raw = serializer.encode({ camelCase: true });
      expect(raw.camelCase).toBeUndefined();
      expect(raw.camel_case).toBeDefined();
    });

    it('should rename nested values', function() {
      var raw = serializer.encode({ user: { lastName: 'Peat' } });
      expect(raw.user.lastName).toBeUndefined();
      expect(raw.user.last_name).toBeDefined();
    });

    it('should ignore properties prefixed with $', function() {
      var raw = serializer.encode({ $ignored: true, notIgnored: false });
      expect(raw.$ignored).toBeUndefined();
      expect(raw.not_ignored).toBeDefined();
    });

    it('should not encode objects with a toJSON implementation', function() {
      var raw = serializer.encode({ created: new Date() });
      expect(raw.created instanceof Date).toBeTruthy();
    });
  });

  describe('decode', function() {
    it('should rename all snake case attributes by default', function() {
      var bike = {};
      serializer.decode(bike, { snake_case: true }, '');
      expect(bike.snake_case).toBeUndefined();
      expect(bike.snakeCase).toBeDefined();
    });

    it('should rename nested values', function() {
      var bike = {};
      serializer.decode(bike, { nested: { snake_case: true } }, '');
      expect(bike.nested.snake_case).toBeUndefined();
      expect(bike.nested.snakeCase).toBeDefined();
    });

    it('should rename nested object arrays', function() {
      var bike = {};
      serializer.decode(bike, { nested: [ { snake_case: true } ] }, '');
      expect(bike.nested[0].snake_case).toBeUndefined();
      expect(bike.nested[0].snakeCase).toBeDefined();
    });

    it('should ignore properties prefixed with $', function() {
      var result = {};
      serializer.decode(result, { $ignored: true, not_ignored: false });
      expect(result.$ignored).toBeUndefined();
      expect(result.notIgnored).toBeDefined();
    });
  });

  describe('setNameEncoder', function() {
  });

  describe('setNameDecoder', function() {
  });

  describe('setMask', function() {
    it('should mask a property from every operation if true is used', function() {
      serializer.setMask('brand', true);

      var result = {};
      serializer.decode(result, { brand: 'Canyon' });
      expect(result.brand).toBeUndefined();
      result.brand = 'YT';

      result = serializer.encode(result);
      expect(result.brand).toBeUndefined();
    });

    it('should mask a property from the desired operations only', function() {
      serializer.setMask('brand', 'RU');

      var result = {};
      serializer.decode(result, { brand: 'Canyon' }, 'R');
      expect(result.brand).toBeUndefined();
      result.brand = 'YT';

      var raw = serializer.encode(result, 'C');
      expect(raw.brand).toBeDefined();

      raw = serializer.encode(result, 'U');
      expect(raw.brand).toBeUndefined();
    });
  });

  describe('setDecoder', function() {
    it('should apply registered decoders', function() {
      serializer.setDecoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { size: 'S' });
      expect(result.size).toEqual('small');
    });

    it('should apply decoders to nested values', function() {
      serializer.setDecoder('frontWheel.size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { front_wheel: { size: 'S' } });
      expect(result.frontWheel.size).toEqual('small');
    });

    it('should apply decoders to values in nested arrays', function() {
      serializer.setDecoder('wheels[].size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { wheels: [{ size: 'S' }, { size: 'M' }] });
      expect(result.wheels[0].size).toEqual('small');
      expect(result.wheels[1].size).toEqual('regular');
    });

    // TODO: test chaining and filter injection
  });

  describe('setEncoder', function() {
    it('should apply registered encoders', function() {
      serializer.setEncoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ size: 'S' });
      expect(raw.size).toEqual('small');
    });

    it('should apply encoders to nested values', function() {
      serializer.setEncoder('frontWheel.size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ frontWheel: { size: 'S' } });
      expect(raw.front_wheel.size).toEqual('small');
    });

    it('should apply encoders to values in nested arrays', function() {
      serializer.setEncoder('wheels[].size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ wheels: [{ size: 'S' }, { size: 'M' }] });
      expect(raw.wheels[0].size).toEqual('small');
      expect(raw.wheels[1].size).toEqual('regular');
    });
  });

  describe('setMapping', function() {
    it('should add an explicit mapping that maps a server response property to a model property and viceversa', function() {
      serializer.setMapping('brand', 'full_brand');

      var result = {};
      serializer.decode(result, { full_brand: 'Trek SA' }, '');
      expect(result.fullBrand).toBeUndefined();
      expect(result.brand).toEqual('Trek SA');

      result = serializer.encode(result, '');
      expect(result.brand).toBeUndefined();
      expect(result.full_brand).toEqual('Trek SA');
    });

    it('should properly run property decoders and encoders', function() {
      serializer.setMapping('brand', 'full_brand');
      serializer.setDecoder('brand', function(_v) { return _v.split('.'); });
      serializer.setEncoder('brand', function(_v) { return _v.join('.'); });

      var result = {};
      serializer.decode(result, { full_brand: 'MainGroup.Bicicles.Trek' }, '');
      expect(result.brand instanceof Array).toBeTruthy();

      result = serializer.encode(result, '');
      expect(typeof result.full_brand).toEqual('string');
    });

    it('should consider masks', function() {
      serializer.setMapping('brand', 'full_brand');
      serializer.setMask('brand', 'R');

      var result = {};
      serializer.decode(result, { full_brand: 'Trek SA' }, 'R');
      expect(result.brand).toBeUndefined();

      result.brand = 'Trek';
      result = serializer.encode(result, 'C');
      expect(result.full_brand).toEqual('Trek');
    });

    it('should allow nested server properties', function() {
      serializer.setMapping('brand', 'brand.full_name');

      var result = {};
      serializer.decode(result, { brand: { full_name: 'Giant' } }, '');
      expect(result.brand).toEqual('Giant');

      result = serializer.encode(result, '');
      expect(result.brand.full_name).toEqual('Giant');
    });

    it('should allow mapping to a server property inside an ignored property', function() {
      serializer.setMapping('brandName', 'brand.full_name');
      serializer.setMask('brand', true);

      var result = {};
      serializer.decode(result, { brand: { full_name: 'Giant' } }, '');
      expect(result.brandName).toEqual('Giant');

      result = serializer.encode(result, '');
      expect(result.brand.full_name).toEqual('Giant');
    });

    it('should work on array properties', function() {
      serializer.setMapping('allParts[].brand', 'brand_name');

      var result = {};
      serializer.decode(result, { all_parts: [
        { brand_name: 'Shimano' },
        { brand_name: 'SRAM' }
      ] }, '');

      expect(result.allParts[0].brand).toEqual('Shimano');
      expect(result.allParts[1].brand).toEqual('SRAM');
    });

    it('should allow for a wildcard as server name to use encoded attribute name', function() {
      serializer.setMapping('fullBrand', '*');

      var result = {};
      serializer.decode(result, { full_brand: 'Bianchi' }, '');
      expect(result.fullBrand).toEqual('Bianchi');

      result = serializer.encode(result, '');
      expect(result.full_brand).toEqual('Bianchi');
    });

    it('should allow to set it as forced to force a property to be processed even if not set', function() {
      serializer.setMapping('gearRatio', '*', true);
      serializer.setEncoder('gearRatio', function() { return this.calculateGearRatio(); });

      var result = { calculateGearRatio: function() { return 24/36; } };
      result = serializer.encode(result, '');
      expect(result.gear_ratio).toEqual(24/36);
    });
  });
});

