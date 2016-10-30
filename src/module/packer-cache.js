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
   * Use the `feed` method to add new raw data to cache. You can feed array of objects or a singl object.
   * It supports indexed and non-indexed cache feeding based on the 3rd paramter either `pk` is passed or not.
   * If you pass `pk` e.g. 'id' cache will be managed with indexing, with indexed cache you can append more 
   * data to cache store.
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
     * @param {array} _raw Raw record data as an array of objects or a single object
     * @param {string} _pk Primary key field name, most of the time it wil lbe id, used for indexing
     */
    feed: function(_name, _raw, _pk) {

      if(!packerCache) {this.prepare();}
      if(!packerCache.hasOwnProperty(_name)) {packerCache[_name] = {'indexed': true};}
      var indexed = (_pk !== undefined && packerCache[_name].indexed);

      if(indexed){
        if(angular.isArray(_raw)){
          for(var i = 0, l = _raw.length; i < l; i++){
            this.feed(_name, _raw[i], _pk);
          }
        }else{
          packerCache[_name] = packerCache[_name] || {};
          packerCache[_name][_raw[_pk]] = _raw;
        }
      }else{
        if(angular.isArray(_raw)){
          packerCache[_name] = _raw;
        }else{
          packerCache[_name] = [_raw];
        }
      }

      packerCache[_name].indexed = indexed;

    },

    // IDEA: feedSingle: would require two step resolve many -> single

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
          if(cache.indexed && cache[_record.$pk]){
            _record.$decode(cache[_record.$pk]);
          }else{
            for(var i = 0, l = cache.length; i < l; i++) {
              if(_record.$pk === modelType.inferKey(cache[i])) { // this could be sort of slow? nah
                _record.$decode(cache[i]);
                break;
              }
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