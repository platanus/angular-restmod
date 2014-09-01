'use strict';

describe('Plugin: Dirty Model', function() {

  var bike;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('DirtyModel');
    $provide.factory('Bike', function(restmod) {
      return restmod.model('/api/bikes');
    });
  }));

  beforeEach(inject(function($httpBackend, Bike) {
    // generate a model instance with server loaded data:
    $httpBackend.when('GET', '/api/bikes/1').respond(200, { model: 'Meta 2', brandName: 'Commencal' });
    bike = Bike.$find(1);
    $httpBackend.flush();
  }));

  describe('`$dirty` function', function() {

    it('should detect when a server property changes', function() {
      expect(bike.$dirty('model')).toBe(false);
      bike.model = 'Meta AM';
      expect(bike.$dirty('model')).toBe(true);
    });

    it('should list changed properties', function() {
      bike.brandName = 'Commencal Bikes';
      expect(bike.$dirty()).toContain('brandName');
      expect(bike.$dirty()).not.toContain('model');
      bike.model = 'Meta AM';
      expect(bike.$dirty()).toContain('brandName');
      expect(bike.$dirty()).toContain('model');
    });

  });

  describe('$restore', function() {

    it('should restore a single property value', function() {
      bike.model = 'Trance';
      bike.brandName = 'Trek';
      bike.$restore('model');
      expect(bike.model).toEqual('Meta 2');
      expect(bike.brandName).toEqual('Trek');
    });

    it('should restore all properties values', function() {
      bike.model = 'Trance';
      bike.brandName = 'Trek';
      bike.$restore();
      expect(bike.model).toEqual('Meta 2');
      expect(bike.brandName).toEqual('Commencal');
    });

  });
});
