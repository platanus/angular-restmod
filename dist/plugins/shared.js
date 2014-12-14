/**
 * API Bound Models for AngularJS
 * @version v1.1.3 - 2014-11-06
 * @link https://github.com/angular-platanus/restmod
 * @author Ignacio Baixas <ignacio@platan.us>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

(function(angular, undefined) {
'use strict';
/**
 * @mixin SharedModel
 *
 * @description
 *
 * Enables caching instances by primary key so a resource with a given id will always refer to the same instance.
 */

angular.module('restmod').factory('SharedModel', ['restmod', function(restmod) {
  return restmod.mixin(function() {

    var cache = {}; // keep one cache instance per type

    this
        // override scope.$new to return existing instances or update cache.
        .define('Model.$new', function(_key, _scope) {
          if(_key) {
            // search for instance with same key, if key is found then return instance
            return cache[_key] || (cache[_key] = this.$super(_key, _scope));
          }

          return this.$super(_key, _scope);
        })
        // override record.$decode to update cache on decoding.
        .define('$decode', function(_raw, _mask) {
          var result = this.$super(_raw, _mask);
          if(result.$pk) cache[result.$pk] = this; // cache instance if $pk becomes available.
          return result;
        });
  });
}]);})(angular);