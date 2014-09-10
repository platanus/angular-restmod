'use strict';

RMModule.factory('RMModelFactory', ['$injector', '$log', 'inflector', 'RMUtils', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMCollectionApi', 'RMExtendedApi', 'RMSerializer', 'RMBuilder',
  function($injector, $log, inflector, Utils, ScopeApi, CommonApi, RecordApi, CollectionApi, ExtendedApi, Serializer, Builder) {

  var NAME_RGX = /(.*?)([^\/]+)\/?$/,
      extend = Utils.extendOverriden;

  return function(_baseUrl, _baseChain) {

    _baseUrl = Utils.cleanUrl(_baseUrl);

    var config = {
        primaryKey: 'id',
        urlPrefix: null
      },
      serializer = new Serializer(),
      packer = null,
      defaults = [],                    // attribute defaults as an array of [key, value]
      meta = {},                        // atribute metadata
      hooks = {},
      builder;                          // the model builder

    // make sure a style base was selected for the model

    // if(!internal.style) {
    //   $log.warn('No API style base was included, see the Api Integration Guide.');
    // }

    // make sure the resource name and plural name are available if posible:

    if(!config.name && _baseUrl) {
      config.name = inflector.singularize(_baseUrl.replace(NAME_RGX, '$2'));
    }

    if(!config.plural && config.name) {
      config.plural = inflector.pluralize(config.name);
    }

    // IDEA: make constructor inaccessible, use separate type for records?
    // * Will ensure proper usage.
    // * Will lose type checking
    function Model(_scope, _pk) {
      this.$type = Model;
      this.$scope = _scope || Model;
      this.$pk = _pk;
      this.$initialize();
    }

    var Collection = Utils.buildArrayType();

    // Collection factory (since a constructor cant be provided...)
    function newCollection(_scope, _params) {
      var col = new Collection();
      col.$type = Model;
      col.$scope = _scope;
      col.$params = _params;
      col.$initialize();
      return col;
    }

    // packer adaptor generator
    function adaptPacker(_fun) {
      return function(_raw) {
        if(packer) {
          // a packer instance must be built every time.
          var inst = typeof packer === 'function' ? new packer(Model) : packer;
          return inst[_fun](_raw, this);
        }

        return _raw;
      };
    }

    // Infer key adaptor.
    function inferKey() {
      return Model.$inferKey.apply(Model, arguments);
    }

    // Get property adaptor.
    function getProperty() {
      return Model.$getProperty.apply(Model, arguments);
    }

    ///// Setup static api

    /**
     * @class StaticApi
     * @extends ScopeApi
     * @extends CommonApi
     *
     * @description
     *
     * The restmod type API, every generated restmod model type exposes this API.
     *
     * @property {object} $type Reference to the type itself, for compatibility with the {@link ScopeApi}
     *
     * #### About object creation
     *
     * Direct construction of object instances using `new` is not recommended. A collection of
     * static methods are available to generate new instances of a model, for more information
     * read the {@link ModelCollection} documentation.
     */
    extend(Model, {

      // definition chain
      $$chain: [],

      // infer key adaptor
      $$inferKey: inferKey,

      // creates a new model bound by default to the static scope
      $new: function(_pk, _scope) {
        return new Model(_scope || Model, _pk);
      },

      // creates a new collection bound by default to the static scope
      $collection: function(_params, _scope) {
        return newCollection(_scope || Model, _params);
      },

      // gets an attribute description (metadata)
      $$getDescription: function(_attribute) {
        return meta[_attribute];
      },

      /**
       * @memberof StaticApi#
       *
       * @description
       *
       * Extracts the primary key from raw record data.
       *
       * Uses the key configured in the PRIMARY_KEY variable or 'id' by default.
       *
       * Some considerations:
       * * This method can be overriden to handle other scenarios.
       * * This method should not change the raw data passed to it.
       * * The primary key value extracted by this method should be comparable using the == operator.
       *
       * @param  {string} _rawData Raw object data (before it goes into decode)
       * @return {mixed} The primary key value.
       */
      $inferKey: function(_rawData) {
        if(!_rawData || typeof _rawData[config.primaryKey] === 'undefined') return null;
        return _rawData[config.primaryKey];
      },

      /**
       * @memberof StaticApi#
       *
       * @description
       *
       * Gets a model's internal property value.
       *
       * Some builtin properties:
       * * url
       * * urlPrefix
       * * primaryKey
       *
       * @param  {string} _key Property name
       * @param  {mixed} _default Value to return if property is not defined
       * @return {mixed} value
       */
      $getProperty: function(_key, _default) {
        var val = config[_key];
        return val !== undefined ? val : _default;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns true if model is anonymous.
       *
       * An anonymous model can only be used as a nested resource (using relations)
       *
       * @return {boolean} true if model is anonymous.
       */
      $anonymous: function() {
        return !_baseUrl;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns a resource bound to a given url, with no parent scope.
       *
       * This can be used to create singleton resources:
       *
       * ```javascript
       * module('BikeShop', []).factory('Status', function(restmod) {
       *   return restmod.model(null).$single('/api/status');
       * };)
       * ```
       *
       * @param {string} _url Url to bound resource to.
       * @return {Model} new resource instance.
       */
      $single: function(_url) {
        return new Model({
          $urlFor: function() {
            return config.urlPrefix ? Utils.joinUrl(config.urlPrefix, _url) : _url;
          }
        }, '');
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns the model base url.
       *
       * @return {string} The base url.
       */
      $url: function() {
        return config.urlPrefix ? Utils.joinUrl(config.urlPrefix, _baseUrl) : _baseUrl;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns the model API name.
       *
       * This name should match the one used throughout the API. It's only used by some extended
       * functionality, like the default packer.
       *
       * By default model name is infered from the url, but for anonymous models and special cases
       * it should be manually set by writing the name and plural properties:
       *
       * ```javascript
       * restmod.model(null, {
       *   __name__: 'resource',
       *   __plural__: 'resourciness' // set only if inflector cant properly gess the name.
       * });
       * ```
       *
       * @return {boolean} If true, return plural name
       * @return {string} The base url.
       */
      $name: function(_plural) {
        return _plural ? config.plural : config.name;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Part of the scope interface, provides urls for collection's items.
       *
       * @param {Model} _pk Item key to provide the url to.
       * @return {string|null} The url or nill if item does not meet the url requirements.
       */
      $urlFor: function(_pk) {
        // TODO: move to scope api, unify with collection
        return Utils.joinUrl(this.$url(), _pk);
      },

      /**
       * @memberof StaticApi#
       *
       * @description Modifies model behavior.
       *
       * @params {mixed} _mixins One or more mixins or model definitions.
       * @return {Model} The model
       */
      $mix: function(/* mixins */) {
        builder.chain(arguments);
        this.$$chain.push.apply(this.$$chain, arguments);
        return this;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Simple $dispatch implementation for CommonApi compat.
       *
       * @param  {string} _hook Hook name
       * @param  {array} _args Hook arguments
       * @param  {object} _ctx Hook execution context override
       *
       * @return {Model} The model
       */
      $dispatch: function(_hook, _args, _ctx) {
        var cbs = hooks[_hook], i, cb;
        if(cbs) {
          for(i = 0; !!(cb = cbs[i]); i++) {
            cb.apply(_ctx || this, _args || []);
          }
        }
        return this;
      }

    }, ScopeApi);

    ///// Setup record api

    extend(Model.prototype, {

      // infer key adaptor
      $$inferKey: inferKey,

      // default initialize: loads the default parameter values
      $initialize: function() {
        var tmp;
        for(var i = 0; (tmp = defaults[i]); i++) {
          this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
        }
      },

      // packer pack adaptor used by $wrap
      $$pack: adaptPacker('pack'),

      // packer unpack adaptor used by $unwrap
      $$unpack: adaptPacker('unpack'),

      // serializer decode adaptor used by $decode
      $decode: function(_raw, _mask) {
        serializer.decode(this, _raw, _mask);
      },

      // serializer encode adaptor used by $encode
      $encode: function(_mask) {
        return serializer.encode(this, _mask);
      },

      // expose getProperty in records
      $getProperty: getProperty
    }, CommonApi, RecordApi, ExtendedApi);

    ///// Setup collection api

    extend(Collection.prototype, {

      // infer key adaptor
      $$inferKey: inferKey,

      // provide record contructor
      $new: function(_pk, _scope) {
        return new Model(_scope || this, _pk);
      },

      // provide collection constructor
      $collection: function(_params, _scope) {
        _params = this.$params ? angular.extend({}, this.$params, _params) : _params;
        return newCollection(_scope || this.$scope, _params);
      },

      // packer pack adaptor used by $wrap
      $$pack: adaptPacker('packMany'),

      // packer unpack adaptor used by $unwrap
      $$unpack: adaptPacker('unpackMany'),

      // expose getProperty in collection
      $getProperty: getProperty

    }, ScopeApi, CommonApi, CollectionApi, ExtendedApi);

    ///// Setup builder

    /**
     * @class SerializerBuilderApi
     *
     * @description
     *
     * Provides an isolated set of methods to customize the serializer behaviour.
     *
     */
    builder = new Builder(angular.extend(serializer.dsl(), {

      /**
       * @memberof BuilderApi#
       *
       * Sets one of the model's configuration properties.
       *
       * The following configuration parameters are available by default:
       * * primaryKey: The model's primary key, defaults to **id**. Keys must use server naming convention!
       * * urlPrefix: Url prefix to prepend to resource url, usefull to use in a base mixin when multiples models have the same prefix.
       * * url: The resource base url, null by default. If not given resource is considered anonymous.
       *
       * @param {string} _key The configuration key to set.
       * @param {mixed} _value The configuration value.
       * @return {BuilderApi} self
       */
      setProperty: function (_key, _value) {
        config[_key] = _value;
        return this;
      },

      /**
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
       */
      attrDefault: function(_attr, _init) {
        defaults.push([_attr, _init]);
        return this;
      },

      /**
       * @memberof BuilderApi#
       *
       * @description Registers attribute metadata.
       *
       * @param {string} _name Attribute name
       * @param {object} _metadata Attribute metadata
       * @return {BuilderApi} self
       */
      attrMeta: function(_name, _metadata) {
        meta[_name] = extend(meta[_name] || {}, _metadata);
        return this;
      },

      /**
       * @memberof ExtendedBuilderApi#
       *
       * @description
       *
       * Sets the object "packer", the packer is responsable of providing the object wrapping strategy
       * so it matches the API.
       *
       * The method accepts a packer name, an instance or a packer factory, if the first (preferred)
       * option is used, then a <Name>Packer factory must be available that return an object or factory function.
       *
       * In case of using a factory function, the constructor will be called passing the model type object
       * as first parameter:
       *
       * ```javascript
       * // like this:
       * var packer = new packerFactory(Model);
       * ```
       *
       * ### Packer structure.
       *
       * Custom packers must implement all of the following methods:
       *
       * * **unpack(_rawData, _record):** unwraps data belonging to a single record, must return the unpacked
       * data to be passed to `$decode`.
       * * **unpackMany(_rawData, _collection):** unwraps the data belonging to a collection of records,
       * must return the unpacked data array, each array element will be passed to $decode on each new element.
       * * **pack(_rawData, _record):** wraps the encoded data from a record before is sent to the server,
       * must return the packed data object to be sent.
       * * **packMany(_rawData, _collection):** wraps the encoded data from a collection before is sent to the server,
       * must return the packed data object to be sent.
       *
       * Currently the following builtin strategies are provided:
       * * {@link DefaultPacker} with json root, metadata and links support.
       *
       * @param {string|object} _mode The packer instance, constructor or name
       * @return {BuilderApi} self
       */
      setPacker: function(_packer) {

        if(typeof _packer === 'string') {
          _packer = $injector.get(inflector.camelize(_packer, true) + 'Packer');
        }

        packer = _packer;
        return this;
      },

      /**
       * @memberof BuilderApi#
       *
       * @description Adds methods to the model
       *
       * By default this method adds **record** methods. If called with an object
       * instead of a function it can be used to extend the collection and the type with
       * specific implementations.
       *
       * Usage:
       *
       * ```javascript
       * restmod.mixin(function() {
       *   this.define('myMethod', function() {})
       *       .define('myMethod', {
       *         record: function() {}, // called when record.myMethod is called.
       *         collection: function() {}, // called when collection.myMethod is called.
       *         type: function() {} // called when Model.myMethod is called.
       *       });
       * });
       * ```
       *
       * It is posible to override an existing method using define,
       * if overriden, the old method can be called using `this.$super`
       * inside de new method.
       *
       * @param {string} _name Method name
       * @param {function} _fun Function to define or object with particular implementations
       * @return {BuilderApi} self
       */
      define: function(_name, _fun) {
        if(typeof _fun === 'function') {
          Model.prototype[_name] = Utils.override(Model.prototype[_name], _fun);
        } else {
          if(_fun.type) Model[_name] = Utils.override(Model[_name], _fun.type);
          if(_fun.collection) Collection.prototype[_name] = Utils.override(Collection.prototype[_name], _fun.collection);
          if(_fun.record) Model.prototype[_name] = Utils.override(Model.prototype[_name], _fun.record);
        }
        return this;
      },

      /**
       * @memberof BuilderApi#
       *
       * @description Registers a scope method
       *
       * Same as calling `define('name', { type: fun, collection: fun })`.
       * See {@link BuilderApi#define} for more information.
       *
       * @param {string} _name Method name
       * @param {function} _fun Function to define
       * @return {BuilderApi} self
       */
      classDefine:  function(_name, _fun) {
        this.define(_name, { type: _fun, collection: _fun });
      },

      /**
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
       */
      on: function(_hook, _do) {
        (hooks[_hook] || (hooks[_hook] = [])).push(_do);
        return this;
      }
    }));

    builder.chain(_baseChain); // load base chain.

    return Model;
  };

}]);
