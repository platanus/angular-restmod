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
      var bike = Bike.single('my-bike');
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

  describe('define', function() {
    it('should add a method to the model record prototype by default', function() {
      var Bike = restmod.model(null, function() {
        this.define('test', function() { return 'ok'; });
      });

      expect(Bike.$new().test).toBeDefined();
      expect(Bike.$new().test()).toEqual('ok');
    });

    it('should add a method to the proper api', function() {

      var fun = function() { };

      var Bike = restmod.model(null, function() {
        this.define('test1', fun);
        this.define('Record.test2', fun);
        this.define('Model.test3', fun);
        this.define('Collection.test4', fun);
        this.define('Scope.test5', fun);
        this.define('Resource', {
          test6: fun
        });
        this.define('Dummy.test7', fun);
        this.define('List.test8', fun);
      });

      expect(Bike.$new().test1).toBeDefined();
      expect(Bike.test1).not.toBeDefined();
      expect(Bike.$new().test2).toBeDefined();
      expect(Bike.test3).toBeDefined();
      expect(Bike.test4).not.toBeDefined();
      expect(Bike.$collection().test4).toBeDefined();
      expect(Bike.test5).toBeDefined();
      expect(Bike.$collection().test5).toBeDefined();
      expect(Bike.$new().test5).not.toBeDefined();
      expect(Bike.$new().test6).toBeDefined();
      expect(Bike.dummy().test6).toBeDefined();
      expect(Bike.dummy().test7).toBeDefined();
      expect(Bike.list().test8).toBeDefined();
      expect(Bike.$collection().test8).toBeDefined();
    });
  });

  describe('setProperty', function() {
    beforeEach(function() {
      Bike = restmod.model('/bikes', function() {
        this.setProperty('test', 'test');
      });
    });

    it('should set the internal model property', function() {
      expect(Bike.getProperty('test')).toEqual('test');
    });
  });

  // Object definition spec

  describe('OD prefix: @', function() {

    it('should register a new scope method', function() {
      var Bike = restmod.model(null, {
        '@scopeMethod': function() {
          return 'teapot';
        }
      });

      expect(Bike.scopeMethod()).toEqual('teapot');
      expect(Bike.$collection().scopeMethod()).toEqual('teapot');
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

  describe('OD model configuration format: IM_A_VAR', function() {
    it('should set a property value ', function() {
      var Bike = restmod.model(null, {
        'PRIMARY_KEY': '_id'
      });

      expect(Bike.getProperty('primaryKey')).toEqual('_id');
    });
  });

  // Builtin object modifiers

  describe('mask', function() {
    it('should register a new mask ', function() {
      var Bike = restmod.model(null, {
        foo: { mask: 'CU' }
      });

      var bike = Bike.$build({ foo: 'bar' }).$encode('CU');
      expect(bike.foo).toBeUndefined();
    });
  });

});

