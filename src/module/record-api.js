'use strict';

RMModule.factory('RMRecordApi', ['RMUtils', 'RMPackerCache', function(Utils, packerCache) {

  /**
   * @class RelationScope
   *
   * @description
   *
   * Special scope a record provides to resources related via hasMany or hasOne relation.
   */
  var RelationScope = function(_scope, _target, _partial) {
    this.$scope = _scope;
    this.$target = _target;
    this.$partial = _partial;
  };

  RelationScope.prototype = {
    // nest collection url
    $url: function() {
      return Utils.joinUrl(this.$scope.$url(), this.$partial);
    },

    // record url is nested only for anonymous resources
    $urlFor: function(_pk) {
      if(this.$target.$anonymous()) {
        return this.$fetchUrlFor();
      } else {
        return this.$target.$urlFor(_pk);
      }
    },

    // fetch url is nested
    $fetchUrlFor: function(/* _pk */) {
      return Utils.joinUrl(this.$scope.$url(), this.$partial);
    },

    // create is not posible in nested members
    $createUrlFor: function() {
      return null;
    }
  };

  /**
   * @class RecordApi
   * @extends CommonApi
   *
   * @property {object} $scope The record's scope (see {@link ScopeApi})
   * @property {mixed} $pk The record's primary key
   *
   * @description
   *
   * Provides record synchronization and manipulation methods. This is the base API for every restmod record.
   *
   * TODO: Talk about the object lifecycle.
   *
   * ### Object lifecycle hooks
   *
   * For `$fetch`:
   *
   * * before-fetch
   * * before-request
   * * after-request[-error]
   * * after-feed (only called if no errors)
   * * after-fetch[-error]
   *
   * For `$save` when creating:
   *
   * * before-render
   * * before-save
   * * before-create
   * * before-request
   * * after-request[-error]
   * * after-feed (only called if no errors)
   * * after-create[-error]
   * * after-save[-error]
   *
   * For `$save` when updating:
   *
   * * before-render
   * * before-save
   * * before-update
   * * before-request
   * * after-request[-error]
   * * after-feed (only called if no errors)
   * * after-update[-error]
   * * after-save[-error]
   *
   * For `$destroy`:
   *
   * * before-destroy
   * * before-request
   * * after-request[-error]
   * * after-destroy[-error]
   *
   * @property {mixed} $pk The record primary key
   * @property {object} $scope The collection scope (hierarchical scope, not angular scope)
   */
	return {

    /**
     * @memberof RecordApi#
     *
     * @description Called by record constructor on initialization.
     *
     * Note: Is better to add a hook to after-init than overriding this method.
     */
    $initialize: function() {
      // apply defaults
      this.$$loadDefaults();

      // after initialization hook
      // TODO: put this on $new so it can use stacked DSP?
      this.$dispatch('after-init');
    },

    /**
     * @memberof RecordApi#
     *
     * @description Returns the url this object is bound to.
     *
     * This is the url used by fetch to retrieve the resource related data.
     *
     * @return {string} bound url.
     */
    $url: function() {
      return this.$scope.$urlFor(this.$pk);
    },

    /**
     * @memberof RecordApi#
     *
     * @description Default item child scope factory.
     *
     * By default, no create url is provided and the update/destroy url providers
     * attempt to first use the unscoped resource url.
     *
     * // TODO: create special api to hold scope (so it is not necessary to recreate the whole object every time.)
     *
     * @param {mixed} _for Scope target type, accepts any model class.
     * @param {string} _partial Partial route.
     * @return {RelationScope} New scope.
     */
    $buildScope: function(_for, _partial) {
      if(_for.$buildOwnScope) {
        // TODO
      } else {
        return new RelationScope(this, _for, _partial);
      }
    },

    /**
     * @memberof RecordApi#
     *
     * @description Copyies another object's non-private properties.
     *
     * @param {object} _other Object to merge.
     * @return {RecordApi} self
     */
    $extend: function(_other) {
      for(var tmp in _other) {
        if (_other.hasOwnProperty(tmp) && tmp[0] !== '$') {
          this[tmp] = _other[tmp];
        }
      }
      return this;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Iterates over the object non-private properties
     *
     * @param {function} _fun Function to call for each
     * @return {RecordApi} self
     */
    $each: function(_fun, _ctx) {
      for(var key in this) {
        if(this.hasOwnProperty(key) && key[0] !== '$') {
          _fun.call(_ctx || this[key], this[key], key);
        }
      }

      return this;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Feed raw data to this instance.
     *
     * @param {object} _raw Raw data to be fed
     * @param {string} _mask 'CRU' mask
     * @return {RecordApi} this
     */
    $decode: function(_raw, _mask) {
      // IDEA: let user override serializer
      this.$$decode(_raw, _mask || Utils.READ_MASK);
      if(!this.$pk) this.$pk = this.$$inferKey(_raw); // TODO: warn if key changes
      this.$dispatch('after-feed', [_raw]);
      return this;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Generate data to be sent to the server when creating/updating the resource.
     *
     * @param {string} _mask 'CRU' mask
     * @return {string} raw data
     */
    $encode: function(_mask) {
      var raw = this.$$encode(_mask || Utils.CREATE_MASK);
      this.$dispatch('before-render', [raw]);
      return raw;
    },

    /**
     * @memberof RecordApi#
     *
     * @description
     *
     * Unpacks and decode raw data from a server generated structure.
     *
     * ATTENTION: do not override this method to change the object wrapping strategy,
     * instead, check {@link BuilderApi#setPacker} for instruction about loading a new packer.
     *
     * @param  {mixed} _raw Raw server data
     * @param  {string} _mask 'CRU' mask
     * @return {RecordApi} this
     */
    $unwrap: function(_raw, _mask) {
      try {
        packerCache.prepare();
        _raw = this.$$unpack(_raw);
        return this.$decode(_raw, _mask);
      } finally {
        packerCache.clear();
      }
    },

    /**
     * @memberof RecordApi#
     *
     * @description
     *
     * Encode and packs object into a server compatible structure that can be used for PUT/POST operations.
     *
     * ATTENTION: do not override this method to change the object wrapping strategy,
     * instead, check {@link BuilderApi#setPacker} for instruction about loading a new packer.
     *
     * @param  {string} _mask 'CRU' mask
     * @return {string} raw data
     */
    $wrap: function(_mask) {
      var raw = this.$encode(_mask);
      raw = this.$$pack(raw);
      return raw;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request for updated resource data.
     *
     * The request's promise is provided as the $promise property.
     *
     * @param {object} _params Optional list of params to be passed to object request.
     * @return {RecordApi} this
     */
    $fetch: function(_params) {
      // verify that instance has a bound url
      var url = this.$scope.$fetchUrlFor ? this.$scope.$fetchUrlFor(this.$pk) : this.$url();
      if(!url) throw new Error('Cannot fetch an unbound resource');

      var request = { method: 'GET', url: url, params: _params };

      this.$dispatch('before-fetch', [request]);
      return this.$send(request, function(_response) {
        this.$unwrap(_response.data);
        this.$dispatch('after-fetch', [_response]);
      }, function(_response) {
        this.$dispatch('after-fetch-error', [_response]);
      });
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request to create/update resource.
     *
     * If resource is new and it belongs to a collection and it hasnt been revealed, then it will be revealed.
     *
     * The request's promise is provided as the $promise property.
     *
     * @return {RecordApi} this
     */
    $save: function() {

      var url = this.$scope.$updateUrlFor ? this.$scope.$updateUrlFor(this.$pk) : this.$url(), request;

      if(url) {
        // If bound, update
        request = { method: 'PUT', url: url, data: this.$wrap(Utils.UPDATE_MASK) };
        this.$dispatch('before-update', [request]);
        this.$dispatch('before-save', [request]);
        return this.$send(request, function(_response) {
          this.$unwrap(_response.data);
          this.$dispatch('after-update', [_response]);
          this.$dispatch('after-save', [_response]);
        }, function(_response) {
          this.$dispatch('after-update-error', [_response]);
          this.$dispatch('after-save-error', [_response]);
        });
      } else {
        // If not bound create.
        url = this.$scope.$createUrlFor ? this.$scope.$createUrlFor(this.$pk) : (this.$scope.$url && this.$scope.$url());
        if(!url) throw new Error('Create is not supported by this resource');
        request = { method: 'POST', url: url, data: this.$wrap(Utils.CREATE_MASK) };
        this.$dispatch('before-save', [request]);
        this.$dispatch('before-create', [request]);
        return this.$send(request, function(_response) {
          this.$unwrap(_response.data);

          // reveal item (if not yet positioned)
          if(this.$scope.$isCollection && this.$position === undefined && !this.$preventReveal) {
            this.$scope.$add(this, this.$revealAt);
          }

          this.$dispatch('after-create', [_response]);
          this.$dispatch('after-save', [_response]);
        }, function(_response) {
          this.$dispatch('after-create-error', [_response]);
          this.$dispatch('after-save-error', [_response]);
        });
      }
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request to destroy the resource.
     *
     * The request's promise is provided as the $promise property.
     *
     * @return {RecordApi} this
     */
    $destroy: function() {
      var url = this.$scope.$destroyUrlFor ? this.$scope.$destroyUrlFor(this.$pk) : this.$url();
      if(!url) throw new Error('Cannot destroy an unbound resource');
      var request = { method: 'DELETE', url: url };

      this.$dispatch('before-destroy', [request]);
      return this.$send(request, function(_response) {

        // call scope callback
        if(this.$scope.$remove) {
          this.$scope.$remove(this);
        }

        this.$dispatch('after-destroy', [_response]);
      }, function(_response) {
        this.$dispatch('after-destroy-error', [_response]);
      });
    },

    // Collection related methods.

    /**
     * @memberof RecordApi#
     *
     * @description Changes the location of the object in the bound collection.
     *
     * If object hasn't been revealed, then this method will change the index where object will be revealed at.
     *
     * @param  {integer} _to New object position (index)
     * @return {RecordApi} this
     */
    $moveTo: function(_to) {
      if(this.$position !== undefined) {
        // TODO: move item to given index.
        // TODO: callback
      } else {
        this.$revealAt = _to;
      }
      return this;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Reveal in collection
     *
     * If instance is bound to a collection and it hasnt been revealed (because it's new and hasn't been saved),
     * then calling this method without parameters will force the object to be added to the collection.
     *
     * If this method is called with **_show** set to `false`, then the object wont be revealed by a save operation.
     *
     * @param  {boolean} _show Whether to reveal inmediatelly or prevent automatic reveal.
     * @return {RecordApi} this
     */
    $reveal: function(_show) {
      if(_show === undefined || _show) {
        this.$scope.$add(this, this.$revealAt);
      } else {
        this.$preventReveal = true;
      }
      return this;
    }
  };

}]);