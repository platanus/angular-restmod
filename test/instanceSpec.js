'use strict';

describe('Restmod model behavior modifiers:', function() {

  var $httpBackend, Book, Chapter, Page;

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
        pageCount: { init: 10 },
        chapters: { hasMany: 'Chapter', inverseOf: 'book' },
        pages: { hasMany: 'Page'}
      });
    });

    $provide.factory('Chapter', function($restmod) {
      return $restmod.model('/api/chapters');
    });

    $provide.factory('Page', function($restmod) {
      return $restmod.model(null);
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    Book = $injector.get('Book');
    Chapter = $injector.get('Chapter');
    Page = $injector.get('Page');
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

  describe('hasMany relation', function() {

    describe('when fetching a relation', function() {
        beforeEach(function() {
          $httpBackend.when('GET', '/api/books/1/chapters').respond(200, '[{"id": 2, "name": "The Second"}, {"id": 3, "name": "The third"}]');
        });

        it('should use proper route to fetch relation items', function() {
          var chapters = Book.$build({ id: 1 }).chapters.$fetch();
          $httpBackend.flush();
          expect(chapters.length).toEqual(2);
          expect(chapters[0] instanceof Chapter).toBeTruthy();
        });

        it('should use set the inverseOf property', function() {
          var book = Book.$build({ id: 1 }),
              chapters = book.chapters.$fetch();

          $httpBackend.flush();
          expect(chapters[0].book).toEqual(book);
        });
    });

    describe('when retrieving inlined relation data', function() {

      beforeEach(function() {
        $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
      });

      it('should load inline data into relation', function() {
        var book = Book.$find(1);
        $httpBackend.flush();
        expect(book.chapters.length).toEqual(1);
        expect(book.chapters[0] instanceof Chapter).toBeTruthy();
      });

    });

    describe('when retrieving inlined relation data with no private key', function() {

      beforeEach(function() {
        $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}], "pages": [{"number": 1}]}');
      });

      it('should load inline data into relation', function() {
        var book = Book.$find(1);
        $httpBackend.flush();
        expect(book.pages.length).toEqual(1);
        expect(book.pages[0] instanceof Page).toBeTruthy();
        expect(book.pages[0].$url()).toBeNull();
      });

    });

  });

});

