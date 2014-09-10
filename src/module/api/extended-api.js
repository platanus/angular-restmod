'use strict';

RMModule.factory('RMExtendedApi', ['$q', function($q) {

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
      this.$cancel(); // TODO: find another way of ignoring pending requests that will lead to resolution
      this.$resolved = false;
      return this;
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
      var _this = this;
      return this.$then(function() { // chain resolution in request promise chain
        _this.$dispatch('before-resolve', []);
        if(_this.$resolved) {
          return _this;
        } else {
          _this.$promise = null; // force fetch to run (this could use a separate function)
          return _this.$fetch(_params).$promise;
        }
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