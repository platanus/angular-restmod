'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('plRestmod'));

  describe('when configuring', function() {

    describe('setAttributeRenaming', function() {

      describe('when false is passed', function() {

        beforeEach(module(function($restmodProvider) {
          $restmodProvider.setAttributeRenaming(false);
        }));

        it('should disable renaming', inject(function($restmod, $httpBackend) {
          var Book = $restmod('/api/books');
          $httpBackend.when('GET', '/api/books/1').respond(200, { snake_case: true });
          var book = Book.$find(1);
          $httpBackend.flush();
          expect(book.snake_case).toBeDefined();
          expect(book.snakeCase).not.toBeDefined();
        }));
      });

      describe('when object is passed', function() {

        beforeEach(module(function($restmodProvider) {
          $restmodProvider.setAttributeRenaming({
            decode: function(_name) { return '_' + _name; },
            encode: function(_name) { return _name.substr(1); }
          });
        }));

        it('should change renaming logic', inject(function($restmod, $httpBackend) {
          var Book = $restmod('/api/books');
          $httpBackend.when('GET', '/api/books/1').respond(200, { noUndercore: true });
          var book = Book.$find(1);
          $httpBackend.flush();
          expect(book._noUndercore).toBeDefined();
          expect(book.no_leading_underscore).not.toBeDefined();
        }));
      });

    });

  });

  describe('when building', function() {

    // TODO: test just the model builder, pass fake specs and test that are properly modified

    describe('using a base class', function() {

      // generate a dummy base  module
      beforeEach(module(function($provide) {
        $provide.factory('Base', function($restmod) {
          return $restmod(null, {
            coverSize: { init: 20 },
            getPages: function() {
              return this.pages || 0;
            }
          });
        });
      }));

      it('should inherit properties', inject(function($restmod, Base) {
        var book = $restmod('api/books', Base).$build();
        expect(book.getPages).toBeDefined();
        var otherBook = $restmod('api/books').$build();
        expect(otherBook.getPages).not.toBeDefined();
      }));

      it('should support overriding properties', inject(function($restmod, Base) {
        var book = $restmod('api/books', Base, { coverSize: { init: 30 } }).$build();
        expect(book.getPages).toBeDefined();
        expect(book.coverSize).toEqual(30);
      }));

      it('should support injector resolving', inject(function($restmod) {
        var book = $restmod('api/books', 'Base').$build();
        expect(book.getPages).toBeDefined();
      }));

    });

  });

});

