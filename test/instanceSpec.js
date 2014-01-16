'use strict';

describe('Restmod model behavior modifiers:', function() {

  var $httpBackend, Book;

  beforeEach(module('plRestmod'));

  // generate a dummy module
  beforeEach(module(function($provide) {
    $provide.factory('Book', function($restmod) {
      return $restmod.model('/api/books', {
        createdAt: {
          init: function() { return new Date(); },
          decode: function(_v) { return new Date(); },
          encode: 'date'
        },
        pageCount: { init: 10 }
      });
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Book = $injector.get('Book');
  }));

  describe('attribute initializer', function() {
    it('should assign a initial value to an attribute', function() {
      var book = Book.$build();
      expect(book.pageCount).toEqual(10);
    });

    it('should dynamically assign a initial value to an attribute', function() {
      var book = Book.$build();
      expect(book.createdAt instanceof Date).toBeTruthy();
    });
  });

  describe('decoder', function() {
      beforeEach(function() {
        $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "created_at": "2007-10-10"}');
      });

      it('should modify de incomming value for an attribute', function() {
        var book = Book.$find(1);
        $httpBackend.flush();
        expect(book.createdAt instanceof Date).toBeTruthy();
      });
  });

  describe('serializer', function() {

  });

  describe('mask', function() {

  });
});

