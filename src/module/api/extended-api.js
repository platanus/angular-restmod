'use strict';

RMModule.factory('RMExtendedApi', ['$q', 'RMPackerCache', function($q, packerCache) {

  /**
   * @class ExtendedApi
   *
   * @description
   *
   * Provides a common framework **on top** of the {@link RecordApi} and {@link CollectionApi}.
   *
   * @property {boolean} $resolved The collection resolve status, is undefined on intialization
   */
  return {

    // override decode to detect resolution of resource
    $decode: function(_raw, _mask) {
      if(this.$resolved === false && this.$clear) this.$clear(); // clear if not resolved.
      this.$super(_raw, _mask);
      this.$resolved = true;
      return this;
    },

    /// Misc common methods

    /**
     * @memberof ExtendedApi#
     *
     * @description
     *
     * Unpacks and decode raw data from a server generated structure.
     *
     * ATTENTION: do not override this method to change the object wrapping strategy,
     * instead, override the static {@link Model.$unpack} method.
     *
     * @param  {mixed} _raw Raw server data
     * @param  {string} _mask 'CRU' mask
     * @return {ExtendedApi} this
     */
    $unwrap: function(_raw, _mask) {
      try {
        packerCache.prepare();
        _raw = this.$type.unpack(this, _raw);
        return this.$decode(_raw, _mask);
      } finally {
        packerCache.clear();
      }
    },

    /**
     * @memberof ExtendedApi#
     *
     * @description
     *
     * Encode and packs object into a server compatible structure that can be used for PUT/POST operations.
     *
     * ATTENTION: do not override this method to change the object wrapping strategy,
     * instead, override the static {@link Model.$pack} method.
     *
     * @param  {string} _mask 'CRU' mask
     * @return {string} raw data
     */
    $wrap: function(_mask) {
      var raw = this.$encode(_mask);
      raw = this.$type.pack(this, raw);
      return raw;
    },

    /**
     * @memberof ExtendedApi#
     *
     * @description Resets the resource's $resolved status.
     *
     * After being reset, calls to `$resolve` will execute a new $fetch.
     *
     * Also, if reset, resource will be cleared on new data.
     *
     * @return {ExtendedApi} self
     */
    $reset: function() {
      // cancel outside promise chain
      // TODO: find a way of only ignoring requests that will lead to resolution, maybe using action metadata
      return this.$cancel().$action(function() {
        this.$resolved = false;
      });
    },

    /**
     * @memberof ExtendedApi#
     *
     * @description Resolves the resource's contents.
     *
     * If already resolved then this method will return a resolved promise, if not then
     * it will initiate a `$fetch` operation and return the operation promise.
     *
     * This method will trigger a `before-resolve` event before checking the resolve status.
     *
     * @param  {object} _params `$fetch` params
     * @return {promise} Promise that resolves to the resource.
     */
    $resolve: function(_params) {
      return this.$action(function() { // chain resolution in request promise chain
        this.$dispatch('before-resolve', []);
        if(!this.$resolved) this.$fetch(_params);
      });
    },

    /**
     * @memberof ExtendedApi#
     *
     * @description Resets and fetches the resource contents.
     *
     * @param  {object} _params `$fetch` params
     * @return {ExtendedApi} self
     */
    $refresh: function(_params) {
      return this.$reset().$fetch(_params);
    }
  };

}]);