'use strict';

RMModule.factory('RMModelFactory', ['$injector', 'inflector', 'RMUtils', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMCollectionApi', function($injector, inflector, Utils, ScopeApi, CommonApi, RecordApi, CollectionApi) {

  var NAME_RGX = /(.*?)([^\/]+)\/?$/,
      extend = angular.extend;

  return function(
    _internal,      // internal properties as an object
    _defaults,      // attribute defaults as an array of [key, value]
    _serializer,    // serializer instance
    _meta           // atribute metadata
  ) {

    // cache some stuff:
    var urlPrefix = _internal.urlPrefix,
        baseUrl = Utils.cleanUrl(_internal.url),
        primaryKey = _internal.primaryKey,
        packer = _internal.packer;

    // make sure the resource name and plural name are available if posible:

    if(!_internal.name && baseUrl) {
      _internal.name = inflector.singularize(baseUrl.replace(NAME_RGX, '$2'));
    }

    if(!_internal.plural && _internal.name) {
      _internal.plural = inflector.pluralize(_internal.name);
    }

    // load packer if refereced as string

    if(typeof packer === 'string') {
      packer = $injector.get(inflector.camelize(packer, true) + 'Packer');
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
      col.$isCollection = true;
      col.$type = Model;
      col.$scope = _scope;
      col.$params = _params;
      col.$resolved = false;
      // this.$initialize();
      return col;
    }

    // packer adaptor generator
    function adaptPacker(_fun) {
      return function(_raw) {
        if(packer) {
          var packerInstance = (typeof packer === 'function') ? packer(Model) : packer;
          _raw = packerInstance[_fun](_raw, this);
        }
        return _raw;
      };
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

      // extracts the primary key from a raw data record
      $$inferKey: function(_rawData) {
        if(!_rawData || typeof _rawData[primaryKey] === 'undefined') return null;
        return _rawData[primaryKey];
      },

      // creates a new model bound by default to the static scope
      $$new: function(_pk, _scope) {
        return new Model(_scope || Model, _pk);
      },

      // creates a new collection bound by default to the static scope
      $$collection: function(_params, _scope) {
        return newCollection(_scope || Model, _params);
      },

      // gets an attribute description (metadata)
      $$getDescription: function(_attribute) {
        return _meta[_attribute];
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
        var val = _internal[_key];
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
        return !baseUrl;
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
            return urlPrefix ? Utils.joinUrl(urlPrefix, _url) : _url;
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
        return urlPrefix ? Utils.joinUrl(urlPrefix, baseUrl) : baseUrl;
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
        return _plural ? _internal.plural : _internal.name;
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
    }, ScopeApi, CommonApi);

    ///// Setup record api

    extend(Model.prototype, {

      // provide key inferenc
      $$inferKey: Model.$$inferKey,

      // loads the default parameter values
      $$loadDefaults: function() {
        var tmp;
        for(var i = 0; (tmp = _defaults[i]); i++) {
          this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
        }
      },

      // packer pack adaptor used by $wrap
      $$pack: adaptPacker('pack'),

      // packer unpack adaptor used by $unwrap
      $$unpack: adaptPacker('unpack'),

      // serializer decode adaptor used by $decode
      $$decode: function(_raw, _mask) {
        return _serializer.decode(this, _raw, _mask);
      },

      // serializer encode adaptor used by $encode
      $$encode: function(_mask) {
        return _serializer.encode(this, _mask);
      }
    }, RecordApi, CommonApi);

    ///// Setup collection api

    extend(Collection.prototype, {

      // provide key inference
      $$inferKey: Model.$$inferKey,

      // provide record contructor
      $$new: function(_pk, _scope) {
        return new Model(_scope || this, _pk);
      },

      // provide collection constructor
      $$collection: function(_params, _scope) {
        _params = this.$params ? extend({}, this.$params, _params) : _params;
        return newCollection(_scope || this.$scope, _params);
      },

      // packer pack adaptor used by $wrap
      $$pack: adaptPacker('packMany'),

      // packer unpack adaptor used by $unwrap
      $$unpack: adaptPacker('unpackMany')

    }, CollectionApi, ScopeApi, CommonApi);

    // expose collection prototype.
    Model.collectionPrototype = Collection.prototype;

    return Model;
  };

}]);
