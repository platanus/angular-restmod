'use strict';

RMModule.factory('RMModelFactory', ['$injector', '$log', 'inflector', 'RMUtils', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMListApi', 'RMCollectionApi', 'RMExtendedApi', 'RMSerializer', 'RMBuilder',
  function($injector, $log, inflector, Utils, ScopeApi, CommonApi, RecordApi, ListApi, CollectionApi, ExtendedApi, Serializer, Builder) {

  var NAME_RGX = /(.*?)([^\/]+)\/?$/,
      extend = Utils.extendOverriden;

  return function(_baseUrl, _baseChain) {

    // IDEA: make constructor inaccessible, use separate type for records?
    // * Will ensure proper usage.
    // * Will lose type checking
    function Model(_scope, _pk) {
      this.$scope = _scope || Model;
      this.$pk = _pk;
      this.$initialize();
    }

    _baseUrl = Utils.cleanUrl(_baseUrl);

    var config = {
        primaryKey: 'id',
        urlPrefix: null
      },
      serializer = new Serializer(Model),
      defaults = [],                    // attribute defaults as an array of [key, value]
      computes = [],                    // computed attributes
      meta = {},                        // atribute metadata
      hooks = {},
      builder;                          // the model builder

    // make sure the resource name and plural name are available if posible:

    if(_baseUrl) {
      config.name = inflector.singularize(_baseUrl.replace(NAME_RGX, '$2'));
    }

    var Collection = Utils.buildArrayType(),
        List = Utils.buildArrayType(),
        Dummy = function(_asCollection) {
          this.$isCollection = _asCollection;
          this.$initialize(); // TODO: deprecate this
        };

    // Collection factory
    function newCollection(_params, _scope) {
      var col = new Collection();
      col.$scope = _scope || Model;
      col.$params = _params;
      col.$initialize();
      return col;
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

      // gets an attribute description (metadata)
      $$getDescription: function(_attribute) {
        return meta[_attribute];
      },

      // definition chain
      $$chain: [],

      // keep a reference to type itself for scope api compatibility
      $type: Model,

      // creates a new model bound by default to the static scope
      $new: function(_pk, _scope) {
        return new Model(_scope || Model, _pk);
      },

      // creates a new collection bound by default to the static scope
      $collection: newCollection,

      // gets scope url
      $url: function() {
        return config.urlPrefix ? Utils.joinUrl(config.urlPrefix, _baseUrl) : _baseUrl;
      },

      // bubbles events comming from related resources
      $dispatch: function(_hook, _args, _ctx) {
        var cbs = hooks[_hook], i, cb;
        if(cbs) {
          for(i = 0; !!(cb = cbs[i]); i++) {
            cb.apply(_ctx || this, _args || []);
          }
        }
        return this;
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
      inferKey: function(_rawData) {
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
      getProperty: function(_key, _default) {
        var val = config[_key];
        return val !== undefined ? val : _default;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns true if model is nested.
       *
       * An nested model can only be used as a nested resource (using hasMany or hasOne relations)
       *
       * @return {boolean} true if model is nested.
       */
      isNested: function() {
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
      single: function(_url) {
        return new Model({
          $urlFor: function() {
            return config.urlPrefix ? Utils.joinUrl(config.urlPrefix, _url) : _url;
          }
        }, '');
      },

      /**
       * Builds a new dummy resource, the dummy resource can be used to execute random queries
       * using the same infrastructure as records and collections.
       *
       * @return {Dummy} the dummy object
       */
      dummy: function(_asCollection) {
        return new Dummy(_asCollection);
      },

      /**
       * Creates a new record list.
       *
       * A list is a ordered set of records not bound to a particular scope.
       *
       * Contained records can belong to any scope.
       *
       * @return {List} the new list
       */
      list: function(_items) {
        var list = new List();
        if(_items) list.push.apply(list, _items);
        return list;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Returns the model API name.
       *
       * This name should match the one used throughout the API. It's only used by some extended
       * functionality, like the default packer.
       *
       * By default model name is infered from the url, but for nested models and special cases
       * it should be manually set by writing the name and plural properties:
       *
       * ```javascript
       * restmod.model().mix{
       *   $config: {
       *     name: 'resource',
       *     plural: 'resourciness' // set only if inflector cant properly gess the name.
       *   }
       * });
       * ```
       *
       * @return {boolean} If true, return plural name
       * @return {string} The base url.
       */
      identity: function(_plural) {
        if(!_plural) return config.name;
        if(_plural) {
          if(config.plural) return config.plural;
          if(config.name) return inflector.pluralize(config.name);
        }
        return null;
      },

      /**
       * @memberof StaticApi#
       *
       * @description Modifies model behavior.
       *
       * @params {mixed} _mixins One or more mixins or model definitions.
       * @return {Model} The model
       */
      mix: function(/* mixins */) {
        builder.chain(arguments);
        this.$$chain.push.apply(this.$$chain, arguments);
        return this;
      },

      // Strategies

      /**
       * @memberof StaticApi#
       *
       * @description The model unpacking strategy
       *
       * This method is called to extract record data from a request response, its also
       * responsible of handling the response metadata.
       *
       * Override this method to change the metadata processing strategy, by default its a noop
       *
       * @params {mixed} _resource Related resource instance
       * @params {mixed} _raw Response raw data
       * @return {mixed} Resource raw data
       */
      unpack: function(_resource, _raw) { return _raw; },

      /**
       * @memberof StaticApi#
       *
       * @description The model packing strategy
       *
       * This method is called to wrap raw record data to be sent in a request.
       *
       * Override this method to change the request packing strategy, by default its a noop
       *
       * @params {mixed} _resource Related resource instance
       * @params {mixed} _raw Record data to be sent (can be an array if resource is collection)
       * @return {mixed} Wrapped data
       */
      pack: function(_record, _raw) { return _raw; },

      /**
       * @memberof StaticApi#
       *
       * @description The model decoding strategy
       *
       * This method is called to populate a record from raw data (unppacked)
       */
      decode: serializer.decode,

      /**
       * @memberof StaticApi#
       *
       * @description The model encoding strategy
       *
       * This method is called to extract raw data from a record to be sent to server (before packing)
       */
      encode: serializer.encode,

      /**
       * @memberof StaticApi#
       *
       * @description The model name decoding strategy
       *
       * This method is called on every raw record data property to rename it, by default is not defined.
       *
       * Override this method to change the property renaming strategy.
       *
       * @params {string} _name Response (raw) name
       * @return {string} Record name
       */
      decodeName: null,

      /**
       * @memberof StaticApi#
       *
       * @description The model name encoding strategy
       *
       * This method is called when encoding a record to rename the record properties into the raw data properties,
       * by default is not defined.
       *
       * Override this method to change the property renaming strategy
       *
       * @params {string} _name Record name
       * @return {string} Response (raw) name
       */
      encodeName: null,

      /**
       * @memberof StaticApi#
       *
       * @description The model name to url encoding strategy
       *
       * This method is called when translating a name into an url fragment (mainly by relations).
       *
       * By default it uses the `inflector.parameterize` method, in 1.2 this will change and the default
       * behaviour will be to do nothing.
       *
       * @params {string} _name local name
       * @return {string} url fragment
       */
      encodeUrlName: function(_name) {
        $log.warn('Default paremeterization of urls will be disabled in 1.2, override Model.encodeUrlName with inflector.parameterize in your base model to keep the same behaviour.');
        return inflector.parameterize(_name);
      }

    }, ScopeApi);

    ///// Setup record api

    extend(Model.prototype, {

      $type: Model,

      // default initializer: loads the default parameter values
      $initialize: function() {
        var tmp, i, self = this;
        for(i = 0; (tmp = defaults[i]); i++) {
          this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
        }

        for(i = 0; (tmp = computes[i]); i++) {
          Object.defineProperty(self, tmp[0], {
            enumerable: true,
            get: tmp[1],
            set: function() {}
          });
        }
      }

    }, CommonApi, RecordApi, ExtendedApi);

    ///// Setup collection api

    extend(Collection.prototype, {

      $type: Model,

      // provide record contructor
      $new: function(_pk, _scope) {
        return Model.$new(_pk, _scope || this);
      },

      // provide collection constructor
      $collection: function(_params, _scope) {
        _params = this.$params ? angular.extend({}, this.$params, _params) : _params;
        return newCollection(_params, _scope || this.$scope);
      }

    }, ListApi, ScopeApi, CommonApi, CollectionApi, ExtendedApi);

    ///// Setup list api

    extend(List.prototype, {

      $type: Model

    }, ListApi, CommonApi);

    ///// Setup dummy api

    extend(Dummy.prototype, {

      $type: Model,

      $initialize: function() {
        // Nothing by default
      }

    }, CommonApi);

    ///// Setup builder

    var APIS = {
      Model: Model,
      Record: Model.prototype,
      Collection: Collection.prototype,
      List: List.prototype,
      Dummy: Dummy.prototype
    };

    // helper used to extend api's
    function helpDefine(_api, _name, _fun) {
      var api = APIS[_api];

      Utils.assert(!!api, 'Invalid api name $1', _api);

      if(_name) {
        api[_name] = Utils.override(api[_name], _fun);
      } else {
        Utils.extendOverriden(api, _fun);
      }
    }

    // load the builder
    builder = new Builder(angular.extend(serializer.dsl(), {

      /**
       * @memberof BuilderApi#
       *
       * Sets one of the model's configuration properties.
       *
       * The following configuration parameters are available by default:
       * * primaryKey: The model's primary key, defaults to **id**. Keys must use server naming convention!
       * * urlPrefix: Url prefix to prepend to resource url, usefull to use in a base mixin when multiples models have the same prefix.
       * * url: The resource base url, null by default. If not given resource is considered nested.
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
       * @description Sets a computed value for an attribute.
       *
       * Computed values are set only on object construction phase.
       * Computed values are always masked
       *
       * @param {string} _attr Attribute name
       * @param {function} _fn Function that returns value
       * @return {BuilderApi} self
       */
      attrComputed: function(_attr, _fn) {
        computes.push([_attr, _fn]);
        this.attrMask(_attr, true);
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
       * @memberof BuilderApi#
       *
       * @description Adds methods to the model
       *
       * This method allows to extend the different model API's.
       *
       * The following API's can be extended using this method:
       * * Model: The static API, affects the Model object itself.
       * * Record: Affects each record generated by the model.
       * * Collection: Affects each collection generated by the model.
       * * Scope: Affects both the static API and collections.
       * * Resource: Affects records and collections.
       *
       * If no api is given
       *
       *
       * If no scope is given,
       * By default this method extends the **Record** prototype.
       * If called with an object
       * instead of a function it can be used to extend the collection and the type with
       * specific implementations.
       *
       * Usage:
       *
       * ```javascript
       * restmod.mixin(function() {
       *   this.define('myRecordMethod', function() {})
       *       .define('Model.myStaticMethod', function() {})
       *       .define('Collection', { }); // object to extend collection api with
       * });
       * ```
       *
       * It is posible to override an existing method using define, if overriden,
       * the old method can be called using `this.$super` inside de new method.
       *
       * @param {string} _where
       * @param {function} _fun Function to define or object with particular implementations
       * @param {string} _api One of the api names listed above, if not given defaults to 'Record'
       * @return {BuilderApi} self
       */
      define: function(_where, _fun) {

        var name = false, api = 'Record';
        if(typeof _fun === 'object' && _fun) {
          api = _where;
        } else {
          name = _where.split('.');
          if(name.length === 1) {
            name = name[0];
          } else {
            api = name[0];
            name = name[1];
          }
        }

        switch(api) {
        // Virtual API's
        case 'List':
          helpDefine('Collection', name, _fun);
          helpDefine('List', name, _fun);
          break;
        case 'Scope':
          helpDefine('Model', name, _fun);
          helpDefine('Collection', name, _fun);
          break;
        case 'Resource':
          helpDefine('Record', name, _fun);
          helpDefine('Collection', name, _fun);
          helpDefine('List', name, _fun);
          helpDefine('Dummy', name, _fun);
          break;
        default:
          helpDefine(api, name, _fun);
        }

        return this;
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
