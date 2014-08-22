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

  describe('setUrlPrefix', function() {

    beforeEach(function() {
      Bike = restmod.model('/bikes', function() {
        this.setUrlPrefix('/api');
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
      Bike = restmod.model('/bikes', function() {
        this.setPrimaryKey('my_id');
      });
    });

    it('should change the property used to resolve an objects primary key', function() {
      var bike = Bike.$buildRaw({ my_id: 'key' });
      expect(bike.$pk).toEqual('key');
    });
  });

  describe('setProperty', function() {
    beforeEach(function() {
      Bike = restmod.model('/bikes', function() {
        this.setProperty('test', 'test');
      });
    });

    it('should set the internal model property', function() {
      expect(Bike.$getProperty('test')).toEqual('test');
    });
  });

  describe('disableRenaming', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', function() {
        this.disableRenaming();
      });
    });

    it('should disable renaming', function() {
      var bike = Bike.$find(1);
      $httpBackend.flush();
      expect(bike.dropperSeat).not.toBeDefined();
      expect(bike.dropper_seat).toBeDefined();
    });
  });

  describe('setNameDecoder', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', function() {
        this.setNameDecoder(function(_name) { return '_' + _name; });
      });
    });

    it('should change name decoding', function() {
      var bike = Bike.$find(1);
      $httpBackend.flush();
      expect(bike._dropper_seat).toBeDefined();
      expect(bike.dropper_seat).not.toBeDefined();
    });
  });

  describe('setNameEncoder', function() {

    beforeEach(function() {
      Bike = restmod.model('/api/bikes', function() {
        this.setNameDecoder(function(_name) { return _name.substr(1); });
      });
    });

    it('should change name encoding', function() {
      // var bike = Bike.$build(1);
      // $httpBackend.flush();
      // expect(bike._noUndercore).toBeDefined();
    });
  });

  // Object definition spec

  describe('OD prefix: @', function() {
    it('should register a new class ', function() {
      var Bike = restmod.model(null, {
        '@classMethod': function() {
          return 'teapot';
        }
      });

      expect(Bike.classMethod()).toEqual('teapot');
    });
  });

  describe('OD prefix: ~', function() {
    it('should register a new hook callback ', function() {
      var Bike = restmod.model(null, {
        '~afterFeed': function() {
          this.teapot = true;
        }
      });

      var bike = Bike.$build().$decode({});
      expect(bike.teapot).toBeTruthy();
    });
  });

  describe('OD model configuration format: __X__', function() {
    it('should set a property value ', function() {
      var Bike = restmod.model(null, {
        '__primaryKey__': '_id'
      });

      expect(Bike.$getProperty('primaryKey')).toEqual('_id');
    });
  });

});

