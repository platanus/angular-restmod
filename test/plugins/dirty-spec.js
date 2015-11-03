'use strict';

describe('Plugin: Dirty Model', function() {
  var bike;
  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('DirtyModel');
    $provide.factory('Bike', function(restmod) {
      return restmod.model('/api/bikes', {
        serialNo: { init: 'HCMU9' }
      });
    });
  }));

  beforeEach(inject(function($httpBackend, Bike) {
    bike = Bike.$new(1).$extend({ category: 'enduro' });
  }));

  describe('`$dirty` function', function() {
    it('considers default values as pristine values', function() {
      expect(bike.serialNo).toBe('HCMU9');
      expect(bike.$dirty('serialNo')).toBe(false);
    });

    it('detects when default property changes', function() {
      bike.serialNo = '7VUb5';
      expect(bike.$dirty('serialNo')).toBe(true);
    });

    it('considers extended properties as dirty', function() {
      expect(bike.$dirty('category')).toBe(true);
      bike.color = 'red';
      expect(bike.$dirty('color')).toBe(true);
      expect(bike.$dirty()).toEqual(['category', 'color']);
    });

    describe('fetching data', function() {
      beforeEach(inject(function($httpBackend) {
        $httpBackend.when('GET', '/api/bikes/1').respond(200, { model: 'Meta 2', brandName: 'Commencal' });
        bike.$fetch();
        $httpBackend.flush();
      }));

      it('sets pristine state for responded properties', function() {
        expect(bike.$dirty('serialNo')).toBe(false);
        expect(bike.$dirty('model')).toBe(false);
        expect(bike.$dirty('brandName')).toBe(false);
        expect(bike.$dirty('category')).toBe(true);
      });

      it('detects when a server property changes', function() {
        bike.model = 'Meta AM';
        expect(bike.$dirty('model')).toBe(true);
      });

      it('shows changed properties array', function() {
        expect(bike.$dirty()).toEqual(['category']);
        bike.brandName = 'Commencal Bikes';
        expect(bike.$dirty()).toEqual(['category', 'brandName']);
        bike.serialNo = 'TRDOF';
        expect(bike.$dirty()).toEqual(['serialNo', 'category', 'brandName']);
      });
    });
  });

  describe('$restore', function() {
    beforeEach(inject(function($httpBackend) {
      $httpBackend.when('GET', '/api/bikes/1').respond(200, { model: 'Meta 2', brandName: 'Commencal' });
      bike.$fetch();
      $httpBackend.flush();
    }));

    it('restores a single property value', function() {
      bike.model = 'Trance';
      bike.brandName = 'Trek';
      bike.$restore('model');
      expect(bike.model).toEqual('Meta 2');
      expect(bike.brandName).toEqual('Trek');
    });

    it('restores extended properties to undefined', function() {
      bike.$restore('category');
      expect(bike.category).toBe(undefined);
    });

    it('restores all properties values', function() {
      bike.serialNo = 'TRDOF';
      bike.model = 'Trance';
      bike.$restore();
      expect(bike.serialNo).toEqual('HCMU9');
      expect(bike.model).toEqual('Meta 2');
    });
  });
});
