'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('restmod'));

  describe('rebase', function() {

    beforeEach(module(function(restmodProvider) {
      restmodProvider.rebase({
        createdAt: { init: 10 }
      });
    }));

    it('should modify the mixin chain of every model', inject(function(restmod) {
      var bike = restmod.model('/api/bikes').$build({ brand: 'Merida' });
      expect(bike.createdAt).toBeDefined();
    }));
  });
});