'use strict';

describe("Restmod model instance", function() {

  var restmod,
      httpBackend,
      Book,
      Chapter;

  beforeEach(module('plRestmod'));

  beforeEach(inject(function($restmod, $httpBackend) {
    restmod = $restmod;
    httpBackend = $httpBackend;

    // Initialize a couple of model types
    Chapter = restmod('/api/chapters');
    Book = restmod('/api/books', {chapters: {hasMany: Chapter}});
  }));

  describe('hasMany relation', function() {

    describe('when retrieving inlined relation data', function() {

      beforeEach(function() {
        httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
      });

      it("should load inline data into relation", function() {
        var book = Book.$find(1);
        httpBackend.flush();
        expect(book.chapters().length).toEqual(1);
        expect(book.chapters()[0] instanceof Chapter).toBeTruthy();
      });

    });

  });

});

