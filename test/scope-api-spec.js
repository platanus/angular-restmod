'use strict';

describe('Restmod scope api:', function() {

  var restmod, $httpBackend, Bike;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    $httpBackend = $injector.get('$httpBackend');
    Bike = restmod.model('/api/bikes');
  }));

  describe('$urlFor', function() {
    it('return a valid url if resource $pk is 0', function() {
      expect(Bike.$urlFor(Bike.$new(0))).not.toBeNull();
    });
  });

  describe('$collection', function() {
    // TODO.
  });

  describe('$search', function() {
    it('should retrieve a collection of items of same type', function() {
      var bikes = Bike.$search();
      $httpBackend.expectGET('/api/bikes').respond(200, [ { model: 'Reign' } ]);
      $httpBackend.flush();
      expect(bikes[0] instanceof Bike).toBeTruthy();
    });

    it('should accept parameters to be passed as query strings', function() {
      Bike.$search({ brand: 'giant', wheel: 29 });
      $httpBackend.expectGET('/api/bikes?brand=giant&wheel=29').respond(200, []);
      $httpBackend.flush();
    });
  });

  describe('$new', function() {
    it('should initialize model with given primary key', function() {
      var bike = Bike.$new(20);
      expect(bike.$pk).toEqual(20);
    });
  });

  describe('$build', function() {
    it('should initialize model with given object properties', function() {
      var bike = Bike.$build({ model: 'Teocali' });
      expect(bike.model).toEqual('Teocali');
    });

    it('should not infer $pk', function() {
      var bike = Bike.$build({ id: 5, model: 'Teocali' });
      expect(bike.$pk).not.toBeDefined();
    });
  });

  describe('$create', function() {
    it('should build and save', function() {
      Bike.$create({ model: 'Teocali' });
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
    });

    it('should allow an empty response', function() {
      Bike.$create({ model: 'Teocali' });
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '');
      $httpBackend.flush();
    });

    it('should assign a $pk to the new resource', function() {
      var bike = Bike.$create({ model: 'Teocali' });
      expect(bike.id).toBeUndefined();
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(bike.$pk).toEqual(1);
    });

    it('should bind to the new resource to an url', function() {
      var bike = Bike.$create({ model: 'Teocali' });
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(bike.$url()).toEqual('/api/bikes/1');
    });
  });

  describe('$find', function() {
    it('should retrieve an item by id', function() {
      var bike = Bike.$find(1);
      $httpBackend.expectGET('/api/bikes/1').respond(200, { brand: 'Trek' });
      $httpBackend.flush();
      expect(bike.brand).toEqual('Trek');
    });

    it('should accept additional parameters to be passed in the query string', function() {
      var bike = Bike.$find(1, { include: 'parts' });
      $httpBackend.expectGET('/api/bikes/1?include=parts').respond(200, { brand: 'Trek' });
      $httpBackend.flush();
      expect(bike.brand).toEqual('Trek');
    });
  });
});

