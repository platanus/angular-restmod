'use strict';

describe('Restmod collection:', function() {

  var restmod, $httpBackend, $rootScope, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');

    Bike = restmod.model('/api/bikes');
    query = Bike.$collection({ brand: 'trek' });

    // mock api
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $httpBackend.when('GET', '/api/bikes?brand=trek').respond([ { model: 'Slash' }, { model: 'Remedy' } ]);
    $httpBackend.when('GET', '/api/bikes?brand=giant').respond([ { model: 'Reign' } ]);
  }));

  describe('$fetch', function() {

    it('should retrieve a collection of items of same type', function() {
      query.$fetch();
      expect(query.length).toEqual(0);
      expect(query.$resolved).toBeFalsy();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      expect(query.$resolved).toBe(true);
      expect(query[0] instanceof Bike).toBeTruthy();
    });

    it('should append new items if called again', function() {
      query = query.$fetch();
      $httpBackend.flush();
      expect(query.$resolved).toBe(true);
      expect(query.length).toEqual(2);
      query.$fetch({ brand: 'giant' });
      $httpBackend.flush();
      expect(query.length).toEqual(3);
    });

    it('should call $then callbacks after fetch completes (Issue #154)', function() {
      var queryLen;
      query = query.$search().$then(function() {
        queryLen = query.length;
      });
      $httpBackend.flush();
      expect(queryLen).toEqual(2);
    });

  });

  describe('$clear', function() {

    it('should remove every item on the collection', function() {
      query.$fetch();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      query.$clear();
      expect(query.length).toEqual(0);
    });

  });

  describe('$build', function() {

    it('should not add resource to collection by default', function() {
      query.$build({ model: 'Teocali' });
      expect(query.length).toEqual(0);
    });

  });

  describe('$create', function() {

    it('should add resource to collection after success', function() {
      query.$create({ model: 'Teocali' });
      expect(query.length).toEqual(0);
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

  describe('$add', function() {

    it('should add a new object to the back of the array and trigger after-add', function() {
      var col = Bike.$collection(),
          spy = jasmine.createSpy('callback');

      col.$on('after-add', spy);
      col.$add(Bike.$build());

      expect(col.length).toEqual(1);
      expect(spy).toHaveBeenCalled();
    });

    it('should add a new object to the specified index if index is provided', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(obj, 1);

      expect(col[1]).toEqual(obj);
    });
  });

  describe('$remove', function() {

    it('should remove an object if already in the array and triger after-remove', function() {
      var col = Bike.$collection(),
          obj = Bike.$build(),
          spy = jasmine.createSpy('callback');

      col.$on('after-remove', spy);
      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());
      col.$remove(obj);

      expect(col.length).toEqual(2);
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$indexOf', function() {

    it('should return index if object found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(1);
    });

    it('should return -1 if object not found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(-1);
    });


    it('should return index if object found when searching using a function', function() {
      var col = Bike.$collection(),
          obj = Bike.$build({ brand: 'Giant' });

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(function(_obj) {
        return _obj.brand === 'Giant';
      })).toEqual(1);
    });

  });

  describe('$decode', function() {

    it('should load the decoded contents into the collection', function() {
      var bikes = restmod.model('/api/bikes').$collection();
      bikes.$decode([ { brand: 'YT' } ]);
      expect(bikes.length).toEqual(1);
      expect(bikes.$resolved).toBeTruthy();
      expect(bikes[0].brand).toEqual('YT');
    });

    it('should fire the after-feed-many event', function() {
      var bikes = restmod.model('/api/bikes').$collection();
      var spy = jasmine.createSpy();
      bikes.$on('after-feed-many', spy);
      bikes.$decode([ { brand: 'YT' } ]);
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$encode', function() {

    it('should decode the collection contents', function() {
      var Bike = restmod.model('/api/bikes'),
          bikes = Bike.$collection();
      bikes.$add(Bike.$new(1).$extend({ brand: 'YT' }));
      expect(bikes.$encode().length).toEqual(1);
      expect(bikes.$encode()[0].brand).toEqual('YT');
    });

    it('should fire the before-render-many event', function() {
      var bikes = restmod.model('/api/bikes').$collection();
      var spy = jasmine.createSpy();
      bikes.$on('before-render-many', spy);
      bikes.$encode();
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$unwrap', function() {

    it('should call the type\'s unpack method', function() {
      spyOn(Bike, 'unpack').and.returnValue([]);
      var bikes = Bike.$collection();

      var raw = [{}];
      bikes.$unwrap(raw);
      expect(Bike.unpack).toHaveBeenCalledWith(bikes, raw);
    });

    it('should call $decode', function() {
      var bikes = Bike.$collection();
      spyOn(bikes, '$decode');
      bikes.$unwrap([{}]);
      expect(bikes.$decode).toHaveBeenCalled();
    });

  });

});

