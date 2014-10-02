'use strict';

describe('Plugin: Find Many plugin', function() {

  var Bike, $httpBackend;

  beforeEach(module('restmod'));

  beforeEach(inject(function(restmod, $injector) {
    Bike = restmod.model('/api/bikes', 'restmod.FindMany');
    $httpBackend = $injector.get('$httpBackend');
  }));

  describe('$populate', function() {

    it('should build proper request and populate records', function() {
      var bikes = [
        Bike.$new(1),
        Bike.$new(2)
      ];

      Bike.$populate(bikes);
      $httpBackend.expectGET('/api/bikes?ids=1&ids=2').respond(200, [ { id: 1, brand: 'Giant' }, { id: 2, brand: 'Yetti' } ]);
      $httpBackend.flush();

      expect(bikes[0].brand).toEqual('Giant');
      expect(bikes[1].brand).toEqual('Yetti');
    });

    it('should include additional parameters in request', function() {
      var bikes = [ Bike.$new(1) ];

      Bike.$populate(bikes, { include: 'parts' });
      $httpBackend.expectGET('/api/bikes?ids=1&include=parts').respond(200, []);
      $httpBackend.flush();
    });

    it('should not repeat ids in request, but should populate repeated records separatedly', function() {
      var bikes = [
        Bike.$new(1),
        Bike.$new(1),
        Bike.$new(2)
      ];

      Bike.$populate(bikes);
      $httpBackend.expectGET('/api/bikes?ids=1&ids=2').respond(200, [ { id: 1, brand: 'Giant' }, { id: 2, brand: 'Yetti' } ]);
      $httpBackend.flush();

      expect(bikes[0].brand).toEqual('Giant');
      expect(bikes[1].brand).toEqual('Giant');
    });

    it('should not request resolved records', function() {
      var bikes = [
        Bike.$new(1),
        Bike.$new(2).$decode({ brand: 'Yetti' })
      ];

      Bike.$populate(bikes);
      $httpBackend.expectGET('/api/bikes?ids=1').respond(200, [ { id: 1, brand: 'Giant' } ]);
      $httpBackend.flush();
    });

    it('should call $decode only once in shared instances', function() {
      var bike = Bike.$new(1);
      spyOn(bike, '$decode').and.callThrough();

      Bike.$populate([ bike, bike ]);
      $httpBackend.expectGET('/api/bikes?ids=1').respond(200, [ { id: 1, brand: 'Giant' } ]);
      $httpBackend.flush();

      expect(bike.$decode.calls.count()).toEqual(1);
    });

  });

});
