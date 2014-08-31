'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('restmod'));

  var Utils, SubArray, $log;

  beforeEach(inject(function($injector) {
    Utils = $injector.get('RMUtils');
    $log = $injector.get('$log');
  }));

  describe('format', function() {
    it('should work with no arguments', function() {
      expect(Utils.format('test $1')).toEqual('test $1');
    });

    it('should properly format a string', function() {
      expect(Utils.format('im $1 $2', ['a', 'teapot'])).toEqual('im a teapot');
    });
  });

  describe('assert', function() {
    it('should log error and raise excepction if condition is false', function() {
      expect(function() {
        Utils.assert(false, 'an $1', 'error');
      }).toThrow();

      expect($log.error.logs.length).toEqual(1);
    });

    it('should do nothing if condition is true', function() {
      expect(function() {
        Utils.assert(true, 'an $1', 'error');
      }).not.toThrow();
    });
  });

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

