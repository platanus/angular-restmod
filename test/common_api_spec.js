'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, $restmod, $rootScope, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $restmod = $injector.get('$restmod');
    $rootScope = $injector.get('$rootScope');
    Bike = $restmod.model('/api/bikes');
    query = Bike.$collection();
  }));

  describe('$send', function() {

    beforeEach(function() {
      $httpBackend.when('GET','/api/bikes/1').respond(200, { last: false });
      $httpBackend.when('GET','/api/bikes/2').respond(200, { last: true });
      $httpBackend.when('GET','/api/bikes/3').respond(404);
    });

    it('should execute request in FIFO order', function() {
      var bike = Bike.$new();
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      bike.$send({ method: 'GET', url: '/api/bikes/2' });
      $httpBackend.flush();

      expect(bike.$response.data.last).toEqual(true);
    });

    it('should properly update the $status property', function() {
      var bike = Bike.$new();
      expect(bike.$status).toBeUndefined();
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      expect(bike.$status).toEqual('pending');
      $httpBackend.flush();
      expect(bike.$status).toEqual('ok');

      bike.$send({ method: 'GET', url: '/api/bikes/3' });
      $rootScope.$digest(); // force digest, since this is a second request.
      expect(bike.$status).toEqual('pending');
      $httpBackend.flush();
      expect(bike.$status).toEqual('error');
    });

    it('should properly update the $pending property', function() {
      var bike = Bike.$new();
      expect(bike.$pending).toBeUndefined();
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      bike.$send({ method: 'GET', url: '/api/bikes/2' });
      expect(bike.$pending.length).toEqual(2);
      $httpBackend.flush();
      expect(bike.$pending.length).toEqual(0);
    });

  });

  describe('$hasPendingRequests', function() {
    it('should return true if there are pending requests', function() {
      var bike = Bike.$new();
      expect(bike.$hasPendingRequests()).toEqual(false);
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      expect(bike.$hasPendingRequests()).toEqual(true);
      $httpBackend.when('GET','/api/bikes/1').respond(200, {});
      $httpBackend.flush();
      expect(bike.$hasPendingRequests()).toEqual(false);
    });
  });

  describe('$cancel', function() {
    it('should cancel every pending request', function() {
      var bike = Bike.$new();
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      bike.$send({ method: 'GET', url: '/api/bikes/6' });

      expect(bike.$hasPendingRequests()).toEqual(true);
      bike.$cancel();
      expect(bike.$hasPendingRequests()).toEqual(false);
    });
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

