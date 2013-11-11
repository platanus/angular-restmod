'use strict';

describe('Restmod model collection:', function() {

  var $httpBackend, Book;

  beforeEach(module('plRestmod'));

  // generate a dummy module
  beforeEach(module(function($provide) {
    $provide.factory('Book', function($restmod) {
      return $restmod.model('/api/books');
    });
  }));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Book = $injector.get('Book');

    // Initialize mock api
    $httpBackend.when('GET', '/api/books?keywords=pirate').respond([ {name: 'Los piratas del Caribe' }, { name: 'The Pirate King' }]);
    $httpBackend.when('GET', '/api/books?keywords=bikes').respond([ {name: 'Mastering Mountain bike skills' }]);
  }));

  describe('$fetch', function() {

    var query;

    beforeEach(function() {
      query = Book.$collection({ keywords: 'pirate' });
    });

    it('should retrieve a collection of items of same type', function() {
      expect(query.$pending).toBe(false);
      query.$fetch();
      expect(query.$pending).toBe(true);
      expect(query.length).toEqual(0);
      expect(query.$resolved).toBe(false);
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      expect(query.$resolved).toBe(true);
      expect(query[0] instanceof Book).toBeTruthy();
    });

    it('should append new items if called again', function() {
      query = query.$fetch();
      $httpBackend.flush();
      expect(query.$resolved).toBe(true);
      expect(query.length).toEqual(2);
      query.$fetch({ keywords: 'bikes' });
      $httpBackend.flush();
      expect(query.length).toEqual(3);
    });

  });

  describe('$reset', function() {

    it('should make the next call to $fetch clear old items', function() {
      var query = Book.$collection({ keywords: 'pirate' });
      query.$fetch();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      query.$reset().$fetch({ keywords: 'bikes' });
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

  describe('$refresh', function() {

    it('should clear old items on resolve', function() {
      var query = Book.$collection({ keywords: 'pirate' });
      query.$fetch();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      query.$refresh({ keywords: 'bikes' });
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

});

