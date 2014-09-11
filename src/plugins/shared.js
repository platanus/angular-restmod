/**
 * @mixin SharedModel
 *
 * @description
 *
 * Usage:
 *
 * First add mixin to a model's mixin chain, the following config variables are available:
 * * DM_TIMEOUT: sets the debounce timeout, if 0 then debouncing is deactivated. Defaults to 500
 * * DM_ADJOURN: if true, then save operation is rescheduled on every $save call. Default to false
 *
 * ```javascript
 * var Bike = restmod.model('api/bikes', 'DebouncedModel', {
 *       // This is optional.
 *       DM_TIMEOUT: 100 // change timeout!
 *     }),
 *     bike = Bike.build({ id: 1, brand: 'Yeti' });
 * ```
 *
 * Then use `$save` as always
 *
 * ```javascript
 * // The following code will just generate 1 request
 * bike.$save();
 * bike.$save();
 * bike.$save();
 * ```
 *
 * Or with options
 *
 * ```javascript
 * bike.$save({ timeout: 0, adjourn: false });
 * // same as
 * bike.$saveNow();
 * ```
 *
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