'use strict';

describe('Restmod collection:', function() {

  var restmod, $rootScope, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    $rootScope = $injector.get('$rootScope');

    Bike = restmod.model('/api/bikes');
  }));

  describe('$reset', function() {
    it('should set the $resolved flag to false', function() {
      var bike = Bike.$new(1);
      bike.$resolved = true;
      bike.$reset();
      expect(bike.$resolved).toBe(false);
    });

    it('should make the next call to $decode clear old items', function() {
      var bikes = Bike.$collection();
      bikes.$decode([ { name: 'nomad' }, { name: 'bronson' } ]);
      bikes.$decode([]);
      expect(bikes.length).toEqual(2);
      bikes.$reset();
      expect(bikes.length).toEqual(2);
      bikes.$decode([]);
      expect(bikes.length).toEqual(0);
    });

  });

  describe('$resolved', function() {
    it('should evaluate to false by default', function() {
      var bike = Bike.$new(1);
      expect(bike.$resolved).toBeFalsy();
    });

    it('should be set to true by decode', function() {
      var bike = Bike.$new(1);
      bike.$decode({ name: 'nomad' });
      expect(bike.$resolved).toBeTruthy();
    });
  });

  describe('$resolve', function() {
    it('should skip $fetch if already resolved', function() {
      var bike = Bike.$new(1);
      spyOn(bike, '$fetch').and.callThrough();

      bike.$decode({ name: 'nomad' }).$resolve();
      expect(bike.$fetch).not.toHaveBeenCalled();
    });

    it('should trigger a call to $fetch if not resolved', function() {
      var bike = Bike.$new(1);
      spyOn(bike, '$fetch').and.callThrough();

      bike.$resolve();
      expect(bike.$fetch).toHaveBeenCalled();
    });

    it('should trigger a call to $fetch if reset', function() {
      var bike = Bike.$new(1);
      spyOn(bike, '$fetch').and.callThrough();

      bike.$decode({ name: 'nomad' }).$reset().$resolve();
      expect(bike.$fetch).toHaveBeenCalled();
    });

  });

});

