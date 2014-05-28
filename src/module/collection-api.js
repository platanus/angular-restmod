'use strict';

RMModule.factory('RMCollectionApi', ['RMScopeApi', 'RMCommonApi', 'RMUtils', function(ScopeApi, CommonApi, Utils) {

  var extend = angular.extend;

  return extend({

    /**
     * @memberof ModelCollection#
     *
     * @description Called by record constructor on initialization.
     *
     * Note: Is better to add a hook to after-init than overriding this method.
     *
     * @param {mixed} _scope The instance scope.
     * @param {mixed} _params The collection parameters.
     */
    $initialize: function(_scope, _params) {
      this.$isCollection = true;
      this.$scope = _scope;
      this.$params = _params;
      this.$resolved = false;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Gets this collection url without query string.
     *
     * @return {string} The collection url.
     */
    $url: function() {
      return this.$scope.$url();
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Part of the scope interface, provides urls for collection's items.
     *
     * @param {Model} _pk Item key to provide the url to.
     * @return {string|null} The url or nill if item does not meet the url requirements.
     */
    $urlFor: function(_pk) {
      // force item unscoping if model is not anonymous (maybe make this optional)
      var baseUrl = this.$type.$url();
      return Utils.joinUrl(baseUrl ? baseUrl : this.$url(), _pk);
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Builds a new collection using the current collection as base.
     *
     * Inherits parameters and scope from current collection.
     *
     * Collections are bound to an api resource.
     *
     * @param  {object} _params  Additional query string parameters
     * @param  {object} _scope Collection scope
     * @return {Collection} Model Collection
     */
    $collection: function(_params, _scope) {
      _params = this.$params ? extend({}, this.$params, _params) : _params;
      return this.$type.$collection(_params, _scope || this.$scope);
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Feeds raw collection data into the collection, marks collection as $resolved
     *
     * This method is for use in collections only.
     *
     * @param {array} _raw Data to add
     * @return {Collection} self
     */
    $feed: function(_raw) {
      if(!this.$resolved) this.length = 0; // reset contents if not resolved.
      for(var i = 0, l = _raw.length; i < l; i++) {
        this.$buildRaw(_raw[i]).$reveal(); // build and disclose every item.
      }
      this.$resolved = true;
      return this;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Resets the collection's resolve status.
     *
     * This method is for use in collections only.
     *
     * @return {Collection} self
     */
    $reset: function() {
      this.$cancel(); // cancel pending requests.
      this.$resolved = false;
      return this;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Begin a server request to populate collection. This method does not
     * clear the collection contents, use `$refresh` to reset and fetch.
     *
     * This method is for use in collections only.
     *
     * @param {object|function} _params Additional request parameters, not stored in collection,
     * if a function is given, then it will be called with the request object to allow requet customization.
     * @return {Collection} self
     */
    $fetch: function(_params) {
      var request = { method: 'GET', url: this.$url(), params: this.$params };

      if(_params) {
        request.params = request.params ? extend(request.params, _params) : _params;
      }

      // TODO: check that collection is bound.
      this.$dispatch('before-fetch-many', [request]);
      this.$send(request, function(_response) {
        var data = _response.data;
        if(!data || !angular.isArray(data)) {
          throw new Error('Error in resource {0} configuration. Expected response to be array');
        }
        this.$feed(data); // feed retrieved data.
        this.$dispatch('after-fetch-many', [_response]);
      }, function(_response) {
        this.$dispatch('after-fetch-many-error', [_response]);
      });

      return this;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Resets and fetches content.
     *
     * @param  {object} _params `$fetch` params
     * @return {Collection} self
     */
    $refresh: function(_params) {
      return this.$reset().$fetch(_params);
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Adds an item to the back of the collection. This method does not attempt to send changes
     * to the server. To create a new item and add it use $create or $build.
     *
     * Triggers after-add callbacks.
     *
     * @param {Model} _obj Item to be added
     * @return {Collection} self
     */
    $add: function(_obj, _idx) {
      // TODO: make sure object is f type Model?
      if(this.$isCollection && _obj.$position === undefined) {
        if(_idx !== undefined) {
          this.splice(_idx, 0, _obj);
        } else {
          this.push(_obj);
        }
        _obj.$position = true; // use true for now, keeping position updated can be expensive
        this.$dispatch('after-add', [_obj]);
      }
      return this;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description  Removes an item from the collection.
     *
     * This method does not send a DELETE request to the server, it just removes the
     * item locally. To remove an item AND send a DELETE use the item's $destroy method.
     *
     * Triggers after-remove callbacks.
     *
     * @param {Model} _obj Item to be removed
     * @return {Collection} self
     */
    $remove: function(_obj) {
      var idx = this.$indexOf(_obj);
      if(idx !== -1) {
        this.splice(idx, 1);
        _obj.$position = undefined;
        this.$dispatch('after-remove', [_obj]);
      }
      return this;
    },

    /**
     * @memberof ModelCollection#
     *
     * @description Finds the location of an object in the array.
     *
     * If a function is provided then the index of the first item for which the function returns true is returned.
     *
     * @param {Model|function} _obj Object to find
     * @return {number} Object index or -1 if not found
     */
    $indexOf: function(_obj) {
      var accept = typeof _obj === 'function' ? _obj : false;
      if(this.$isCollection) {
        for(var i = 0, l = this.length; i < l; i++) {
          if(accept ? accept(this[i]) : this[i] === _obj) return i;
        }
      }
      return -1;
    }
  }, ScopeApi, CommonApi);

}]);