'use strict';

RMModule.factory('RMPackerCache', [function() {

  var packerCache;

  /**
   * @class PackerCache
   *
   * @description
   *
   * The packer cache service enables packing strategies to register raw object data that can be then used by
   * supporting relations during the decoding process to preload other related resources.
   *
   * This is specially useful for apis that include linked objects data in external metadata.
   *
   * The packer cache is reset on every response unwrapping so it's not supposed to be used as an
   * application wide cache.
   *
   * ### For extension developers:
   *
   * Use the `feed` method to add new raw data to cache.
   *
   * ### For relation developers:
   *
   * Use the `resolve` method to inject cache data into a given identified record.
   *
   */
  return {
    /**
     * @memberof PackerCache#
     *
     * @description Feed data to the cache.
     *
     * @param {string} _name Resource name (singular)
     * @param {array} _rawRecords Raw record data as an array
     */
    feed: function(_name, _raw) {

      var self = this;
      if(!packerCache){ this.prepare(); }

      if(angular.isArray(_raw)){
        angular.forEach(_raw, function(_obj){
          self.feed(_name, _obj);
        });
      }else if(angular.isObject(_raw)){
        packerCache[_name] = packerCache[_name] || [];
        packerCache[_name].unshift(_raw);
      }else{
        return false;
      }

      return true;
    },

    /**
     * @memberof PackerCache#
     *
     * @description Searches for data matching the record's pk, if found data is then fed to the record using $decode.
     *
     * @param {RecordApi} _record restmod record to resolve, must be identified.
     * @return {RecordApi} The record, so call can be nested.
     */
    resolve: function(_record) {

      if(packerCache) { // make sure this is a packer cache enabled context.

        var modelType = _record.$type,
            cache = packerCache[modelType.identity(true)];

        if(cache && _record.$pk) {
          for(var i = 0, l = cache.length; i < l; i++) {
            if(_record.$pk === modelType.inferKey(cache[i])) { // this could be sort of slow? nah
              _record.$decode(cache[i]);
              break;
            }
          }
        }
      }

      return _record;
    },

    // private api method used by the unwrapper function.
    prepare: function() {
      packerCache = {};
    },

    // private api internal method used by the unwrapper function.
    clear: function() {
      packerCache = null;
    }
  };

}]);