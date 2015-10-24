'use strict';

describe('Restmod serializer', function() {

  var serializer, factory;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    factory = $injector.get('RMSerializer');
    serializer = factory({});
  }));

  describe('encode', function() {

    describe('if a renaming strategy is provided', function() {

      beforeEach(function() {
        serializer = factory({
          decodeName: function(_str) { return '_'+_str; },
          encodeName: function(_str) { return _str.substr(1); }
        });
      });

      it('should rename root properties', function() {
        var raw = serializer.encode({ _lastName: true });
        expect(raw._lastName).toBeUndefined();
        expect(raw.lastName).toBeDefined();
      });

      it('should rename nested properties', function() {
        var raw = serializer.encode({ _user: { _lastName: 'Peat' } });
        expect(raw.user._lastName).toBeUndefined();
        expect(raw.user.lastName).toBeDefined();
      });

    });

    it('should ignore properties prefixed with $', function() {
      var raw = serializer.encode({ $ignored: true, notIgnored: false });
      expect(raw.$ignored).toBeUndefined();
      expect(raw.notIgnored).toBeDefined();
    });

    it('should not encode objects with a toJSON implementation', function() {
      var raw = serializer.encode({ created: new Date() });
      expect(raw.created instanceof Date).toBeTruthy();
    });

    it('should not fail when decoding a null value (Issue #90)', function() {
      expect(function() {
        serializer.encode({ test: null });
      }).not.toThrow();
    });
  });

  describe('decode', function() {

    describe('if a renaming strategy is provided', function() {

      beforeEach(function() {
        serializer = factory({
          decodeName: function(_str) { return '_'+_str; },
          encodeName: function(_str) { return _str.substr(1); }
        });
      });

      it('should rename root properties', function() {
        var bike = {};
        serializer.decode(bike, { isNew: true }, '');
        expect(bike.isNew).toBeUndefined();
        expect(bike._isNew).toBeDefined();
      });

      it('should rename nested properties', function() {
        var bike = {};
        serializer.decode(bike, { nested: { isNew: true } }, '');
        expect(bike._nested.isNew).toBeUndefined();
        expect(bike._nested._isNew).toBeDefined();
      });

      it('should rename nested object arrays', function() {
        var bike = {};
        serializer.decode(bike, { nested: [ { isNew: true } ] }, '');
        expect(bike._nested[0].isNew).toBeUndefined();
        expect(bike._nested[0]._isNew).toBeDefined();
      });

    });

    it('should ignore properties prefixed with $', function() {
      var result = {};
      serializer.decode(result, { $ignored: true, notIgnored: false });
      expect(result.$ignored).toBeUndefined();
      expect(result.notIgnored).toBeDefined();
    });

    it('should ignore properties prefixed with $ AFTER rename is computed', function() {
      serializer = factory({ decodeName: function(_name) { return _name === '$mustSee' ? 'mustSee' : _name; } });

      var result = {};
      serializer.decode(result, { $mustSee: true });

      expect(result.mustSee).toBeDefined();
    });
  });

  describe('attrMask', function() {
    it('should mask a property from every operation if true is used', function() {
      serializer.dsl().attrMask('brand', true);

      var result = {};
      serializer.decode(result, { brand: 'Canyon' });
      expect(result.brand).toBeUndefined();
      result.brand = 'YT';

      result = serializer.encode(result);
      expect(result.brand).toBeUndefined();
    });

    it('should mask a property from the desired operations only', function() {
      serializer.dsl().attrMask('brand', 'RU');

      var result = {};
      serializer.decode(result, { brand: 'Canyon' }, 'R');
      expect(result.brand).toBeUndefined();
      result.brand = 'YT';

      var raw = serializer.encode(result, 'C');
      expect(raw.brand).toBeDefined();

      raw = serializer.encode(result, 'U');
      expect(raw.brand).toBeUndefined();
    });

    it('should mask a property using dynamic options if funtion is provided', function() {
      serializer.dsl().attrMask('brand', function() {
        return this.loadBrand ? '' : 'R';
      });

      var result = {};
      serializer.decode(result, { brand: 'Canyon' }, 'R');
      expect(result.brand).toBeUndefined();
      result.loadBrand = true;

      serializer.decode(result, { brand: 'Canyon' }, 'R');
      expect(result.brand).toEqual('Canyon');
    });
  });

  describe('attrDecoder', function() {
    it('should apply registered decoders', function() {
      serializer.dsl().attrDecoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { size: 'S' });
      expect(result.size).toEqual('small');
    });

    it('should apply decoders to nested values', function() {
      serializer.dsl().attrDecoder('frontWheel.size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { frontWheel: { size: 'S' } });
      expect(result.frontWheel.size).toEqual('small');
    });

    it('should apply decoders to values in nested arrays', function() {
      serializer.dsl().attrDecoder('wheels[].size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var result = {};
      serializer.decode(result, { wheels: [{ size: 'S' }, { size: 'M' }] });
      expect(result.wheels[0].size).toEqual('small');
      expect(result.wheels[1].size).toEqual('regular');
    });

    // TODO: test chaining and filter injection
  });

  describe('attrEncoder', function() {
    it('should apply registered encoders', function() {
      serializer.dsl().attrEncoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ size: 'S' });
      expect(raw.size).toEqual('small');
    });

    it('should apply encoders to nested values', function() {
      serializer.dsl().attrEncoder('frontWheel.size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ frontWheel: { size: 'S' } });
      expect(raw.frontWheel.size).toEqual('small');
    });

    it('should apply encoders to values in nested arrays', function() {
      serializer.dsl().attrEncoder('wheels[].size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });

      var raw = serializer.encode({ wheels: [{ size: 'S' }, { size: 'M' }] });
      expect(raw.wheels[0].size).toEqual('small');
      expect(raw.wheels[1].size).toEqual('regular');
    });
  });

  describe('attrMap', function() {
    it('should add an explicit mapping that maps a server response property to a model property and viceversa', function() {
      serializer.dsl().attrMap('brand', 'full_brand');

      var result = {};
      serializer.decode(result, { full_brand: 'Trek SA' }, '');
      expect(result.fullBrand).toBeUndefined();
      expect(result.brand).toEqual('Trek SA');

      result = serializer.encode(result, '');
      expect(result.brand).toBeUndefined();
      expect(result.full_brand).toEqual('Trek SA');
    });

    it('should properly run property decoders and encoders', function() {
      serializer.dsl().attrMap('brand', 'full_brand');
      serializer.dsl().attrDecoder('brand', function(_v) { return _v.split('.'); });
      serializer.dsl().attrEncoder('brand', function(_v) { return _v.join('.'); });

      var result = {};
      serializer.decode(result, { full_brand: 'MainGroup.Bicicles.Trek' }, '');
      expect(result.brand instanceof Array).toBeTruthy();

      result = serializer.encode(result, '');
      expect(typeof result.full_brand).toEqual('string');
    });

    it('should consider masks', function() {
      serializer.dsl().attrMap('brand', 'full_brand');
      serializer.dsl().attrMask('brand', 'R');

      var result = {};
      serializer.decode(result, { full_brand: 'Trek SA' }, 'R');
      expect(result.brand).toBeUndefined();

      result.brand = 'Trek';
      result = serializer.encode(result, 'C');
      expect(result.full_brand).toEqual('Trek');
    });

    it('should allow nested server properties', function() {
      serializer.dsl().attrMap('brand', 'brand.full_name');

      var result = {};
      serializer.decode(result, { brand: { full_name: 'Giant' } }, '');
      expect(result.brand).toEqual('Giant');

      result = serializer.encode(result, '');
      expect(result.brand.full_name).toEqual('Giant');
    });

    it('should properly handle null parent when processing nested properties', function() {
      var spy = jasmine.createSpy();

      serializer.dsl().attrMap('brand', 'brand.full_name');
      serializer.dsl().attrDecoder('brand', spy);

      serializer.decode({}, null, '');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow mapping to a server property inside an ignored property', function() {
      serializer.dsl().attrMap('brandName', 'brand.full_name');
      serializer.dsl().attrMask('brand', true);

      var result = {};
      serializer.decode(result, { brand: { full_name: 'Giant' } }, '');
      expect(result.brandName).toEqual('Giant');

      result = serializer.encode(result, '');
      expect(result.brand.full_name).toEqual('Giant');
    });

    it('should work on array properties', function() {
      serializer.dsl().attrMap('allParts[].brand', 'brand_name');

      var result = {};
      serializer.decode(result, { allParts: [
        { brand_name: 'Shimano' },
        { brand_name: 'SRAM' }
      ] }, '');

      expect(result.allParts[0].brand).toEqual('Shimano');
      expect(result.allParts[1].brand).toEqual('SRAM');
    });

    it('should allow for a wildcard as server name to use encoded attribute name', function() {
      serializer.dsl().attrMap('fullBrand', '*');

      var result = {};
      serializer.decode(result, { fullBrand: 'Bianchi' }, '');
      expect(result.fullBrand).toEqual('Bianchi');

      result = serializer.encode(result, '');
      expect(result.fullBrand).toEqual('Bianchi');
    });

    it('should allow to set it as forced to force a property to be processed even if not set', function() {
      serializer.dsl().attrMap('gearRatio', '*', true);
      serializer.dsl().attrEncoder('gearRatio', function() { return this.calculateGearRatio(); });

      var result = { calculateGearRatio: function() { return 24/36; } };
      result = serializer.encode(result, '');
      expect(result.gearRatio).toEqual(24/36);
    });
  });

  describe('attrVolatile', function() {

    it('should remove attribute after encoding', function() {
      serializer.dsl().attrVolatile('gearRatio');
      var source = { gearRatio: 24/36 },
          result = serializer.encode(source, '');
      expect(result.gearRatio).toBeDefined();
      expect(source.gearRatio).toBeUndefined();
    });

    it('should work on nested attributes', function() {
      serializer.dsl().attrVolatile('stats.gearRatio');
      var source = { stats: { gearRatio: 24/36 } },
          result = serializer.encode(source, '');
      expect(result.stats.gearRatio).toBeDefined();
      expect(source.stats.gearRatio).toBeUndefined();
    });

    it('should work on nested arrays', function() {
      serializer.dsl().attrVolatile('stats[].gearRatio');
      var source = { stats: [{ gearRatio: 24/36 }] },
          result = serializer.encode(source, '');
      expect(result.stats[0].gearRatio).toBeDefined();
      expect(source.stats[0].gearRatio).toBeUndefined();
    });
  });
});

