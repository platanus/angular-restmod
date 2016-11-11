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

  describe('feed', function() {

    it('shouldnt fail if packer not initialized', function() {
      expect(function() {
        packerCache.feed("test", []);
      }).not.toThrow();
    });

    it('should feed data if passed as array at start', function() {
      packerCache.feed('bikes', [ { id: 1, model: 'Meta' }, { id: 2, model: 'Slash' } ]);
      var bike = packerCache.resolve(Bike.$new(1));
      expect(bike.model).toEqual('Meta');
    });

    it('should feed data if passed as object at start', function() {
      packerCache.feed('bikes', { id: 3, model: 'Mango' });
      var bike = packerCache.resolve(Bike.$new(3));
      expect(bike.model).toEqual('Mango');
    });

    it('should feed array is passed after array', function() {
      packerCache.feed('bikes', [ { id: 4, model: 'Apple' }, { id: 5, model: 'Mango' } ]);
      packerCache.feed('bikes', [ { id: 6, model: 'Banana' }, { id: 7, model: 'Dates' } ]);
      var bike = packerCache.resolve(Bike.$new(4)),
          bike2 = packerCache.resolve(Bike.$new(6));
      expect(bike.model).toEqual('Apple');
      expect(bike2.model).toEqual('Banana');
    });

    it('should feed object is passed after array', function() {
      packerCache.feed('bikes', [ { id: 8, model: 'Apple' }, { id: 9, model: 'Mango' } ]);
      packerCache.feed('bikes', { id: 10, model: 'Banana' });
      var bike = packerCache.resolve(Bike.$new(8)),
          bike2 = packerCache.resolve(Bike.$new(10));
      expect(bike.model).toEqual('Apple');
      expect(bike2.model).toEqual('Banana');
    });

    it('should feed array is passed after object', function() {
      packerCache.feed('bikes', { id: 11, model: 'Banana' });
      packerCache.feed('bikes', [ { id: 12, model: 'Apple' }, { id: 13, model: 'Mango' } ]);
      var bike = packerCache.resolve(Bike.$new(12)),
          bike2 = packerCache.resolve(Bike.$new(11));
      expect(bike.model).toEqual('Apple');
      expect(bike2.model).toEqual('Banana');
    });

    it('should feed object is passed after object', function() {
      packerCache.feed('bikes', { id: 14, model: 'Apple' });
      packerCache.feed('bikes', { id: 15, model: 'Banana' });
      var bike = packerCache.resolve(Bike.$new(14)),
          bike2 = packerCache.resolve(Bike.$new(15));
      expect(bike.model).toEqual('Apple');
      expect(bike2.model).toEqual('Banana');
    });

    it('should resolve with latest object fed', function() {
      packerCache.feed('bikes', { id: 16, model: 'Apple' });
      packerCache.feed('bikes', { id: 16, model: 'Banana' });
      var bike = packerCache.resolve(Bike.$new(16));
      expect(bike.model).toEqual('Banana');
    });

    it('should return false if passed data is invalid', function() {
      var ret = packerCache.feed('bikes', "Invalid");
      expect(ret).toEqual(false);
    });

  });

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