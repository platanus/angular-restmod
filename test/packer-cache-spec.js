'use strict';

describe('RMPackerCache', function() {

  var restmod, packerCache, Bike, Part;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    packerCache = $injector.get('RMPackerCache');

    Bike = restmod.model('/api/bikes', {
      NAME: 'bike'
    });

    Part = restmod.model('/api/parts', {
      NAME: 'part'
    });
  }));

  describe('restore', function() {

    it('shouldnt fail if packer not initialized', function() {
      expect(function() {
        packerCache.resolve(Bike.$new(1));
      }).not.toThrow();
    });

    describe('given data has been fed', function() {

      beforeEach(function() {
        packerCache.prepare();
        packerCache.feed('bikes', [ { id: 1, model: 'Meta' }, { id: 2, model: 'Slash' } ]);
      });

      it('should feed data if record id is found', function() {
        var bike = packerCache.resolve(Bike.$new(1));
        expect(bike.model).toEqual('Meta');
      });

      it('shouldnt feed data if record is not found', function() {
        var bike = packerCache.resolve(Bike.$new(4));
        expect(bike.model).toBeUndefined();
      });

      it('shouldnt feed data if record is not found', function() {
        var bike = packerCache.resolve(Bike.$new(4));
        expect(bike.model).toBeUndefined();
      });

      it('shouldnt fail if record type is not cached', function() {
        expect(function() {
          var part = packerCache.resolve(Part.$new(1));
          expect(part.model).toBeUndefined();
        }).not.toThrow();
      });

    });

  });

});