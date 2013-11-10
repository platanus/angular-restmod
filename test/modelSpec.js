'use strict';

describe('Restmod model class:', function() {

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
    $httpBackend.when('GET', '/api/books?minPages=100').respond([ {name: 'Los piratas del Caribe' }]);
    $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
    $httpBackend.when('POST', '/api/books').respond(200, { id: 1 });
  }));

  // TODO: move $search, $build and $create to the collectionSpec

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

    it('should infer the key when not used an explicit one', function(){
      var book = Book.$build(1);
      expect(book.id).toEqual(1);
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
      expect(book.$url()).toEqual(null);
      $httpBackend.flush();
      expect(book.$url()).toEqual('/api/books/1');
    });

  });

  describe('$decode', function() {

    it('should rename all snake case attributes by default', function() {
      var book = Book.$build();
      book.$decode({ snake_case: true });
      expect(book.snake_case).toBeUndefined();
      expect(book.snakeCase).toBeDefined();
    });

  });

  describe('$encode', function() {

    it('should rename all camel case attributes by default', function() {
      var book = Book.$build({ camelCase: true }),
          encoded = book.$encode();

      expect(encoded.camelCase).toBeUndefined();
      expect(encoded.camel_case).toBeDefined();
    });

  });

  describe('$fetch', function() {

    it('should call callbacks in proper order', inject(function($restmod) {
      var calls = [],
          Bike = $restmod.model('/api/books', function() {
            this.on('before-fetch', function() { calls.push('bf'); })
                .on('before-request', function() { calls.push('br'); })
                .on('after-request', function() { calls.push('ar'); })
                .on('after-fetch', function() { calls.push('af'); })
          });

      Bike.$build({ id: 1 }).$fetch();
      $httpBackend.flush();
      expect(calls).toEqual(['bf','br','ar','af']);
    }));
  });

  describe('$save', function() {

    it('should call callbacks in proper order', inject(function($restmod) {
      var calls = [],
          Bike = $restmod.model('/api/books', function() {
            this.on('before-save', function() { calls.push('bs'); })
                .on('before-create', function() { calls.push('bc'); })
                .on('before-request', function() { calls.push('br'); })
                .on('after-request', function() { calls.push('ar'); })
                .on('after-create', function() { calls.push('ac'); })
                .on('after-save', function() { calls.push('as'); });
          });

      Bike.$build({ camelCase: true }).$save();
      $httpBackend.flush();
      expect(calls).toEqual(['bs','bc','br','ar','ac','as']);
    }));

  });

});

