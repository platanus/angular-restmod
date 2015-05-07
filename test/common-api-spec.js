'use strict';

describe('Restmod model class:', function() {

  var $httpBackend, restmod, $rootScope, $q, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    restmod = $injector.get('restmod');
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    Bike = restmod.model('/api/bikes');
    query = Bike.$collection();
  }));

  describe('$asPromise', function() {

    it('should always resolve to the resource instance', function() {
      var defered = $q.defer(), bike = Bike.$new(), spy = jasmine.createSpy();

      bike.$then(function() {
        return defered.promise;
      });

      bike.$asPromise().then(spy);
      defered.resolve('notabike');
      $rootScope.$apply();
      expect(spy).toHaveBeenCalledWith(bike);
    });

    it('should not update internal promise if new promise is generated', function() {
      var $bike = Bike.$new();
      $bike.$asPromise();
      expect($bike.$promise).toBeUndefined();
    });

    it('should return a new promise if no promise available', function() {
      var $bike = Bike.$new();
      expect($bike.$asPromise()).not.toBe(null);
    });

  });

  describe('$send', function() {

    beforeEach(function() {
      $httpBackend.when('GET','/api/bikes/1').respond(200, { last: false });
      $httpBackend.when('GET','/api/bikes/2').respond(200, { last: true });
      $httpBackend.when('GET','/api/bikes/3').respond(404);
      $httpBackend.when('POST','/api/bikes').respond(422);
    });

    it('should execute request in FIFO order', function() {
      var bike = Bike.$new();
      bike.$send({ method: 'GET', url: '/api/bikes/1' });
      bike.$send({ method: 'GET', url: '/api/bikes/2' });
      $httpBackend.flush();

      expect(bike.$response.data.last).toEqual(true);
    });

    it('should execute request event if last request failed', function() {
      var bike = Bike.$new();
      bike.$send({ method: 'GET', url: '/api/bikes/3' });
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

    it('should properly propagate success states to $then', function() {
      var bike = Bike.$new();
      var spy = jasmine.createSpy('callback');
      bike.$send({ method: 'GET', url: '/api/bikes/2' }).$then(spy, null);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalled();
    });

    it('should resolve to error if containing action is canceled', function() {
      var bike = Bike.$new();
      var spy = jasmine.createSpy('callback');
      bike.$$action = {}
      bike.$send({ method: 'GET', url: '/api/bikes/2' }).$then(null, spy);
      bike.$$action.canceled = true;
      $httpBackend.flush();
      expect(spy).toHaveBeenCalled();
    });

    it('should properly propagate error states to $then', function() {
      var bike = Bike.$new();
      var spy = jasmine.createSpy('callback');
      bike.$send({ method: 'POST', url: '/api/bikes' }).$then(null, spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$hasPendingActions', function() {
    it('should return true if there are pending requests', function() {
      var bike = Bike.$new(), defered = $q.defer();
      expect(bike.$hasPendingActions()).toEqual(false);
      bike.$action(function() { return defered.promise; });
      expect(bike.$hasPendingActions()).toEqual(true);
      defered.resolve(true);
      $rootScope.$apply();
      expect(bike.$hasPendingActions()).toEqual(false);
    });
  });

  describe('$cancel', function() {
    it('should cancel every pending action', function() {
      var bike = Bike.$new(), defered = $q.defer();
      bike.$action(function() { return defered.promise; });
      expect(bike.$hasPendingActions()).toEqual(true);
      bike.$cancel();
      expect(bike.$hasPendingActions()).toEqual(false);
    });
  });

  describe('$action', function() {

    it('should keep action in pending action list until its done', function() {
      var bike = Bike.$new(), defered = $q.defer();
      bike.$action(function() { return defered.promise; });
      expect(bike.$pending.length).toEqual(1);
      defered.resolve();
      $rootScope.$apply();
      expect(bike.$pending.length).toEqual(0);
    });

    it('should execute actions one by one', function() {
      var bike = Bike.$new(), defered = $q.defer(), test = false;
      bike.$action(function() { return defered.promise; });
      bike.$action(function() { test = true; });

      expect(test).toBe(false);
      defered.resolve();
      $rootScope.$apply();
      expect(test).toBe(true);
    });

    it('should remove action from pending list and reject promise if canceled', function() {
      var bike = Bike.$new(), spySuccess = jasmine.createSpy(), spyError = jasmine.createSpy(), defered = $q.defer();

      bike
        .$action(function() { return defered.promise; }) // this first action cannot be canceled since its runned immediatelly
        .$action(function() { return defered.promise; })
        .$then(spySuccess, spyError);

      bike.$cancel();
      defered.resolve();
      $rootScope.$apply();

      expect(bike.$pending.length).toEqual(0);
      expect(spySuccess).not.toHaveBeenCalled();
      expect(spyError).toHaveBeenCalled();
    });

    it('should cancel $send calls performed inside action', function() {
      var bike = Bike.$new(), spySuccess = jasmine.createSpy();

      bike.$action(function() {
        this.$send({ url: '/api/bikes/1', method: 'GET' }, spySuccess);
      }).$cancel();

      $httpBackend.when('GET','/api/bikes/1').respond(200, {});
      $httpBackend.flush();

      expect(spySuccess).not.toHaveBeenCalled();
    });

  });

  describe('$then', function() {

    it('should resolve promise returned by success callback before executing next success callback', function() {
      var bike = Bike.$new(), defered = $q.defer(), spy = jasmine.createSpy();

      bike.$then(function() {
        return defered.promise;
      }).$then(spy);

      $rootScope.$apply();
      expect(spy).not.toHaveBeenCalled();
      defered.resolve(bike);
      $rootScope.$apply();
      expect(spy).toHaveBeenCalled();
    });

    it('should properly handle nested calls', function() {
      var bike = Bike.$new(), defered = $q.defer(), spy = jasmine.createSpy();
      bike.$then(function() {
        this.$then(function() {
          return defered.promise;
        });
      }).$then(spy);

      expect(spy).not.toHaveBeenCalled();
      defered.resolve();
      $rootScope.$apply();
      expect(spy).toHaveBeenCalled();
    });

    it('should give callback return value priority over nested calls', function() {
      var bike = Bike.$new(), defered = $q.defer(), spy = jasmine.createSpy();
      bike.$then(function() {
        this.$then(function() {
          return defered.promise;
        });
        return 'resolved';
      }).$then(spy);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute callbacks in the resource context', function() {
      var bike = Bike.$new(), test;
      bike.$then(function() { test = this; });
      expect(test).toEqual(bike);
    });

    it('should honor decorated contexts', function() {
      var bike = Bike.$new(), spy = jasmine.createSpy();

      bike.$decorate({
        'test': spy,
      }, function() {
        this.$then(function() { this.$dispatch('test'); });
      });

      expect(spy).toHaveBeenCalled();
    });

    describe('when there is an unresolved promise', function() {
      var bike, defered;

      beforeEach(function() {
        bike = Bike.$new();
        defered = $q.defer();

        bike.$then(function() {
          return defered.promise;
        });
      });

      it('should execute callbacks in the resource context', function() {
        var test;
        bike.$then(function() { test = this; });
        defered.resolve();
        $rootScope.$apply();
        expect(test).toEqual(bike);
      });

      it('should properly handle nested calls', function() {
        var defered2 = $q.defer(), spy = jasmine.createSpy();
        bike.$then(function() {
          this.$then(function() {
            return defered2.promise;
          });
        }).$then(spy);

        defered.resolve();
        $rootScope.$apply();
        expect(spy).not.toHaveBeenCalled();
        defered2.resolve();
        $rootScope.$apply();
        expect(spy).toHaveBeenCalled();
      });

      it('should give callback return value priority over nested calls', function() {
        var defered2 = $q.defer(), spy = jasmine.createSpy();
        bike.$then(function() {
          this.$then(function() {
            return defered2.promise;
          });
          return 'teapot';
        }).$then(spy);

        expect(spy).not.toHaveBeenCalled();
        defered.resolve();
        $rootScope.$apply();
        expect(spy).toHaveBeenCalled();
      });

      it('should pass error information in $last property', function() {
        var test;
        bike.$then(null, function(_bike) {
          test = _bike.$last;
        });

        defered.reject('reason');
        $rootScope.$apply();
        expect(test).toEqual('reason');
      });

      it('should honor decorated contexts', function() {
        var spy = jasmine.createSpy();

        bike.$decorate({
          'test': spy,
        }, function() {
          this.$then(function() { this.$dispatch('test'); });
        });

        expect(spy).not.toHaveBeenCalled();
        defered.resolve();
        $rootScope.$apply();
        expect(spy).toHaveBeenCalled();
      });
    });

  });

  describe('$finally', function() {

    it('should be called on success', function() {
      var spy = jasmine.createSpy('callback');

      Bike.$find(1).$finally(spy);

      $httpBackend.when('GET','/api/bikes/1').respond(200, {});
      $httpBackend.flush();
      expect(spy).toHaveBeenCalled();
    });

    it('should be called on error', function() {
      var spy = jasmine.createSpy('callback');

      Bike.$find(1).$finally(spy);

      $httpBackend.when('GET','/api/bikes/1').respond(404);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalled();
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

  describe('$off', function() {

    it('should unregister a callback registered using $on', function() {
      var bike = Bike.$build(),
          spy = jasmine.createSpy('callback');

      bike.$on('poke', spy);
      bike.$dispatch('poke');
      expect(spy.calls.count()).toEqual(1);

      bike.$off('poke', spy);
      bike.$dispatch('poke');
      expect(spy.calls.count()).toEqual(1);
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

