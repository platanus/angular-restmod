'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, $restmod, Book;

  beforeEach(module('plRestmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $restmod = $injector.get('$restmod');
    Book = $restmod.model('/api/books');

    // Initialize mock api
    $httpBackend.when('GET', '/api/books?minPages=100').respond([ {name: 'Los piratas del Caribe' }]);
    $httpBackend.when('GET', '/api/books/1').respond(200, '{"id": 1, "chapters": [{"id": 2}]}');
    $httpBackend.when('GET', '/api/books/2').respond(400, '{}');
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
      expect(book.$pk).toEqual(1);
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

  describe('$finally', function() {
    var spy;
    beforeEach(function() {
      spy = jasmine.createSpy();
    });

    it('should be called on success', function() {
      $httpBackend.when('GET','/bikes/1').respond(200, {});
      $restmod.model('/bikes').$find(1).$finally(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledWith();
    });

    it('should be called on error', function() {
      $httpBackend.when('GET','/bikes/1').respond(404);
      $restmod.model('/bikes').$find(1).$finally(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledWith();
    });

  });

  describe('$each', function() {

    it('should iterate over non system properties by default', function() {
      var bike = $restmod.model(null).$build({ brand: 'Trek' }), props = [];
      bike.$each(function(_val, _key) {
        props.push(_key);
      });

      expect(props).toContain('brand');
      expect(props).not.toContain('$pending');
      expect(props).not.toContain('$context');
    });

  });

  describe('$decode', function() {

    it('should rename all snake case attributes by default', function() {
      var bike = $restmod.model(null).$build();
      bike.$decode({ snake_case: true });
      expect(bike.snake_case).toBeUndefined();
      expect(bike.snakeCase).toBeDefined();
    });

    it('should rename nested values', function() {
      var bike = $restmod.model(null).$build();
      bike.$decode({ nested: { snake_case: true } });
      expect(bike.nested.snake_case).toBeUndefined();
      expect(bike.nested.snakeCase).toBeDefined();
    });

    it('should rename nested object arrays', function() {
      var bike = $restmod.model(null).$build();
      bike.$decode({ nested: [ { snake_case: true } ] });
      expect(bike.nested[0].snake_case).toBeUndefined();
      expect(bike.nested[0].snakeCase).toBeDefined();
    });

    it('should apply registered decoders', function() {
      var bike = $restmod.model(null, function() {
        this.attrDecoder('size', function(_val) { return _val === 'S' ? 'small' : 'regular'; });
      }).$build();

      bike.$decode({ size: 'S' });
      expect(bike.size).toEqual('small');
    });

    it('should apply decoders to nested values', function() {
      var bike = $restmod.model(null, function() {
        this.attrDecoder('user.name', function(_name) { return 'Mr. ' + _name; });
      }).$build();

      bike.$decode({ user: { name: 'Petty' } });
      expect(bike.user.name).toEqual('Mr. Petty');
    });

    it('should apply decoders to values in nested arrays', function() {
      var bike = $restmod.model(null, function() {
        this.attrDecoder('users.name', function(_name) { return 'Mr. ' + _name; });
      }).$build();

      bike.$decode({ users: [{ name: 'Petty' }] });
      expect(bike.users[0].name).toEqual('Mr. Petty');
    });

  });

  describe('$encode', function() {

    it('should rename all camel case attributes by default', function() {
      var book = Book.$build({ camelCase: true }),
          encoded = book.$encode();

      expect(encoded.camelCase).toBeUndefined();
      expect(encoded.camel_case).toBeDefined();
    });

    it('should rename nested values', function() {
      var bike = $restmod.model(null).$build({ user: { lastName: 'Peat' } }),
          raw = bike.$encode();

      expect(raw.user.lastName).toBeUndefined();
      expect(raw.user.last_name).toBeDefined();
    });

    it('should apply registered encoders', function() {
      var bike = $restmod.model(null, function() {
        this.attrEncoder('size', function(_val) { return _val === 'small' ? 'S' : 'M'; });
      }).$build({ size: 'small' });

      expect(bike.$encode().size).toEqual('S');
    });

    it('should not encode objects with a toJSON implementation', function() {
      var now = new Date(),
          bike = $restmod.model(null).$build({ created: now }),
          raw = bike.$encode();

      expect(raw.created instanceof Date).toBeTruthy();
    });

    it('should ignore relations', function() {
      var User = $restmod.model(null),
          bike = $restmod
            .model(null, { user: { hasOne: User } })
            .$buildRaw({ user: { name: 'Petty' }, size: 'M'}),
          raw = bike.$encode();

      expect(raw.user).toBeUndefined();
    });

  });

  describe('$fetch', function() {

    it('should call callbacks in proper order', inject(function($restmod) {
      var calls = [],
          Bike = $restmod.model('/api/books', function() {
            this.on('before-fetch', function() { calls.push('bf'); })
                .on('before-request', function() { calls.push('br'); })
                .on('after-request', function() { calls.push('ar'); })
                .on('after-fetch', function() { calls.push('af'); });
          });

      Bike.$build({ id: 1 }).$fetch();
      $httpBackend.flush();
      expect(calls).toEqual(['bf','br','ar','af']);
    }));

    it('should call error callbacks in proper order', inject(function($restmod) {
      var calls = [],
          Bike = $restmod.model('/api/books', function() {
            this.on('before-fetch', function() { calls.push('bf'); })
                .on('before-request', function() { calls.push('br'); })
                .on('after-request-error', function() { calls.push('are'); })
                .on('after-fetch-error', function() { calls.push('afe'); });
          });

      Bike.$build({ id: 2 }).$fetch();
      $httpBackend.flush();
      expect(calls).toEqual(['bf','br','are','afe']);
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

  describe('$on', function() {

    it('should register a callback at instance level', inject(function($restmod) {
      var Bike = $restmod.model('/api/books'),
          bike1 = Bike.$build({ }),
          bike2 = Bike.$build({ }),
          calls = [];

      bike1.$on('poke', function() { calls.push('bs1'); });
      bike1.$callback('poke');
      bike2.$callback('poke');

      expect(calls).toEqual(['bs1']);
    }));

  });
});

