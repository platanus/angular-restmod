'use strict';

describe('Plugin: Debounced Model', function() {

  beforeEach(module('plRestmod'));

  beforeEach(module(function($provide, $restmodProvider) {
    $restmodProvider.pushModelBase('DebouncedModel');
    $provide.factory('Bike', function($restmod) {
      return $restmod.model('/api/bikes');
    });
  }));

  describe('`$save` function', function() {
    it('should generate only one request when called consecutivelly', inject(function($timeout, $httpBackend, Bike) {
      var bike = Bike.$build({ id: 1, brand: 'Trek' });
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Giant' }).respond(200, '');
      bike.$save();
      bike.$save();
      bike.brand = 'Giant';
      bike.$save();
      $timeout.flush();
      $httpBackend.flush();
    }));
  });

  describe('`$saveNow` function', function() {
    it('should generate cancel previous debounced requests and request inmediately', inject(function($timeout, $httpBackend, Bike) {
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Trek' }).respond(200, '');
      $httpBackend.expectPUT('/api/bikes/1', { id: 1, brand: 'Giant' }).respond(200, '');

      var bike = Bike.$build({ id: 1, brand: 'Trek' });
      bike.$save();
      bike.$saveNow();
      bike.brand = 'Giant';
      bike.$saveNow();
      $httpBackend.flush();
    }));
  });

  // TODO: test debounce options
});
