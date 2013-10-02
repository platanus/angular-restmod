'use strict';

describe('Restmod model instance:', function() {

  var $httpBackend, Book, Chapter;

  beforeEach(module('plRestmod'));

  // generate a dummy module
  beforeEach(module(function($provide) {
    $provide.factory('Book', function($restmod) {
      return $restmod('/api/books', { chapters: { hasMany: 'Chapter' } });
    });

    $provide.factory('Chapter', function($restmod) {
      return $restmod('/api/chapters');
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Book = $injector.get('Book');
    Chapter = $injector.get('Chapter');
  }));

  describe('hasMany relation', function() {

    describe('when retrieving inlined relation data', function() {

      beforeEach(function() {
        $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
      });

      it('should load inline data into relation', function() {
        var book = Book.$find(1);
        $httpBackend.flush();
        expect(book.chapters().length).toEqual(1);
        expect(book.chapters()[0] instanceof Chapter).toBeTruthy();
      });

    });

  });

});

