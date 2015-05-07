'use strict';

RMModule.factory('RMCollectionApi', ['RMUtils', function(Utils) {

  var extend = angular.extend;

  /**
   * @class CollectionApi
   *
   * @extends ScopeApi
   * @extends CommonApi
   *
   * @description
   *
   * A restmod collection is an extended array type bound REST resource route.
   *
   * Every time a new restmod model is created, an associated collection type is created too.
   *
   * TODO: talk about fetch/refresh behaviour, lifecycles, collection scopes, adding/removing
   *
   * For `$fetch` on a collection:
   *
   * * before-fetch-many
   * * before-request
   * * after-request[-error]
   * * after-feed (called for every record if no errors)
   * * after-feed-many (only called if no errors)
   * * after-fetch-many[-error]
   *
   * @property {boolean} $isCollection Helper flag to separate collections from the main type
   * @property {object} $scope The collection scope (hierarchical scope, not angular scope)
   * @property {object} $params The collection query parameters
   *
   */
  return {

    $isCollection: true,

    /**
     * @memberof CollectionApi#
     *
     * @description Called by collection constructor on initialization.
     *
     * Note: Is better to add a hook on after-init than overriding this method.
     */
    $initialize: function() {
      // after initialization hook
      this.$dispatch('after-collection-init');
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Feeds raw collection data into the collection.
     *
     * This method is for use in collections only.
     *
     * @param {array} _raw Data to add
     * @param  {string} _mask 'CRU' mask
     * @return {CollectionApi} self
     */
    $decode: function(_raw, _mask) {

      Utils.assert(_raw && angular.isArray(_raw), 'Collection $decode expected array');

      for(var i = 0, l = _raw.length; i < l; i++) {
        this.$buildRaw(_raw[i], _mask).$reveal(); // build and disclose every item.
      }

      this.$dispatch('after-feed-many', [_raw]);
      return this;
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Encodes array data into a its serialized version.
     *
     * @param  {string} _mask 'CRU' mask
     * @return {CollectionApi} self
     */
    $encode: function(_mask) {
      var raw = [];
      for(var i = 0, l = this.length; i < l; i++) {
        raw.push(this[i].$encode(_mask));
      }

      this.$dispatch('before-render-many', [raw]);
      return raw;
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Resets the collection's contents
     *
     * @return {CollectionApi} self
     */
    $clear: function() {
      return this.$always(function() {
        this.length = 0; // reset the collection contents
      });
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Begin a server request to populate collection. This method does not
     * clear the collection contents by default, use `$refresh` to reset and fetch.
     *
     * This method is for use in collections only.
     *
     * @param {object|function} _params Additional request parameters, not stored in collection,
     * if a function is given, then it will be called with the request object to allow requet customization.
     * @return {CollectionApi} self
     */
    $fetch: function(_params) {
      return this.$action(function() {
        var request = { method: 'GET', url: this.$url('fetchMany'), params: this.$params };

        if(_params) {
          request.params = request.params ? extend(request.params, _params) : _params;
        }

        // TODO: check that collection is bound.

        this
          .$dispatch('before-fetch-many', [request])
          .$send(request, function(_response) {
            this
              .$unwrap(_response.data)
              .$dispatch('after-fetch-many', [_response]);
          }, function(_response) {
            this.$dispatch('after-fetch-many-error', [_response]);
          });
      });
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Adds an item to the back of the collection. This method does not attempt to send changes
     * to the server. To create a new item and add it use $create or $build.
     *
     * Triggers after-add callbacks.
     *
     * @param {RecordApi} _obj Item to be added
     * @return {CollectionApi} self
     */
    $add: function(_obj, _idx) {
      Utils.assert(_obj.$type && _obj.$type === this.$type, 'Collection $add expects record of the same $type');

      return this.$action(function() {
        if(_obj.$position === undefined) {
          if(_idx !== undefined) {
            this.splice(_idx, 0, _obj);
          } else {
            this.push(_obj);
          }
          _obj.$position = true; // use true for now, keeping position updated can be expensive
          this.$dispatch('after-add', [_obj]);
        }
      });
    },

    /**
     * @memberof CollectionApi#
     *
     * @description  Removes an item from the collection.
     *
     * This method does not send a DELETE request to the server, it just removes the
     * item locally. To remove an item AND send a DELETE use the item's $destroy method.
     *
     * Triggers after-remove callbacks.
     *
     * @param {RecordApi} _obj Item to be removed
     * @return {CollectionApi} self
     */
    $remove: function(_obj) {
      return this.$action(function() {
        var idx = this.$indexOf(_obj);
        if(idx !== -1) {
          this.splice(idx, 1);
          _obj.$position = undefined;
          this.$dispatch('after-remove', [_obj]);
        }
      });
    },

    /**
     * @memberof CollectionApi#
     *
     * @description Finds the location of an object in the array.
     *
     * If a function is provided then the index of the first item for which the function returns true.
     *
     * @param {RecordApi|function} _obj Object to find
     * @param {integer} _fromIdx Index from which to start searching, defaults to 0
     * @return {number} Object index or -1 if not found
     */
    $indexOf: function(_obj, _fromIdx) {
      var accept = typeof _obj !== 'function' ?
        function(e) { return e === _obj; } : _obj;

      return Utils.indexWhere(this, accept, _fromIdx);
    }
  };

}]);