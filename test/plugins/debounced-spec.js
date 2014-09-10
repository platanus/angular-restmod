'use strict';

describe('Plugin: Debounced Model', function() {

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('DebouncedModel');
    $provide.factory('Bike', function(restmod) {
      return restmod.model('/api/bikes');
    });
  }));

  describe('`$save` function', function() {
    it('should generate only one request when called consecutivelly', inject(function($timeout, $httpBackend, Bike) {
      var bike = Bike.$buildRaw({ id: 1, brand: 'Trek' });
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Giant' }).respond(200, '');
      bike.$save();
      bike.$save();
      bike.brand = 'Giant';
      bike.$save();
      $timeout.flush();
      $httpBackend.flush();
    }));

    it('should fulfill all promises related to consecutive requests', inject(function($timeout, $httpBackend, Bike) {
      $httpBackend.when('PUT','/api/bikes/1').respond(200, '');

      var bike = Bike.$buildRaw({ id: 1, brand: 'Trek' }), successCount = 0;
      bike.$save().$then(function() { successCount++; });
      bike.$save().$then(function() { successCount++; });
      bike.$save().$then(function() { successCount++; });
      $timeout.flush();
      $httpBackend.flush();

      expect(successCount).toEqual(3);
    }));

    it('should leave the $promise property in a valid state', inject(function($timeout, $httpBackend, Bike) {

      $httpBackend.when('PUT','/api/bikes/1').respond(200, '');
      var bike = Bike.$buildRaw({ id: 1, brand: 'Trek' }), spy = jasmine.createSpy();

      bike.$save().$then(function() {
        return 'hello';
      });

      $timeout.flush();
      $httpBackend.flush();

      $timeout(function() {
        bike.$then(spy);
      });

      $timeout.flush();
      expect(spy).toHaveBeenCalledWith(bike);
    }));

    it('should leave the $promise property in a valid state', inject(function($timeout, $httpBackend, $q, Bike) {

      $httpBackend.when('PUT','/api/bikes/1').respond(400, '');
      var bike = Bike.$buildRaw({ id: 1, brand: 'Trek' }), spy = jasmine.createSpy();

      bike.$save().$then(null, function() {
        return $q.reject('hello');
      });

      $timeout.flush();
      $httpBackend.flush();

      $timeout(function() {
        bike.$then(null, spy);
      });

      $timeout.flush();
      expect(spy).toHaveBeenCalledWith(bike);
    }));
  });

  describe('`$saveNow` function', function() {
    it('should generate cancel previous debounced requests and request inmediately', inject(function($timeout, $httpBackend, Bike) {
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Trek' }).respond(200, '');
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Giant' }).respond(200, '');

      var bike = Bike.$buildRaw({ id: 1, brand: 'Trek' });
      bike.$save();
      bike.$saveNow();
      bike.brand = 'Giant';
      bike.$saveNow();
      $httpBackend.flush();
    }));
  });

  // TODO: test debounce options
});
