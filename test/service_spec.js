'use strict';

describe('Restmod model class:', function() {

  var $restmod;

  beforeEach(module('plRestmod'));
  beforeEach(inject(function($injector) {
    $restmod = $injector.get('$restmod');
  }));

  describe('model', function() {
    it('should create a resource', function() {
      var Bike = $restmod.model('/user/bike', {}, {});
      expect(Bike.$baseUrl).toEqual('/user/bike');
      expect(Bike.$chain.length).toEqual(2);
    });
  });

  describe('mixin', function() {
    it('should create a mixin module', function() {
      var Bike = $restmod.mixin({}, {});
      expect(Bike.$chain.length).toEqual(2);
    });
  });

  describe('singleton', function() {
    it('should create a singleton resource', function() {
      var bike = $restmod.singleton('/user/bike', {}, {});
      expect(bike.$url()).toEqual('/user/bike');
      expect(bike.$type.$chain.length).toEqual(2);
    });
  });
});

