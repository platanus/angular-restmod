'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('restmod'));

  var Utils, SubArray;

  beforeEach(inject(function($injector) {
    Utils = $injector.get('RMUtils');
  }));

  describe('buildArrayType', function() {

    beforeEach(function() {
      Array.prototype.imateapot = function() { return true; };
      SubArray = Utils.buildArrayType();
    });

    it('should return true for angular.isArray', function() {
      expect(angular.isArray(new SubArray())).toBeTruthy();
    });

    it('should propertly keep length synched', function() {
      var array = new SubArray();
      expect(array.length).toEqual(0);
      array[1] = true;
      expect(array.length).toEqual(2);
      array.length = 1;
      expect(array[1]).toBeUndefined();
    });

    it('should transfer extended array prototype functions to new type', function() {
      var array = new SubArray();
      expect(array.imateapot).toBeDefined();
    });

    it('should isolate each type prototype', function() {
      var SubArray2 = Utils.buildArrayType();
      SubArray2.prototype.imonlyin2 = function() {};

      expect([].imonlyin2).toBeUndefined();
      expect(new SubArray().imonlyin2).toBeUndefined();
      expect(new SubArray2().imonlyin2).toBeDefined();
    });

  });
});

