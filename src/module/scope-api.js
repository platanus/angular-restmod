'use strict';

RMModule.factory('RMScopeApi', [function() {

  /**
   * @class ScopeApi
   *
   * @description Common behaviour for record scopes.
   *
   * Record scopes are starting points for record operations (like base type or a collection)
   */
  return {

    /**
     * @memberof ScopeApi#
     *
     * @description Builds a new instance of this model, bound to this instance scope, sets its primary key.
     *
     * @param {mixed} _pk object private key
     * @return {Model} New model instance
     */
    $new: function(_pk) {
      return new (this.$type)(this, _pk);
    },

    /**
     * @memberof ScopeApi#
     *
     * @description Builds a new instance of this model, does not assign a pk to the created object.
     *
     * ATTENTION: item will not show in collection until `$save` is called. To reveal item before than call `$reveal`.
     *
     * @param  {object} _init Initial values
     * @return {Model} model instance
     */
    $build: function(_init) {
      return this.$new().$extend(_init);
    },

    /**
     * @memberof ScopeApi#
     *
     * @description Builds a new instance of this model using undecoded data.
     *
     * ATTENTION: does not automatically reveal item in collection, chain a call to $reveal to do so.
     *
     * @param  {object} _raw Undecoded data
     * @return {Model} model instance
     */
    $buildRaw: function(_raw) {
      var obj = this.$new(this.$type.$inferKey(_raw));
      obj.$decode(_raw);
      return obj;
    },

    /**
     * @memberof ScopeApi#
     *
     * @description Attempts to resolve a resource using provided private key.
     *
     * @param {mixed} _pk Private key
     * @return {Model} model instance
     */
    $find: function(_pk) {
      return this.$new(_pk).$fetch();
    },

    /**
     * @memberof ScopeApi#
     *
     * @description Builds and saves a new instance of this model
     *
     * @param  {object} _attr Data to be saved
     * @return {Model} model instance
     */
    $create: function(_attr) {
      return this.$build(_attr).$save();
    },

    /**
     * @memberof ScopeApi#
     *
     * @description Generates a new collection bound to this context and url and calls $fetch on it.
     *
     * @param {object} _params Collection parameters
     * @return {Collection} Model collection
     */
    $search: function(_params) {
      return this.$collection(_params).$fetch();
    }

  };

}]);