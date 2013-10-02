'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('plRestmod'));

  describe('when configuring', function() {
    // TODO configuration specs
  });

  describe('when building', function() {

    // TODO: test more building options.

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

