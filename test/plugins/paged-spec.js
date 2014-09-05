'use strict';

describe('Plugin: Paged Model', function() {

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('PagedModel');
    $provide.factory('Bike', function(restmod) {
      return restmod.model({ PATH: '/api/bikes' });
    });
  }));

  describe('using the Model\'s `$fetch` function with page header responses', function() {

    beforeEach(inject(function($httpBackend) {
      $httpBackend.when('GET', '/api/bikes').respond(200, [], { 'X-Page': '2', 'X-Page-Total': '5' });
    }));

    it('should provide the proper page and pageCount', inject(function($httpBackend, Bike) {
      var bikes = Bike.$search();
      expect(bikes.$getProperty('pageHeader')).toEqual('X-Page');
      expect(bikes.$getProperty('pageCountHeader')).toEqual('X-Page-Total');
      $httpBackend.flush();
      expect(bikes.$page).toEqual(2);
      expect(bikes.$pageCount).toEqual(5);
    }));
  });

});
