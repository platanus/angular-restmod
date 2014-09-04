'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('restmod'));

  var Bike;
  var restmod, $httpBackend;
  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', '/api/bikes/1').respond(200, { 'dropper_seat': true });
  }));

  describe('setProperty', function() {
    beforeEach(function() {
      Bike = restmod.model(function() {
        this.setProperty('path', '/bikes')
            .setProperty('test', 'test');
      });
    });

    it('should set the internal model property', function() {
      expect(Bike.$getProperty('test')).toEqual('test');
    });
  });

  describe('setUrlPrefix', function() {

    beforeEach(function() {
      Bike = restmod.model(function() {
        this.setProperty('path', '/bikes')
            .setUrlPrefix('/api');
      });
    });

    it('should change the url prefix for model base url', function() {
      expect(Bike.$url()).toEqual('/api/bikes');
    });

    it('should change the url prefix for objects generated using $single', function() {
      var bike = Bike.$single('my-bike');
      expect(bike.$url()).toEqual('/api/my-bike');
    });
  });

  describe('setPrimaryKey', function() {
    beforeEach(function() {
      Bike = restmod.model(function() {
        this.setProperty('path', '/bikes')
            .setPrimaryKey('my_id');
      });
    });

    it('should change the property used to resolve an objects primary key', function() {
      var bike = Bike.$buildRaw({ my_id: 'key' });
      expect(bike.$pk).toEqual('key');
    });
  });

  // Object definition spec

  describe('OD prefix: @', function() {
    it('should register a new class ', function() {
      var Bike = restmod.model({
        '@classMethod': function() {
          return 'teapot';
        }
      });

      expect(Bike.classMethod()).toEqual('teapot');
    });
  });

  describe('OD prefix: ~', function() {
    it('should register a new hook callback ', function() {
      var Bike = restmod.model({
        '~afterFeed': function() {
          this.teapot = true;
        }
      });

      var bike = Bike.$build().$decode({});
      expect(bike.teapot).toBeTruthy();
    });
  });

  describe('OD model configuration format: IM_A_VAR', function() {
    it('should set a property value ', function() {
      var Bike = restmod.model({
        'PRIMARY_KEY': '_id'
      });

      expect(Bike.$getProperty('primaryKey')).toEqual('_id');
    });
  });

});

