'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, $restmod, Bike, query;

  beforeEach(module('plRestmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $restmod = $injector.get('$restmod');
    Bike = $restmod.model('/api/bikes');
    query = Bike.$collection();
  }));

  describe('$send', function() {
    // TODO!
  });

  describe('$cancel', function() {
    // TODO!
  });

  describe('$then', function() {
    // TODO!
  });

  describe('$finally', function() {

    it('should be called on success', function() {
      var spy = jasmine.createSpy('callback');

      Bike.$find(1).$finally(spy);

      $httpBackend.when('GET','/api/bikes/1').respond(200, {});
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledWith();
    });

    it('should be called on error', function() {
      var spy = jasmine.createSpy('callback');

      Bike.$find(1).$finally(spy);

      $httpBackend.when('GET','/api/bikes/1').respond(404);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledWith();
    });
  });

  describe('$on', function() {

    it('should register a callback at instance level', function() {
      var bike1 = Bike.$build(),
          bike2 = Bike.$build(),
          spy = jasmine.createSpy('callback');

      bike1.$on('poke', spy);
      bike2.$dispatch('poke');
      expect(spy).not.toHaveBeenCalled();

      bike1.$dispatch('poke');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('$dispatch', function() {
    // TODO!
  });

  describe('$decorate', function() {

    it('should register a callback at decorated context level', function() {
      var bike = Bike.$build(), arg;

      bike.$decorate({
        poke: function(_arg) { arg = _arg; }
      }, function() {
        bike.$dispatch('poke', [1]);
      });

      expect(arg).toEqual(1);
      bike.$dispatch('poke', [2]);
      expect(arg).toEqual(1);
    });

    it('should return the decorated function return value', function() {
      var bike = Bike.$build();
      var ret = bike.$decorate({ }, function() {
        return 'hello';
      });

      expect(ret).toEqual('hello');
    });
  });

});

