'use strict';

describe('Plugin: Dirty Model', function() {

  var bike;

  beforeEach(module('restmod'));

  describe('with disabled plugin', function() {
    beforeEach(module(function($provide, restmodProvider) {
      restmodProvider.rebase('DirtyModel');
      $provide.factory('Bike', function(restmod) {
        return restmod.model('/api/bikes', { model: { init: 'Meta 2' } });
      });
    }));

    beforeEach(inject(function(Bike) {
      bike = Bike.$new(1);
    }));

    it('raise error trying to execute $dirty method', function() {
      expect(function() { bike.$dirty(); }).toThrowError(Error, /dirty/);
    });

    it('raise error trying to execute $restore method', function() {
      expect(function() { bike.$restore(); }).toThrowError(Error, /dirty/);
    });
  });

  describe('with enabled plugin', function() {
    beforeEach(module(function($provide, restmodProvider) {
      restmodProvider.rebase('DirtyModel');
      $provide.factory('Bike', function(restmod) {
        return restmod.model('/api/bikes', {
          $config: { dirty: true },

          model: { init: 'Meta 2' },
          brandName: { init: 'Commencal' },
          customisations: { init: { wheels: 2, seat: { material: 'lycra' } } },
          colours: { init: { frame: 'red' } },
          stickers: { init: ['bmx', 'bandits'] }
        });
      });
    }));

    beforeEach(inject(function(Bike) {
      bike = Bike.$new(1);
    }));

    describe('`$dirty` function', function() {
      it('considers default values as pristine values', function() {
        expect(bike.model).toBe('Meta 2');
        expect(bike.$dirty('model')).toBe(false);
        expect(bike.customisations.seat.material).toBe('lycra');
        expect(bike.$dirty('customisations.seat.material')).toBe(false);
        expect(bike.$dirty()).toEqual([]);
      });

      it('considers extended properties as dirty', function() {
        bike.$extend({ category: 'enduro' });
        bike.color = 'red';

        expect(bike.$dirty('category')).toBe(true);
        expect(bike.$dirty('color')).toBe(true);
        expect(bike.$dirty()).toEqual(['category', 'color']);
      });

      it('detects simple property changes', function() {
        bike.model = 'Meta AM';
        expect(bike.$dirty('model')).toBe(true);
        expect(bike.$dirty()).toEqual(['model']);
      });

      it('lists changes on nested objects', function() {
        bike.brandName = 'BMX';
        expect(bike.$dirty()).not.toContain('customisations.wheels');

        bike.customisations.wheels = 3;
        bike.colours.frame = 'green';
        expect(bike.$dirty()).toContain('customisations.wheels');
        expect(bike.$dirty()).toContain('colours.frame');

        bike.customisations.seat.material = 'leather';
        expect(bike.$dirty()).toContain('customisations.seat.material');
      });

      it('compares arrays', function() {
        bike.brandName = 'BMX';
        expect(bike.$dirty()).not.toContain('stickers');
        bike.stickers.pop();
        expect(bike.$dirty()).toContain('stickers');
      });

      it('detects missing object properties', function() {
        bike.customisations = null;
        expect(bike.$dirty()).toContain('customisations');
      });

      it('detects properties that change type from object', function() {
        bike.customisations = 0;
        expect(bike.$dirty()).toContain('customisations');
      });

      it('avoids changes on child properties when parent object changes', function() {
        bike.customisations = null;
        expect(bike.$dirty('customisations.wheels')).toBeFalsy();

        bike.model = { name: 'Meta', version: '2' };
        expect(bike.$dirty('model.name')).toBeFalsy();
      });

      it('compares with comparator function', function() {
        bike.brandName = 'Brand Name';
        expect(bike.$dirty('brandName', function (newVal, oldVal) {
          return [oldVal, newVal].join(' ') === 'Commencal Brand Name';
        })).toBe(true);

        bike.customisations.wheels = 3;
        expect(bike.$dirty('customisations.wheels', function (newVal, oldVal) {
          return newVal * oldVal > 5;
        })).toBe(true);
      });

      it('allows you to pass comparator as first argument', function() {
        bike.colours.frame = 'Brown';
        bike.brandName = 'BMX';
        bike.model = 'Strider';

        expect(bike.$dirty(function (newVal) {
          return angular.isString(newVal) && newVal.match(/^B/);
        }).length).toEqual(2);
      });

      describe('fetching data', function() {
        beforeEach(inject(function($httpBackend) {
          $httpBackend.when('GET', '/api/bikes/1').respond(200, {
            model: 'Meta 3',
            stickers: ['cool']
          });
          bike.$fetch();
          $httpBackend.flush();
        }));

        it('sets pristine state for responded properties', function() {
          expect(bike.model).toBe('Meta 3');
          expect(bike.$dirty('model')).toBe(false);
          expect(bike.stickers).toEqual(['cool']);
          expect(bike.$dirty('stickers')).toBe(false);
        });
      });
    });

    describe('$restore', function() {
      it('restores simple property', function() {
        bike.brandName = 'Giant';
        bike.$restore('brandName');
        expect(bike.brandName).toEqual('Commencal');
      });

      it('restores nested property', function() {
        bike.customisations.wheels = 4;
        bike.customisations.seat.material = 'leather';
        bike.$restore('customisations.wheels');
        expect(bike.customisations.wheels).toEqual(2);
        expect(bike.customisations.seat.material).toEqual('leather');
      });

      it('restores an entire nested object', function() {
        bike.customisations.wheels = 8;
        bike.customisations.seat.material = 'cloth';
        bike.$restore('customisations');
        expect(bike.customisations.wheels).toEqual(2);
        expect(bike.customisations.seat.material).toEqual('lycra');
      });

      it('restores extended properties to undefined values', function() {
        bike.$extend({ category: 'enduro' });
        bike.color = 'red';

        bike.$restore('category');
        expect(bike.category).toBe(undefined);
        bike.$restore('color');
        expect(bike.category).toBe(undefined);
      });
    });
  });
});
