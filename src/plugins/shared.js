/**
 * @mixin SharedModel
 *
 * @description
 *
 * Enables caching instances by primary key so a resource with a given id will always refer to the same instance.
 */

'use strict';

angular.module('restmod').factory('SharedModel', ['restmod', function(restmod) {
  return restmod.mixin({
    $extend : {
      Model: {
        cache: {},
      }
    }
  }, function() {

    this
        // this will cache record by its type within cache, as apparently cache
        // variable as assigned above will be shared between models
        .define('Model.$cache', function(){
          var self = this;

          if(self.cache.hasOwnProperty(self.identity())) {
            return self.cache[self.identity()];
          } else {
            return self.cache[self.identity()] = {};
          }
        })
        .define('Model.$new', function(_key, _scope) {
          var self = this;

          if(_key) {
            // search for instance with same key, if key is found then return instance
            if(self.$cache().hasOwnProperty(_key)) {
              var cached = self.$cache()[_key];
              if(typeof _scope == 'object'){
	              cached.$scope = _scope;	     
              }
              return cached;
            } else {
              return (self.$cache()[_key] = this.$super(_key, _scope));
            }
          } else {

            return this.$super(_key, _scope);
          }
        })

        // override $decode to update cache on decoding.
        .define('Model.$decode', function(_raw, _mask) {
          var self = this,
              result = this.$super(_raw, _mask);

          if(result.$pk) {
            self.$cache()[result.$pk] = this;
          }

          return this.$super(_raw, _mask);
        });
  });        
}]);
