'use strict';

RMModule.factory('RMRecordApi', ['RMUtils', function(Utils) {

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
    this.$partial = Utils.cleanUrl(_partial);
  };

  RelationScope.prototype = {

    $nestedUrl: function() {
      return Utils.joinUrl(this.$scope.$url(), this.$partial);
    },

    // url is nested for collections and nested records
    $urlFor: function(_resource) {
      if(_resource.$isCollection || this.$target.isNested()) {
        return this.$nestedUrl();
      } else {
        return this.$target.$urlFor(_resource);
      }
    },

    // a record's fetch url is always nested
    $fetchUrlFor: function(/* _resource */) {
      return this.$nestedUrl();
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
      this.$super();

      // after initialization hook
      // TODO: put this on $new so it can use stacked DSP?
      this.$dispatch('after-init');
    },

    /**
     * @memberof RecordApi#
     *
     * @description Checks whether a record is new or not
     *
     * @return {boolean} True if record is new.
     */
    $isNew: function() {
      return this.$pk === undefined || this.$pk === null;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Called the resource's scope $urlFor method to build the url for the record using the proper scope.
     *
     * By default the resource partial url is just its `$pk` property. This can be overriden to provide other routing approaches.
     *
     * @return {string} The resource partial url
     */
    $buildUrl: function(_scope) {
      return this.$isNew() ? null : Utils.joinUrl(_scope.$url(), this.$pk + '');
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

      Utils.assert(_raw && typeof _raw == 'object', 'Record $decode expected an object');

      // IDEA: let user override serializer
      this.$type.decode(this, _raw, _mask || Utils.READ_MASK);
      if(this.$isNew()) this.$pk = this.$type.inferKey(_raw); // TODO: warn if key changes
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
      var raw = this.$type.encode(this, _mask || Utils.CREATE_MASK);
      this.$dispatch('before-render', [raw]);
      return raw;
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request for updated resource data.
     *
     * The request's promise can be accessed using the `$asPromise` method.
     *
     * @param {object} _params Optional list of params to be passed to object request.
     * @return {RecordApi} this
     */
    $fetch: function(_params) {
      return this.$action(function() {
        var url = this.$url('fetch');
        Utils.assert(!!url, 'Cant $fetch if resource is not bound');

        var request = { method: 'GET', url: url, params: _params };

        this.$dispatch('before-fetch', [request]);
        this.$send(request, function(_response) {
          this.$unwrap(_response.data);
          this.$dispatch('after-fetch', [_response]);
        }, function(_response) {
          this.$dispatch('after-fetch-error', [_response]);
        });
      });
    },

    /**
     * @memberof RecordApi#
     *
     * @description Copyies another object's non-private properties.
     *
     * This method runs inside the promise chain, so calling
     *
     * ```javascript
     * Bike.$find(1).$extend({ size: "L" }).$save();
     * ```
     * Will first fetch the bike data and after it is loaded the new size will be applied and then the
     * updated model saved.
     *
     * @param {object} _other Object to merge.
     * @return {RecordApi} self
     */
    $extend: function(_other) {
      return this.$action(function() {
        for(var tmp in _other) {
          if (_other.hasOwnProperty(tmp) && tmp[0] !== '$') {
            this[tmp] = _other[tmp];
          }
        }
      });
    },

    /**
     * @memberof RecordApi#
     *
     * @description Shortcut method used to extend and save a model.
     *
     * This method will not force a PUT, if object is new `$update` will attempt to POST.
     * It is posible to change the methods used for PUT and POST operations by setting 
     * the `putMethod` and `postMethod` configuration.
     *
     * @param {object} _other Data to change
     * @return {RecordApi} self
     */
    $update: function(_other) {
      return this.$extend(_other).$save();
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request to create/update/patch resource.
     *
     * A patch is only executed if model is identified and a patch property list is given. It is posible to
     * change the method used for PATCH operations by setting the `patchMethod` configuration.
     *
     * If resource is new and it belongs to a collection and it hasnt been revealed, then it will be revealed.
     *
     * The request's promise can be accessed using the `$asPromise` method.
     *
     * @param {array} _patch Optional list of properties to send in update operation.
     * @return {RecordApi} this
     */
    $save: function(_patch) {
      return this.$action(function() {
        var url = this.$url('update'), request;

        if(url) {

          // If bound, update
          if(_patch) {
            request = {
              method: this.$type.getProperty('patchMethod', 'PATCH'), // allow user to override patch method
              url: url,
              // Use special mask for patches, mask everything that is not in the patch list.
              data: this.$wrap(function(_name) {
                _name = _name.replace('[]', '');
                for(var i = 0, l = _patch.length; i < l; i++) {
                  if(_name === _patch[i] ||
                    _name.indexOf(_patch[i] + '.') === 0 ||
                    _patch[i].indexOf(_name + '.') === 0
                  ) { return false; }
                }

                return true;
              })
            };
          } else {
            request = { 
              method: this.$type.getProperty('putMethod', 'PUT'), // allow user to override put method
              url: url, 
              data: this.$wrap(Utils.UPDATE_MASK) 
            };
          }

          this
            .$dispatch('before-update', [request, !!_patch])
            .$dispatch('before-save', [request])
            .$send(request, function(_response) {
              if(_response.data) this.$unwrap(_response.data);

              this
                .$dispatch('after-update', [_response, !!_patch])
                .$dispatch('after-save', [_response]);
            }, function(_response) {
              this
                .$dispatch('after-update-error', [_response, !!_patch])
                .$dispatch('after-save-error', [_response]);
            });
        } else {
          // If not bound create.
          url = this.$url('create') || this.$scope.$url();
          Utils.assert(!!url, 'Cant $create if parent scope is not bound');

          request = { 
            method: this.$type.getProperty('postMethod', 'POST'), // allow user to override post method
            url: url, 
            data: this.$wrap(Utils.CREATE_MASK) 
          };

          this
            .$dispatch('before-save', [request])
            .$dispatch('before-create', [request])
            .$send(request, function(_response) {
              if(_response.data) this.$unwrap(_response.data);

              // reveal item (if not yet positioned)
              if(this.$scope.$isCollection && this.$position === undefined && !this.$preventReveal) {
                this.$scope.$add(this, this.$revealAt);
              }

              this
                .$dispatch('after-create', [_response])
                .$dispatch('after-save', [_response]);
            }, function(_response) {
              this
                .$dispatch('after-create-error', [_response])
                .$dispatch('after-save-error', [_response]);
            });
        }
      });
    },

    /**
     * @memberof RecordApi#
     *
     * @description Begin a server request to destroy the resource.
     *
     * The request's promise can be accessed using the `$asPromise` method. It is posible to change
     * the methods used for DELETE operations by setting the `deleteMethod` configuration.
     *
     * @return {RecordApi} this
     */
    $destroy: function() {
      return this.$action(function() {
        var url = this.$url('destroy');
        if(url)
        {
          var request = { 
            method: this.$type.getProperty('deleteMethod', 'DELETE'), // allow user to override delete method 
            url: url 
          };

          this
            .$dispatch('before-destroy', [request])
            .$send(request, function(_response) {

              // remove from scope
              if(this.$scope.$remove) {
                this.$scope.$remove(this);
              }

              this.$dispatch('after-destroy', [_response]);
            }, function(_response) {
              this.$dispatch('after-destroy-error', [_response]);
            });
        }
        else
        {
          // If not yet bound, just remove from parent
          if(this.$scope.$remove) this.$scope.$remove(this);
        }
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