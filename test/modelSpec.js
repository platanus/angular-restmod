'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, Book;

  beforeEach(module('plRestmod'));

  // generate a dummy module
  beforeEach(module(function($provide) {
    $provide.factory('Book', function($restmod) {
      return $restmod('/api/books');
    });
  }));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Book = $injector.get('Book');

    // Initialize mock api
    $httpBackend.when('GET', '/api/books?minPages=100').respond([ {name: 'Los piratas del Caribe' }]);
    $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
    $httpBackend.when('POST', '/api/books').respond(200, { id: 1 });
  }));

  describe('$search', function() {

    it('should retrieve a collection of items of same type', function() {
      var books = Book.$search({ minPages: 100 });
      expect(books.length).toEqual(0);
      expect(books.$resolved).toBeFalsy();
      $httpBackend.flush();
      expect(books.length).toEqual(1);
      expect(books.$resolved).toBeTruthy();
      expect(books[0] instanceof Book).toBeTruthy();
    });

  });

  describe('$build', function() {

    it('should return book with a name', function() {
      var book = Book.$build({ name: 'Los piratas del Caribe' });
      expect(book.name).toEqual('Los piratas del Caribe');
    });

  });

  describe('$create', function() {

    it('should return book with a name', function() {
      $httpBackend.expectPOST('/api/books', {name: 'Los piratas del Caribe'});
      Book.$create({name: 'Los piratas del Caribe'});
      $httpBackend.flush();
    });

    it('should allow an empty response', function() {
      $httpBackend.expectPOST('/api/books', {name: 'Los piratas del Caribe'}).respond(200, '');
      Book.$create({name: 'Los piratas del Caribe'});
      $httpBackend.flush();
    });

    it('should assign an ID to the new resource', function() {
      var book = Book.$create({name: 'Los piratas del Caribe'});
      expect(book.id).toBeUndefined();
      $httpBackend.flush();
      expect(book.id).toEqual(1);
    });

    it('should bind to the new resource', function() {
      var book = Book.$create({name: 'Los piratas del Caribe'});
      expect(book.$isBound()).toEqual(false);
      $httpBackend.flush();
      expect(book.$isBound()).toEqual(true);
    });

  });

});

