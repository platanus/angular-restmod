'use strict';

RMModule.factory('RMRecordApi', ['RMCommonApi', 'RMUtils', function(CommonApi, Utils) {

  var extend = angular.extend,
      isArray = angular.isArray;

  // recursive transformation function, used by $decode and $encode.
  var transform = function (_data, _ctx, _prefix, _mask, _decode, _into) {

    var key, decodedName, encodedName, fullName, mask, filter, value, result = _into || {};

    for(key in _data) {
      if(_data.hasOwnProperty(key) && key[0] !== '$') {

        decodedName = (_decode && this.$$nameDecoder) ? this.$$nameDecoder(key) : key;
        fullName = _prefix + decodedName;

        // skip property if masked for this operation
        mask = this.$$masks[fullName];
        if(mask && mask.indexOf(_mask) !== -1) {
          continue;
        }

        value = _data[key];
        filter = _decode ? this.$$decoders[fullName] : this.$$encoders[fullName];

        if(filter) {
          value = filter.call(_ctx, value);
          if(value === undefined) continue; // ignore value if filter returns undefined
        } else if(typeof value === 'object' && value &&
          (_decode || typeof value.toJSON !== 'function')) {
          // IDEA: make extended decoding/encoding optional, could be a little taxing for some apps
          value = transformExtended.call(this, value, _ctx, fullName, _mask, _decode);
        }

        encodedName = (!_decode && this.$$nameEncoder) ? this.$$nameEncoder(decodedName) : decodedName;
        result[encodedName] = value;
      }
    }

    return result;
  };

  // extended part of transformation function, enables deep object transform.
  var transformExtended = function(_data, _ctx, _prefix, _mask, _decode) {
    if(isArray(_data))
    {
      var fullName = _prefix + '[]',
          filter = _decode ? this.$$decoders[fullName] : this.$$encoders[fullName],
          result = [], i, l, value;

      for(i = 0, l = _data.length; i < l; i++) {
        value = _data[i];
        if(filter) {
          value = filter.call(_ctx, value);
        } else if(typeof value === 'object' && value &&
          (_decode || typeof value.toJSON !== 'function')) {
          value = transformExtended.call(this, value, _ctx, _prefix, _mask, _decode);
        }
        result.push(value);
      }

      return result;
    } else {
      return transform.call(this, _data, _ctx, _prefix + '.', _mask, _decode);
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
	return extend({

    /**
     * @memberof RecordApi#
     *
     * @description Called by record constructor on initialization.
     *
     * Note: Is better to add a hook to after-init than overriding this method.
     *
     * @param {mixed} _scope The instance scope.
     * @param {mixed} _pk The record primary key.
     */
    $initialize: function(_scope, _pk) {
      this.$scope = _scope || this.$type;
      this.$pk = _pk;

      var tmp;

      // apply defaults
      for(var i = 0; (tmp = this.$type.$$defaults[i]); i++) {
        this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
      }

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
     * @param {mixed} _for Scope target type, accepts any model class.
     * @param {string} _partial Partial route.
     * @return {ScopeInterface} New scope.
     */
    $buildScope: function(_for, _partial) {
      if(_for.$buildOwnScope) {
        // TODO
      } else {
        var self = this;
        return {
          $url: function() {
            // collection url is always nested
            return Utils.joinUrl(self.$url(), _partial);
          },
          $urlFor: function(_pk) {
            // resource url is nested only for anonymous resources
            if(_for.$anonymous()) {
              return this.$fetchUrlFor();
            } else {
              return _for.$urlFor(_pk);
            }
          },
          $fetchUrlFor: function(/* _pk */) {
            // fetch url is nested
            return Utils.joinUrl(self.$url(), _partial);
          },
          $createUrlFor: function() {
            // create is not posible in nested members
            return null;
          }
        };
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
     * @return {RecordApi} this
     */
    $decode: function(_raw, _mask) {
      transform.call(this.$type, _raw, this, '', _mask || Utils.READ_MASK, true, this);
      if(!this.$pk) this.$pk = this.$type.$inferKey(_raw); // TODO: warn if key changes
      this.$dispatch('after-feed', [_raw]);
      return this;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Generate data to be sent to the server when creating/updating the resource.
     *
     * @param {string} _action Action that originated the render
     * @return {RecordApi} this
     */
    $encode: function(_mask) {
      var raw = transform.call(this.$type, this, this, '', _mask || Utils.CREATE_MASK, false);
      this.$dispatch('before-render', [raw]);
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

        var data = _response.data;
        if (!data || isArray(data)) {
          throw new Error('Expected object while feeding resource');
        }

        this.$decode(data);

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
        request = { method: 'PUT', url: url, data: this.$encode(Utils.CREATE_MASK) };
        this.$dispatch('before-update', [request]);
        this.$dispatch('before-save', [request]);
        return this.$send(request, function(_response) {
          var data = _response.data;
          if (data && !isArray(data)) this.$decode(data);
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
        request = { method: 'POST', url: url, data: this.$encode(Utils.UPDATE_MASK) };
        this.$dispatch('before-save', [request]);
        this.$dispatch('before-create', [request]);
        return this.$send(request, function(_response) {
          var data = _response.data;
          if (data && !isArray(data)) this.$decode(data);

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
  }, CommonApi);

}]);