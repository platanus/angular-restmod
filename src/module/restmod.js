'use strict';

var $restmodMinErr = angular.noop; //minErr('$restmod');

/**
 * The Model provider
 */

angular.module('plRestmod')
  .constant('Utils', {
    camelcase: function(_string) {
      if (typeof _string !== 'string') return _string;
      return _string.replace(/_[\w\d]/g, function (match, index, string) {
        return index === 0 ? match : string.charAt(index + 1).toUpperCase();
      });
    },
    snakecase: function(_string, _sep) {
      if (typeof _string !== 'string') return _string;
      return _string.replace(/[A-Z]/g, function (match, index) {
        return index === 0 ? match : (_sep || '_') + match.toLowerCase();
      });
    }
  })
  .constant('SyncMask', {
    NONE: 0x00,
    ALL: 0xFFFF,

    DECODE_CREATE: 0x0001,
    DECODE_UPDATE: 0x0002,
    DECODE_USER: 0x0004,
    DECODE_SAVE: 0x0003,

    ENCODE_CREATE: 0x0100,
    ENCODE_UPDATE: 0x0200,
    ENCODE_USER: 0x0400,
    ENCODE_SAVE: 0x0300,

    // Compound masks
    DECODE: 0x00FF,
    ENCODE: 0xFF00,
    CREATE: 0x0101,
    UPDATE: 0x0202,
    USER: 0x0404,
    SAVE: 0x0303
  })
  .provider('$restmod', ['Utils', 'SyncMask', function(Utils, SyncMask) {

    // Cache some angular stuff
    var forEach = angular.forEach,
        extend = angular.extend,
        isObject = angular.isObject,
        isArray = angular.isArray,
        arraySlice = Array.prototype.slice;

    /* Module Globals */
    var URL_BUILDER_FC, // The url builder factory.
        MODEL_BUILDER_FC, // The model builder factory.
        DEF_NAME_DECODER = Utils.camelcase,
        DEF_NAME_ENCODER = Utils.snakecase,
        BASE_CHAIN = [];

    return {
      /**
       * Adds mixins to the base model chain.
       *
       * Non abstract models should NOT be added to this chain.
       *
       * Base model chain is by default empty, all mixins added to the chain are
       * prepended to every generated model.
       *
       * $provider.pushModelBase('ChangeModel', 'LazyRelations', 'ThrottledModel')
       *
       */
      pushModelBase: function(/* mixins */) {
        Array.prototype.push.apply(BASE_CHAIN, arguments);
        return this;
      },
      /**
       * Change the default url builder.
       *
       * The provided factory must implement a `get` method
       * that receives the resource baseUrl and returns an
       * url builder.
       *
       * TODO: describe url builder interface
       */
      setUrlBuilder: function(_urlBuilderFactory) {
        URL_BUILDER_FC = _urlBuilderFactory;
        return this;
      },
      /**
       * Changes the way restmod renames attributes every time a server resource is serialized.
       *
       * This is intended to be used as a way of keeping property naming style consistent accross
       * languajes. By default, property naming in js should use camelcase and property naming
       * in JSON api should use snake case with underscores.
       *
       * In addition to support true|false to disable|enable renaming, this method accepts
       * an object with custom decode|encode implementations.
       *
       * @param {boolean|object} _value
       */
      setAttributeRenaming: function(_value) {
        if(!_value) {
          DEF_NAME_DECODER = DEF_NAME_ENCODER = null;
        } else if(_value === true) {
          DEF_NAME_DECODER = Utils.camelcase;
          DEF_NAME_ENCODER = Utils.snakecase;
        } else {
          DEF_NAME_DECODER = _value.decode;
          DEF_NAME_ENCODER = _value.encode;
        }
        return this;
      },
      /**
       * The factory function, returns a new model builder factory.
       *
       * The model builder factory can be used to generate new model builder instances
       * given an url and a series of metadata objects, once generated, the model builder
       * can be used generate a new model.
       *
       * The `_url` parameter also accepts an url builder implementation.
       */
      $get: ['$http', '$q', '$injector', function($http, $q, $injector) {

        // If no url builder was provided at configuration, inject the default factory
        if(!URL_BUILDER_FC) URL_BUILDER_FC = $injector.get('RestUrlBuilderFactory')('id');
        if(!MODEL_BUILDER_FC) MODEL_BUILDER_FC = $injector.get('ModelBuilder');

        function loadMeta(_meta, _builder) {
          if(_meta.$meta) {
            loadMeta(_meta.$meta, _builder);
          } else if(typeof _meta === 'string') {
            loadMeta($injector.get(_meta), _builder);
          } else if(isArray(_meta)) {
            var i=0, meta;
            while((meta = _meta[i++])) {
              loadMeta(meta, _builder);
            }
          } else if(typeof _meta === 'function') {
            _meta.call(_builder, _builder);
          } else _builder.describe(_meta);
        }

        var restmod = function(_url/* , _meta */) {

          var spec = {},
              urlBuilder = spec.urlBuilder = isObject(_url) ? _url : URL_BUILDER_FC(_url),
              masks = spec.masks = {
                $partial: SyncMask.ALL,
                $context: SyncMask.ALL,
                $promise: SyncMask.ALL,
                $pending: SyncMask.ALL,
                $error: SyncMask.ALL
              },
              defaults = spec.defaults = [],
              decoders = spec.decoders = {},
              encoders = spec.encoders = {},
              callbacks = spec.callbacks = {};

          // runs all callbacks associated with a given hook.
          function callback(_hook, _ctx /*, args */) {
            var cbs = callbacks[_hook];
            if(cbs) {
              var i = 0, args = arraySlice.call(arguments, 2), cb;
              while((cb = cbs[i++])) {
                // execute callback
                cb.apply(_ctx, args);
              }
            }
          }

          // common http behavior, used both in collections and model instances.
          function send(_target, _config, _success, _error) {

            // IDEA: comm queuing, never allow two simultaneous requests.
            // if(this.$pending) {
            //  this.$promise.then(function() {
            //    this.$send(_config, _success, _error);
            //    });
            // }

            _target.$pending = true;
            _target.$error = false;
            _target.$promise = $http(_config).then(function(_response) {

              // IDEA: a response interceptor could add additional error states based on returned data,
              // this could allow for additional error state behaviours (for example, an interceptor
              // could watch for rails validation errors and store them in the model, then return false
              // to trigger a promise queue error).

              _target.$pending = false;

              if(_success) _success.call(_target, _response);

              return _target;

            }, function(_response) {

              _target.$pending = false;
              _target.$error = true;

              if(_error) _error.call(_target, _response);

              return $q.reject(_target);
            });
          }

          /**
           * The Model Type definition
           *
           * TODO: Describe model type
           */

          /**
           * Model constructor
           *
           * @param {object} _init Initial model data [optional]
           * @param {string} _url Model url override or partial url if context is given [optional]
           * @param {Model|Model.collection} _context Model context [internal]
           */
          var Model = function(_init, _url, _context) {

            this.$pending = false;
            this.$partial = _url;
            this.$context = _context;

            var tmp;

            // apply defaults
            for(var i = 0; (tmp = defaults[i]); i++) {
              this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
            }

            if(_init) {
              // copy initial values (if given)
              for(tmp in _init) {
                if (_init.hasOwnProperty(tmp)) {
                  this[tmp] = _init[tmp];
                }
              }
            }
          };

          spec.classProto = extend(Model, {
            /**
             * Returns the url this collection is bound to.
             * @return {string} bound url.
             */
            $url: function() {
              return urlBuilder.collectionUrl(this);
            },
            $build: function(_key) {
              var init, keyName;
              if(!isObject(_key)) {
                init = {};
                keyName = urlBuilder.inferKey(this);
                if(!keyName) throw $restmodMinErr('notsup', 'Cannot infer build key, use explicit mode');
                init[keyName] = _key;
              } else init = _key;

              var obj = new Model(init, null, this);
              if(this.$isCollection) this.push(obj); // on collection, push new object
              return obj;
            },
            $buildRaw: function(_raw) {
              return this.$build(null).$decode(_raw);
            },
            $create: function(_attr, _success, _error) {
              return this.$build(_attr).$save(_success, _error);
            },
            $find: function(_key, _success, _error) {
              var init, keyName;
              if(!isObject(_key)) {
                init = {};
                keyName = urlBuilder.inferKey(this);
                if(!keyName) throw $restmodMinErr('notsup', 'Cannot infer find key, use explicit mode');
                init[keyName] = _key;
              } else init = _key;

              // dont use $build, find does not push into current collection.
              return (new Model(init, null, this)).$fetch(_success, _error);
            },
            /**
             * Builds a new collection
             *
             * @param  {[type]} _params  [description]
             * @param  {[type]} _url     [description]
             * @param  {[type]} _context [description]
             * @return {[type]}          [description]
             */
            $collection: function(_params, _url, _context) {

              _params = this.$params ? extend({}, this.$params, _params) : _params;

              var col = [];

              // Since Array cannot be extended, use method injection
              // TODO: try to find a faster alternative, use for loop insted for example.
              for(var key in this) {
                if(this.hasOwnProperty(key)) col[key] = this[key];
              }

              col.$partial = _url || this.$partial;
              col.$context = _context || this.$context;
              col.$isCollection = true;
              col.$params = _params;
              col.$pending = false;
              col.$resolved = false;

              return col;
            },
            $search: function(_params, _success, _error) {
              return this.$collection(_params).$fetch(_success, _error);
            },
            /**
             * Promise chaining method, keeps the collection instance as the chain context.
             *
             * Usage: col.$fetch().$then(function() { });
             *
             * @param {function} _success success callback
             * @param {function} _error error callback
             * @return {Model} self
             */
            $then: function(_success, _error) {
              if(this.$isCollection) {
                this.$promise = this.$promise.then(_success, _error);
              }
              return this;
            },
            /**
             * Resets the collection's contents, marks collection as not $resolved
             *
             * @return {Model} self
             */
            $reset: function() {
              if(this.$isCollection) {
                this.$resolved = false;
                this.length = 0;
              }
              return this;
            },
            /**
             * Feeds raw collection data into the collection, marks collection as $resolved
             *
             * @param {array} _raw Data to add
             * @return {Model} self
             */
            $feed: function(_raw) {
              if(this.$isCollection) {
                forEach(_raw, this.$buildRaw, this);
                this.$resolved = true;
              }
              return this;
            },
            /**
             * Begin a server request to populate collection.
             *
             * TODO: support POST data queries (complex queries scenarios)
             *
             * @param {object} _params Additional request parameters, this parameters are not stored in collection.
             * @return {[type]} [description]
             */
            $fetch: function(_params) {

              if(this.$isCollection)
              {
                var params = _params ? extend({}, this.$params || {}, _params) : this.$params;

                // TODO: check that collection is bound.
                send(this, { method: 'GET', url: this.$url(), params: params }, function(_response) {

                  var data = _response.data;
                  if(!data || !isArray(data)) {
                    throw $restmodMinErr('badcfg', 'Error in resource {0} configuration. Expected response to be array');
                  }

                  // reset and feed retrieved data.
                  this.$reset().$feed(data);

                  // execute callback
                  callback('after_collection_fetch', this, _response);
                });
              }

              return this;
            }


            // IDEA: $push, $remove, etc
          });

          /**
           *
           */

          spec.objectProto = Model.prototype = {
            /**
             * Returns the url this object is bound to.
             * @return {string} bound url.
             */
            $url: function() {
              return urlBuilder.resourceUrl(this);
            },
            /**
             * Allows calling custom hooks, usefull when implementing custom actions.
             *
             * Passes through every additional arguments to registered hooks.
             * Hooks are registered using the ModelBuilder.on method.
             *
             * @param {string} _hook hook name
             * @return {Model} self
             */
            $callback: function(_hook /*, args */) {
              callback(this, _hook, arraySlice.call(arguments, 1));
              return this;
            },
            /**
             * Low level communication method, wraps the $http api.
             *
             * @param {object} _options $http options
             * @param {function} _success sucess callback (sync)
             * @param {function} _error error callback (sync)
             * @return {Model} self
             */
            $send: function(_options, _success, _error) {
              send(this, _options, _success, _error);
              return this;
            },
            /**
             * Promise chaining method, keeps the model instance as the chain context.
             *
             * Usage: col.$fetch().$then(function() { });
             *
             * @param {function} _success success callback
             * @param {function} _error error callback
             * @return {Model} self
             */
            $then: function(_success, _error) {
              this.$promise = this.$promise.then(_success, _error);
              return this;
            },
            /**
             * Feed raw data to this instance.
             *
             * @param {object} _raw Raw data to be fed
             * @param {string} _action Action that originated the fetch
             * @return {Model} this
             */
            $decode: function(_raw, _mask) {
              if(!_mask) _mask = SyncMask.DECODE_USER;

              // TODO: does undefined & 1 evaluates to 0 in every browser?
              // TODO: var original = {}; // enable change queries
              var key, decodedName, decoder, value, original = {};
              for(key in _raw) {
                if(_raw.hasOwnProperty(key) && !((masks[key] || 0) & _mask)) {
                  decodedName = DEF_NAME_DECODER ? DEF_NAME_DECODER(key) : key;
                  decoder = decoders[decodedName];
                  value = decoder ? decoder.call(this, _raw[key]) : _raw[key];

                  if(value !== undefined) {
                    original[decodedName] = this[decodedName] = value;
                  }
                }
              }

              callback('after_feed', this, original, _raw);
              return this;
            },
            /**
             * Generate data to be sent to the server when creating/updating the resource.
             *
             * @param {string} _action Action that originated the render
             * @return {Model} this
             */
            $encode: function(_mask) {
              if(!_mask) _mask = SyncMask.ENCODE_USER;

              var key, encodedName, encoder, raw = {};
              for(key in this) {
                if(this.hasOwnProperty(key) && !((masks[key] || 0) & _mask)) {
                  encodedName = DEF_NAME_ENCODER ? DEF_NAME_ENCODER(key) : key;
                  encoder = encoders[key];
                  raw[encodedName] = encoder ? encoder.call(this, this[key]) : this[key];
                }
              }

              callback('before_render', this, raw);

              return raw;
            },
            /**
             * Begin a server request for updated resource data.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $fetch: function() {
              // verify that instance has a bound url
              if(!this.$url()) throw $restmodMinErr('notsup', 'Cannot fetch an unbound resource');
              return this.$send({ method: 'GET', url: this.$url(), feed: true }, function(_response) {
                var data = _response.data;
                if (!data || isArray(data)) {
                  throw $restmodMinErr('badresp', 'Expected object while feeding resource');
                }
                this.$decode(data);
              });
            },
            /**
             * Begin a server request to create/update resource.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $save: function() {
              var url;

              if(this.$url()) {
                // If bound, update

                url = urlBuilder.updateUrl(this);
                if(!url) throw $restmodMinErr('notsup', 'Update is not supported by this resource');

                callback('before_update', this);
                callback('before_save', this);
                return this.$send({ method: 'PUT', url: url, data: this.$encode(SyncMask.ENCODE_CREATE) }, function(_response) {

                  // IDEA: maybe this should be a method call (like $feedCreate), this would allow
                  // a user to override the feed logic for each action... On the other hand, allowing
                  // this breaks the extend-using-hooks convention.

                  var data = _response.data;
                  if (data && !isArray(data)) this.$decode(data, SyncMask.DECODE_UPDATE);

                  callback('after_update', this);
                  callback('after_save', this);
                });
              } else {
                // If not bound create.

                url = urlBuilder.createUrl(this);
                if(!url) throw $restmodMinErr('notsup', 'Create is not supported by this resource');

                callback('before_save', this);
                callback('before_create', this);
                return this.$send({ method: 'POST', url: url, data: this.$encode(SyncMask.ENCODE_UPDATE) }, function(_response) {

                  var data = _response.data;
                  if (data && !isArray(data)) this.$decode(data, SyncMask.DECODE_CREATE);

                  callback('after_create', this);
                  callback('after_save', this);
                });
              }
            },
            /**
             * Begin a server request to destroy the resource.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $destroy: function() {
              var url = urlBuilder.destroyUrl(this);
              if(!url) throw $restmodMinErr('notsup', 'Destroy is not supported by this resource');

              callback('before_destroy', this);
              return this.$send({ method: 'DELETE', url: url }, function() {
                callback('after_destroy', this);
              });
            }
          };

          /**
           * Model customization phase:
           * * Generate a new model builder for current model spec
           * * Process metadata from base chain
           * * Process metadata from arguments
           */

          Model.$isAbstract = false;
          Model.$meta = arraySlice.call(arguments, 1);

          var builder = MODEL_BUILDER_FC(spec);
          loadMeta(BASE_CHAIN, builder);
          loadMeta(Model.$meta, builder);

          // TODO postprocessing of collection prototype.

          return Model;
        };

        /**
         * Returns an abstract model.
         *
         * An abstract model is just a metadata container that can be included in a mixin chain.
         *
         * @return {object} The abstract model
         */
        restmod.abstract = function(/* mixins */) {
          return { $isAbstract: true, $meta: arraySlice.call(arguments, 0) };
        };

        return restmod;
      }]
    };
  }]);

