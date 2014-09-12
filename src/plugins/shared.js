/**
 * @mixin SharedModel
 *
 * @description
 *
 * Enables caching instances by primary key so separate calls to $find will retrieve the same record instance.
 *
 * **This plugin is a work in progress and has not been tested**
 */

'use strict';

angular.module('restmod').factory('SharedModel', ['restmod', function(restmod) {
  return restmod.mixin(function() {

    var cache = {}; // keep one cache instance per type

    this
        // override scope.$new to return existing instances or update cache.
        .classDefine('$new', function(_key, _scope) {
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
}]);