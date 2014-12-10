'use strict';

describe('Restmod list:', function() {

  var restmod, $httpBackend, Bike;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    $httpBackend = $injector.get('$httpBackend');
    Bike = restmod.model('/api/bikes');
  }));

  describe('$asList', function() {

    it('should retrieve a list with same contents as collection if called with no arguments', function() {
      var query = Bike.$collection().$decode([ { model: 'Slash' }, { model: 'Remedy' } ]);
      var list = query.$asList().$asList().$asList();
      expect(list.length).toEqual(2);
      expect(list[0]).toBe(query[0]);
      expect(list[1]).toBe(query[1]);
    });

    it('should wait for last aync operation before populating list', function() {
      $httpBackend.when('GET', '/api/bikes').respond([ { model: 'Slash' }, { model: 'Remedy' } ]);
      var list = Bike.$search().$asList().$asList();
      expect(list.length).toEqual(0);
      $httpBackend.flush();
      expect(list.length).toEqual(2);
    });

    it('should accept a transformation function as parameter', function() {
      $httpBackend.when('GET', '/api/bikes').respond([ { model: 'Slash' }, { model: 'Remedy' } ]);
      var list = Bike.$search().$asList(function(_original) {
        return [_original[1]];
      }).$asList();
      expect(list.length).toEqual(0);
      $httpBackend.flush();
      expect(list.length).toEqual(1);
    });

  });
});

