'use strict';

describe('Plugin: Dirty Model', function() {

  var bike;

  beforeEach(module('plRestmod'));

  beforeEach(module(function($provide, $restmodProvider) {
    $restmodProvider.pushModelBase('DirtyModel');
    $provide.factory('Bike', function($restmod) {
      return $restmod('/api/bikes');
    });
  }));

  beforeEach(inject(function($httpBackend, Bike) {
    // generate a model instance with server loaded data:
    $httpBackend.when('GET', '/api/bikes/1').respond(200, { model: 'Meta 2', brand: 'Commencal' });
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
      bike.brand = 'Commencal Bikes';
      expect(bike.$dirty()).toContain('brand');
      expect(bike.$dirty()).not.toContain('model');
      bike.model = 'Meta AM';
      expect(bike.$dirty()).toContain('brand');
      expect(bike.$dirty()).toContain('model');
    });

  });

});
