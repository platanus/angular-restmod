/*
 *
 */

'use strict';

/**
 * @class SyncMask
 * @memberOf constants
 *
 * @description The object property synchronization mask.
 */
var SyncMask = {
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
};

// Cache some angular stuff
var bind = angular.bind,
    forEach = angular.forEach,
    extend = angular.extend,
    isObject = angular.isObject,
    isArray = angular.isArray,
    isFunction = angular.isFunction,
    arraySlice = Array.prototype.slice;

/**
 * @class $restmodProvider
 * @memberOf providers
 *
 * @description
 *
 * The $restmodProvider exposes $restmod configuration methods
 */
angular.module('plRestmod').provider('$restmod', function() {

  var BASE_CHAIN = []; // The base mixin chain

  return {
    /**
     * @memberof providers.$restmodProvider
     *
     * @description
     * Adds mixins to the base model chain.
     *
     * Non abstract models should NOT be added to this chain.
     *
     * Base model chain is by default empty, all mixins added to the chain are
     * prepended to every generated model.
     *
     * Usage:
     *
     * ```javascript
     * $provider.pushModelBase('ChangeModel', 'LazyRelations', 'ThrottledModel')
     * ```
     */
    pushModelBase: function(/* mixins */) {
      Array.prototype.push.apply(BASE_CHAIN, arguments);
      return this;
    },

    /**
     * @class $restmod
     * @memberOf services
     *
     * @description The restmod service provides the `model` and `mixin` factories.
     */
    $get: ['$http', '$q', '$injector', '$parse', '$filter', function($http, $q, $injector, $parse, $filter) {

      return {
        /**
         * @function model
         * @memberOf services.$restmod#
         *
         * @description
         *
         * The model factory is used to generate mode types using a rich building DSL provided
         * by the {@link restmod.class:ModelBuilder ModelBuilder}.
         *
         * For more information about model generation see {@link Building a Model}
         */
        model: function(_urlParams/* , _mix */) {

          var masks = {
                $partial: SyncMask.ALL,
                $context: SyncMask.ALL,
                $promise: SyncMask.ALL,
                $pending: SyncMask.ALL,
                $error: SyncMask.ALL
              },
              defaults = [],
              decoders = {},
              encoders = {},
              callbacks = {},
              nameDecoder = Utils.camelcase,
              nameEncoder = Utils.snakecase,
              urlBuilder;

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

          // recursive transformation function, used by $decode and $encode.
          function transform(_data, _ctx, _prefix, _mask, _decode, _into) {

            var key, decodedName, encodedName, fullName, filter, value, result = _into || {};

            for(key in _data) {
              if(_data.hasOwnProperty(key)) {

                decodedName = (_decode && nameDecoder) ? nameDecoder(key) : key;
                fullName = _prefix + decodedName;

                // check if property is masked for this operation
                if(!((masks[fullName] || 0) & _mask)) {

                  value = _data[key];
                  filter = _decode ? decoders[fullName] : encoders[fullName];

                  if(filter) {
                    value = filter.call(_ctx, value);
                    if(value === undefined) continue; // ignore value if filter returns undefined
                  } else if(typeof value === 'object' && value &&
                    (_decode || typeof value.toJSON !== 'function')) {
                    // IDEA: make extended decoding/encoding optional, could be a little taxxing for some apps
                    value = transformExtended(value, _ctx, fullName, _mask, _decode);
                  }

                  encodedName = (!_decode && nameEncoder) ? nameEncoder(decodedName) : decodedName;
                  result[encodedName] = value;
                }
              }
            }

            return result;
          }

          // extended part of transformation function, enables deep object transform.
          function transformExtended(_data, _ctx, _prefix, _mask, _decode) {
            if(isArray(_data))
            {
              var fullName = _prefix + '[]',
                  filter = _decode ? decoders[fullName] : encoders[fullName],
                  result = [], i, l, value;

              for(i = 0, l = _data.length; i < l; i++) {
                value = _data[i];
                if(filter) {
                  value = filter.call(_ctx, value);
                } else if(typeof value === 'object' && value &&
                  (_decode || typeof value.toJSON !== 'function')) {
                  value = transformExtended(value, _ctx, _prefix, _mask, _decode);
                }
                result.push(value);
              }

              return result;
            } else {
              return transform(_data, _ctx, _prefix + '.', _mask, _decode);
            }
          }

          /**
           * @class Model
           *
           * @property {string} $partial The model partial url, relative to the context.
           * @property {ModelCollection|Model} $context The model context (parent).
           * @property {promise} $promise The last request promise, returns the model.
           * @property {boolean} $pending The last request status.
           * @property {string} $error The last request error, if any.
           *
           * @description
           *
           * The base model type, this is the starting point for every model generated by $restmod.
           *
           * Inherits all static methods from {@link ModelCollection}.
           *
           * #### About object creation
           *
           * Direct construction of object instances using `new` is not recommended. A collection of
           * static methods are available to generate new instances of an model, for more information
           * go check the {@link ModelCollection} documentation.
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

          Model.prototype = {
            /**
             * @memberof Model#
             *
             * @description Returns the url this object is bound to.
             *
             * @param {object} _opt Options to be passed to the url builder.
             * @return {string} bound url.
             */
            $url: function(_opt) {
              return urlBuilder.resourceUrl(this, _opt);
            },

            /**
             * @memberof Model#
             *
             * @description Allows calling custom hooks, usefull when implementing custom actions.
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
             * @memberof Model#
             *
             * @description Low level communication method, wraps the $http api.
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
             * @memberof Model#
             *
             * @description Promise chaining method, keeps the model instance as the chain context.
             *
             * Calls `$q.then` on the model's last promise.
             *
             * Usage:
             *
             * ```javascript
             * col.$fetch().$then(function() { });
             * ```
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
             * @memberof Model#
             *
             * @description Promise chaining, keeps the model instance as the chain context.
             *
             * Calls ´$q.finally´ on the model's last promise (not really, in 1.2.0 it will).
             *
             * Usage:
             *
             * ```javascript
             * col.$fetch().$finally(function() { });
             * ```
             *
             * @param {function} _cb callback
             * @return {Model} self
             */
            $finally: function(_cb) {
              return this.$then(_cb, _cb);
            },

            /**
             * @memberof Model#
             *
             * @description Feed raw data to this instance.
             *
             * @param {object} _raw Raw data to be fed
             * @param {string} _mask Action mask
             * @return {Model} this
             */
            $decode: function(_raw, _mask) {
              transform(_raw, this, '', _mask || SyncMask.DECODE_USER, true, this);
              callback('after-feed', this, _raw);
              return this;
            },

            /**
             * @memberof Model#
             *
             * @description Generate data to be sent to the server when creating/updating the resource.
             *
             * @param {string} _action Action that originated the render
             * @return {Model} this
             */
            $encode: function(_mask) {
              var raw = transform(this, this, '', _mask || SyncMask.ENCODE_USER, false);
              callback('before-render', this, raw);
              return raw;
            },

            /**
             * @memberof Model#
             *
             * @description Begin a server request for updated resource data.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $fetch: function() {
              // verify that instance has a bound url
              if(!this.$url()) throw new Error('Cannot fetch an unbound resource');

              var request = { method: 'GET', url: this.$url() };

              callback('before-fetch', this, request);
              callback('before-request', this, request);
              return this.$send(request, function(_response) {

                callback('after-request', this, _response);

                var data = _response.data;
                if (!data || isArray(data)) {
                  throw new Error('Expected object while feeding resource');
                }
                this.$decode(data);

                callback('after-fetch', this, _response );
              });
            },

            /**
             * @memberof Model#
             *
             * @description Begin a server request to create/update resource.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $save: function() {
              var url, request;

              if(this.$url()) {
                // If bound, update

                url = urlBuilder.updateUrl(this);
                if(!url) throw new Error('Update is not supported by this resource');

                request = { method: 'PUT', url: url, data: this.$encode(SyncMask.ENCODE_UPDATE) };

                callback('before-update', this, request);
                callback('before-save', this, request);
                callback('before-request', this, request);
                return this.$send(request, function(_response) {

                  callback('after-request', this, _response);

                  var data = _response.data;
                  if (data && !isArray(data)) this.$decode(data, SyncMask.DECODE_UPDATE);

                  callback('after-update', this, _response);
                  callback('after-save', this, _response);
                });
              } else {
                // If not bound create.

                url = urlBuilder.createUrl(this);
                if(!url) throw new Error('Create is not supported by this resource');

                request = { method: 'POST', url: url, data: this.$encode(SyncMask.ENCODE_CREATE) };

                callback('before-save', this, request);
                callback('before-create', this, request);
                callback('before-request', this, request);
                return this.$send(request, function(_response) {

                  callback('after-request', this, _response);

                  var data = _response.data;
                  if (data && !isArray(data)) this.$decode(data, SyncMask.DECODE_CREATE);

                  callback('after-create', this, _response);
                  callback('after-save', this, _response);
                });
              }
            },

            /**
             * @memberof Model#
             *
             * @description Begin a server request to destroy the resource.
             *
             * The request's promise is provided as the $promise property.
             *
             * @return {Model} this
             */
            $destroy: function() {
              var url = urlBuilder.destroyUrl(this);
              if(!url) throw new Error('Destroy is not supported by this resource');

              var request = { method: 'DELETE', url: url };

              callback('before-destroy', this, request);
              return this.$send(request, function(_response) {
                callback('after-destroy', this, _response);
              });
            }
          };

          /**
           * @class ModelCollection
           *
           * @description
           *
           * Collections are sets of model instances bound to a given api resource. When a model
           * class is generated, the corresponding collection class is also generated.
           */
          var Collection = {
            /**
             * @memberof ModelCollection#
             *
             * @description Returns the url this collection is bound to.
             *
             * @param {object} _opt Options to be passed to the url builder.
             * @return {string} bound url.
             */
            $url: function(_opt) {
              return urlBuilder.collectionUrl(this, _opt);
            },

            /**
             * @memberof ModelCollection#
             *
             * @description Builds a new instance of this model
             *
             * If `_init` is not an object, then its treated as a primary key.
             *
             * @param  {object} _init Initial values
             * @return {Model} model instance
             */
            $build: function(_init) {
              var init, keyName;
              if(!isObject(_init)) {
                init = {};
                keyName = urlBuilder.inferKey(this);
                if(!keyName) throw new Error('Cannot infer key, use explicit mode');
                init[keyName] = _init;
              } else init = _init;

              var obj = new Model(init, null, this);
              if(this.$isCollection) this.push(obj); // on collection, push new object
              return obj;
            },

            /**
             * @memberof ModelCollection#
             *
             * @description Builds a new instance of this model using undecoded data
             *
             * @param  {object} _raw Undecoded data
             * @return {Model} model instance
             */
            $buildRaw: function(_raw) {
              return this.$build(null).$decode(_raw);
            },

            /**
             * @memberof ModelCollection#
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
             * @memberof ModelCollection#
             *
             * @description Attempts to resolve a resource using provided data
             *
             * If `_init` is not an object, then its treated as a primary key.
             *
             * @param  {object} _init Data to provide
             * @return {Model} model instance
             */
            $find: function(_init) {
              var init, keyName;
              if(!isObject(_init)) {
                init = {};
                keyName = urlBuilder.inferKey(this);
                if(!keyName) throw new Error('Cannot infer key, use explicit mode');
                init[keyName] = _init;
              } else init = _init;

              // dont use $build, find does not push into current collection.
              return (new Model(init, null, this)).$fetch();
            },

            /**
             * @memberof ModelCollection#
             *
             * @description Builds a new Model collection
             *
             * Collections are bound to an api resource.
             *
             * @param  {object} _params  Additional query string parameters
             * @param  {string} _url     Optional collection URL (relative to context)
             * @param  {object} _context Collection context override
             * @return {Collection} Model Collection
             */
            $collection: function(_params, _url, _context) {

              _params = this.$params ? extend({}, this.$params, _params) : _params;

              var col = [];

              // Since Array cannot be extended, use method injection
              // TODO: try to find a faster alternative, use for loop instead for example.
              for(var key in Collection) {
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

            /**
             * @memberof ModelCollection#
             *
             * @description Generates a new collection bound to this context and url and calls $fetch on it.
             *
             * @param {object} _params Collection parameters
             * @return {Collection} Model collection
             */
            $search: function(_params) {
              return this.$collection(_params).$fetch();
            },

            // Collection exclusive methods

            /**
             * @memberof ModelCollection#
             *
             * @description Promise chaining method, keeps the collection instance as the chain context.
             *
             * Calls `$q.then` on the collection's last promise.
             *
             * Usage:
             *
             * ```javascript
             * col.$fetch().$then(function() { });
             * ```
             *
             * @param {function} _success success callback
             * @param {function} _error error callback
             * @return {ModelCollection} self
             */
            $then: function(_success, _error) {
              if(!this.$isCollection) throw new Error('$then is only supported by collections');
              this.$promise = this.$promise.then(_success, _error);
              return this;
            },

            /**
             * @memberof ModelCollection#
             *
             * @description Promise chaining, keeps the collection instance as the chain context.
             *
             * Calls ´$q.finally´ on the collection's last promise (not really, in 1.2.0 it will)
             *
             * Usage:
             *
             * ```javascript
             * col.$fetch().$finally(function() { });
             * ```
             *
             * @param {function} _cb callback
             * @return {ModelCollection} self
             */
            $finally: function(_cb) {
              return this.$then(_cb, _cb);
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
              if(!this.$isCollection) throw new Error('$feed is only supported by collections');
              if(!this.$resolved) this.length = 0; // reset contents if not resolved.
              forEach(_raw, this.$buildRaw, this);
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
              if(!this.$isCollection) throw new Error('$reset is only supported by collections');
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
             * TODO: support POST data queries (complex queries scenarios)
             *
             * @param {object} _params Additional request parameters, these parameters are not stored in collection.
             * @return {Collection} self
             */
            $fetch: function(_params) {

              if(!this.$isCollection) throw new Error('$fetch is only supported by collections');

              var params = _params ? extend({}, this.$params || {}, _params) : this.$params,
                  request = { method: 'GET', url: this.$url(), params: params };

              // TODO: check that collection is bound.
              callback('before-fetch-many', this, request);
              callback('before-request', this, request);
              send(this, request, function(_response) {

                callback('after-request', this, _response);

                var data = _response.data;
                if(!data || !isArray(data)) {
                  throw new Error('Error in resource {0} configuration. Expected response to be array');
                }

                // reset and feed retrieved data.
                this.$feed(data);

                callback('after-fetch-many', this, _response);
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
            }

            // IDEA: $clear, $push, $remove, etc
          };

          // Model customization phase:
          // - Generate the model builder DSL
          // - Process metadata from base chain
          // - Process metadata from arguments

          // Available mappings.
          var mappings = {
            init: ['attrDefault'],
            ignore: ['attrIgnored'],
            decode: ['attrDecoder', 'param', 'chain'],
            encode: ['attrEncoder', 'param', 'chain'],
            serialize: ['attrSerializer'],
            hasMany: ['hasMany', 'alias'],
            hasOne: ['hasOne', 'alias']
          }, urlBuilderFactory;

          /**
           * @class ModelBuilder
           *
           * @description
           *
           * Provides the DSL for model generation.
           *
           * ### About model descriptions
           *
           * This class is also responsible for parsing **model description objects** passed to
           * the mixin chain.
           *
           * Example of description:
           *
           * ```javascript
           * $restmod.model('', {
           *   propWithDefault: { init: 20 },
           *   propWithDecoder: { decode: 'date', chain: true },
           *   relation: { hasMany: 'Other' },
           * });
           * ```
           *
           * The descriptions are processed by the `describe` method and mapped to builder attribute methods.
           *
           * The following built in property modifiers are provided (see each method docs for usage information):
           *
           * * `init` maps to {@link ModelBuilder#attrDefault}
           * * `ignore` maps to {@link ModelBuilder#attrIgnored}
           * * `decode` maps to {@link ModelBuilder#attrDecoder}
           * * `encode` maps to {@link ModelBuilder#attrEncoder}
           * * `serialize` maps to {@link ModelBuilder#attrSerializer}
           * * `hasMany` maps to {@link ModelBuilder#hasMany}
           * * `hasOne` maps to {@link ModelBuilder#hasOne}
           *
           * Mapping a *primitive* to a property is the same as using the `init` modifier.
           * Mapping a *function* to a property calls {@link ModelBuilder#define} on the function.
           *
           */
          var Builder = {
            setHttpOptions: function(_options) {
              // TODO.
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Change the default url builder.
             *
             * The provided factory will be called to provide an url builder
             * for  implement a `get` method that receives the resource baseUrl
             * and returns an url builder.
             *
             * TODO: describe url builder interface
             *
             * @param {function} _factory Url builder factory function.
             */
            setUrlBuilderFactory: function(_factory) {
              urlBuilderFactory = _factory;
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Changes the way restmod renames attributes every time a server resource is decoded.
             *
             * This is intended to be used as a way of keeping property naming style consistent accross
             * languajes. By default, property naming in js should use camelcase and property naming
             * in JSON api should use snake case with underscores.
             *
             * If `false` is given, then renaming is disabled
             *
             * @param {function|false} _value decoding function
             * @return {ModelBuilder} self
             */
            setNameDecoder: function(_decoder) {
              nameDecoder = _decoder;
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Changes the way restmod renames attributes every time a local resource is encoded to be sent.
             *
             * This is intended to be used as a way of keeping property naming style consistent accross
             * languajes. By default, property naming in js should use camelcase and property naming
             * in JSON api should use snake case with underscores.
             *
             * If `false` is given, then renaming is disabled
             *
             * @param {function|false} _value encoding function
             * @return {ModelBuilder} self
             */
            setNameEncoder: function(_encoder) {
              nameEncoder = _encoder;
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Disables renaming alltogether
             *
             * @return {ModelBuilder} self
             */
            disableRenaming: function() {
              return this
                .setNameDecoder(false)
                .setNameEncoder(false);
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Extends the builder DSL
             *
             * Adds a function to de builder and alternatively maps the function to an
             * attribute definition keyword that can be later used when calling
             * `define` or `attribute`.
             *
             * Mapping works as following:
             *
             *    // Given the following call
             *    builder.extend('testAttr', function(_attr, _test, _param1, param2) {
             *      // wharever..
             *    }, ['test', 'testP1', 'testP2']);
             *
             *    // A call to
             *    builder.attribute('chapter', { test: 'hello', testP1: 'world' });
             *
             *    // Its equivalent to
             *    builder.testAttr('chapter', 'hello', 'world');
             *
             * The method can also be passed an object with various methods to be added.
             *
             * @param {string|object} _name function name or object to merge
             * @param {function} _fun function
             * @param {array} _mapping function mapping definition
             * @return {ModelBuilder} self
             */
            extend: function(_name, _fun, _mapping) {
              if(typeof _name === 'string') {
                this[_name] = Utils.override(this[name], _fun);
                if(_mapping) {
                  mappings[_mapping[0]] = _mapping;
                  _mapping[0] = _name;
                }
              } else Utils.extendOverriden(this, _name);
              return this;
            },
            /**
             * @memberof ModelBuilder#
             *
             * @description Parses a description object, calls the proper builder method depending
             * on each property description type.
             *
             * @param {object} _description The description object
             * @return {ModelBuilder} self
             */
            describe: function(_description) {
              forEach(_description, function(_desc, _attr) {
                if(isObject(_desc)) this.attribute(_attr, _desc);
                else if(isFunction(_desc)) this.define(_attr, _desc);
                else this.attrDefault(_attr, _desc);
              }, this);
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Sets an attribute properties.
             *
             * This method uses the attribute modifiers mapping to call proper
             * modifiers on the argument.
             *
             * For example, using the following description on the createdAt attribute
             *
             *    { decode: 'date', param; 'YY-mm-dd' }
             *
             * Is the same as calling
             *
             *    builder.attrDecoder('createdAt', 'date', 'YY-mm-dd')
             *
             * @param {string} _name Attribute name
             * @param {object} _description Description object
             * @return {ModelBuilder} self
             */
            attribute: function(_name, _description) {
              var key, map, args, i;
              for(key in _description) {
                if(_description.hasOwnProperty(key)) {
                  map = mappings[key];
                  if(map) {
                    args = [_name, _description[key]];
                    for(i = 1; i < map.length; i++) {
                      args.push(_description[map[i]]);
                    }
                    args.push(_description);
                    this[map[0]].apply(this, args);
                  }
                }
              }
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Sets the default value for an attribute.
             *
             * Defaults values are set only on object construction phase.
             *
             * if `_init` is a function, then its evaluated every time the
             * default value is required.
             *
             * @param {string} _attr Attribute name
             * @param {mixed} _init Defaulf value / iniline function
             * @return {ModelBuilder} self
             */
            attrDefault: function(_attr, _init) {
              // IDEA: maybe fixed defaults could be added to Model prototype...
              defaults.push([_attr, _init]);
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Ignores/un-ignores an attribute.
             *
             * This method changes the attribute masmask
             *
             * @param {string} _attr Attribute name
             * @param {boolean|integer} _mask Ignore mask.
             * @param {boolean} _reset If set to true, old mask is reset.
             * @return {ModelBuilder} self
             */
            attrIgnored: function(_attr, _mask, _reset) {

              if(_mask === true) {
                masks[_attr] = SyncMask.ALL;
              } else if(_mask === false) {
                delete masks[_attr];
              } else if(_reset) {
                masks[_attr] = _mask;
              } else {
                masks[_attr] |= _mask;
              }

              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Assigns a serializer to a given attribute.
             *
             * A _serializer is:
             * * an object that defines both a `decode` and a `encode` method
             * * a function that when called returns an object that matches the above description.
             * * a string that represents an injectable that matches any of the above descriptions.
             *
             * @param {string} _name Attribute name
             * @param {string|object|function} _serializer The serializer
             * @return {ModelBuilder} self
             */
            attrSerializer: function(_name, _serializer, _opt) {
              if(typeof _serializer === 'string') {
                _serializer = $injector.get(Utils.camelcase(_serializer) + 'Serializer');
              }

              // TODO: if(!_serializer) throw $setupError
              if(isFunction(_serializer)) _serializer = _serializer(_opt);
              if(_serializer.decode) this.attrDecoder(_name, bind(_serializer, _serializer.decode));
              if(_serializer.encode) this.attrEncoder(_name, bind(_serializer, _serializer.encode));
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Assigns a decoding function/filter to a given attribute.
             *
             * @param {string} _name Attribute name
             * @param {string|function} _filter filter or function to register
             * @param {mixed} _filterParam Misc filter parameter
             * @param {boolean} _chain If true, filter is chained to the current attribute filter.
             * @return {ModelBuilder} self
             */
            attrDecoder: function(_name, _filter, _filterParam, _chain) {
              if(typeof _filter === 'string') {
                var filter = $filter(_filter);
                // TODO: if(!_filter) throw $setupError
                _filter = function(_value) { return filter(_value, _filterParam); };
              }

              decoders[_name] = _chain ? Utils.chain(decoders[_name], _filter) : _filter;
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Assigns a encoding function/filter to a given attribute.
             *
             * @param {string} _name Attribute name
             * @param {string|function} _filter filter or function to register
             * @param {mixed} _filterParam Misc filter parameter
             * @param {boolean} _chain If true, filter is chained to the current attribute filter.
             * @return {ModelBuilder} self
             */
            attrEncoder: function(_name, _filter, _filterParam, _chain) {
              if(typeof _filter === 'string') {
                var filter = $filter(_filter);
                // TODO: if(!_filter) throw $setupError
                _filter = function(_value) { return filter(_value, _filterParam); };
              }

              encoders[_name] = _chain ? Utils.chain(encoders[_name], _filter) : _filter;
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Registers a model hasMany relation
             *
             * The `_model` attribute supports both a string (using injector) o
             * a direct restmod Model type reference.
             *
             * @param {string}  _name Attribute name
             * @param {string|object} _model Other model
             * @param {string} _url Partial url
             * @return {ModelBuilder} self
             */
            hasMany: function(_name, _model, _alias) {
              return this.attrDefault(_name, function() {
                if(typeof _model === 'string') _model = $injector.get(_model); // inject type (only the first time...)
                return _model.$collection(null, _alias || Utils.snakecase(_name, '-'), this); // TODO: put snakecase transformation in URLBuilder
              }).attrDecoder(_name, function(_raw) {
                this[_name].$feed(_raw);
              }).attrIgnored(_name, SyncMask.ENCODE);
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Registers a model hasOne relation
             *
             * The `_model` attribute supports both a string (using injector) o
             * a direct restmod Model type reference.
             *
             * @param {string}  _name Attribute name
             * @param {string|object} _model Other model
             * @param {string} _url Partial url
             * @return {ModelBuilder} self
             */
            hasOne: function(_name, _model, _partial) {
              return this.attrDefault(_name, function() {
                if(typeof _model === 'string') _model = $injector.get(_model); // inject type (only the first time...)
                return new _model(null, _partial || Utils.snakecase(_name, '-'), this); // TODO: put snakecase transformation in URLBuilder
              }).attrDecoder(_name, function(_raw) {
                this[_name].$decode(_raw);
              }).attrIgnored(_name, SyncMask.ENCODE);
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Registers an instance method
             *
             * Usage:
             *    builder.define(function(_super) {
             *      return $fetch()
             *    });
             *
             * It is posible to override an existing method using define,
             * if overriden, the old method can be called using `this.$super`
             * inside de new method.
             *
             * @param {string} _name Method name
             * @param {function} _fun Function to define
             * @return {ModelBuilder} self
             */
            define: function(_name, _fun) {
              if(typeof _name === 'string') {
                Model.prototype[_name] = Utils.override(Model.prototype[_name], _fun);
              } else {
                Utils.extendOverriden(Model.prototype, _name);
              }
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Registers a class method
             *
             * It is posible to override an existing method using define,
             * if overriden, the old method can be called using `this.$super`
             * inside de new method.
             *
             * @param {string} _name Method name
             * @param {function} _fun Function to define
             * @return {ModelBuilder} self
             */
            classDefine: function(_name, _fun) {
              if(typeof _name === 'string') {
                Collection[_name] = Utils.override(Collection[_name], _fun);
              } else {
                Utils.extendOverriden(Collection, _name);
              }
              return this;
            },

            /**
             * @memberof ModelBuilder#
             *
             * @description Adds an event hook
             *
             * Hooks are used to extend or modify the model behavior, and are not
             * designed to be used as an event listening system.
             *
             * The given function is executed in the hook's context, different hooks
             * make different parameters available to callbacks.
             *
             * @param {string} _hook The hook name, refer to restmod docs for builtin hooks.
             * @param {function} _do function to be executed
             * @return {ModelBuilder} self
             */
            on: function(_hook, _do) {
              var cbs = callbacks[_hook];
              if(!cbs) cbs = callbacks[_hook] = [];
              cbs.push(_do);
              return this;
            },

            beforeRequest: function(_do) { return this.on('before-request', _do); },
            afterRequest: function(_do) { return this.on('after-request', _do); },
            beforeSave: function(_do) { return this.on('before-save', _do); },
            beforeCreate: function(_do) { return this.on('before-create', _do); },
            afterCreate: function(_do) { return this.on('after-create', _do); },
            beforeUpdate: function(_do) { return this.on('before-update', _do); },
            afterUpdate: function(_do) { return this.on('after-update', _do); },
            afterSave: function(_do) { return this.on('after-save', _do); },
            beforeDestroy: function(_do) { return this.on('before-destroy', _do); },
            afterDestroy: function(_do) { return this.on('after-destroy', _do); },
            afterFeed: function(_do) { return this.on('after-feed', _do); },
            beforeRender: function(_do) { return this.on('before-render', _do); },

            /// Experimental modifiers

            /**
             * @memberof ModelBuilder#
             *
             * @description Expression attributes are evaluated every time new data is fed to the model.
             *
             * @param {string}  _name Attribute name
             * @param {string} _expr Angular expression to evaluate
             * @return {ModelBuilder} self
             */
            attrExpression: function(_name, _expr) {
              var filter = $parse(_expr);
              this.on('after-feed', function() {
                this[_name] = filter(this);
              });
            }
          };

          // use the builder to process a mixin chain
          function loadMixinChain(_chain) {
            for(var i = 0, l = _chain.length; i < l; i++) {
              loadMixin(_chain[i]);
            }
          }

          // use the builder to process a single mixin
          function loadMixin(_mix) {
            if(_mix.$chain) {
              loadMixinChain(_mix.$chain);
            } else if(typeof _mix === 'string') {
              loadMixin($injector.get(_mix));
            } else if(isArray(_mix) || isFunction(_mix)) {
              // TODO: maybe invoke should only be called for BASE_CHAIN functions
              $injector.invoke(_mix, Builder, { $builder: Builder });
            } else Builder.describe(_mix);
          }

          loadMixinChain(BASE_CHAIN);
          loadMixinChain(Model.$chain = arraySlice.call(arguments, 1));

          /*
           * Mixin post-processing phase
           */

          // by default use the restUrlBuilder
          urlBuilder = (urlBuilderFactory || $injector.get('restUrlBuilderFactory')())(_urlParams);

          // TODO postprocessing of collection prototype.
          extend(Model, Collection);

          return Model;
        },

        /**
         * @method mixin
         * @memberOf services.$restmod#
         *
         * @description
         *
         * The mixin factory
         *
         * A mixin is just a metadata container that can be included in a mixin chain.
         *
         * @return {object} The abstract model
         */
        mixin: function(/* mixins */) {
          return { $isAbstract: true, $chain: arraySlice.call(arguments, 0) };
        }
      };
    }]
  };
})
.factory('model', ['$restmod', function($restmod) {
  return $restmod.model;
}])
.factory('mixin', ['$restmod', function($restmod) {
  return $restmod.mixin;
}])
// make SyncMask available as constant
.constant('SyncMask', SyncMask);

