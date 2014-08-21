'use strict';

RMModule.factory('RMModelFactory', ['$injector', '$inflector', 'RMUtils', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMCollectionApi', function($injector, $inflector, Utils, ScopeApi, CommonApi, RecordApi, CollectionApi) {

  return function(
    _internal,      // internal properties as an object
    _defaults,      // attribute defaults as an array of [key, value]
    _serializer,    // serializer instance
    _packer,        // packer factory
    _meta           // atribute metadata
  ) {

    // cache some stuff:
    var urlPrefix = _internal.urlPrefix,
        baseUrl = _internal.baseUrl,
        primaryKey = _internal.primaryKey;

    var extend = angular.extend;

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
       * * primaryKey
       * * baseUrl
       * * urlPrefix
       *
       * @param  {string} _key Property name
       * @return {mixed} value
       */
      $getProperty: function(_key) {
        return _internal[_key];
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
       * @description Returns the model name.
       *
       * Returns the name given The name can be given when  is infered from the base url or
       *
       * @return {string} The base url.
       */
      $name: function() {
        return _internal.name;
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
      $$pack: function(_raw) {
        if(_packer) {
          var packerInstance = (typeof _packer === 'function') ? _packer(Model) : _packer;
          _raw = packerInstance.pack(_raw, this);
        }
        return _raw;
      },

      // packer unpack adaptor used by $unwrap
      $$unpack: function(_raw) {
        if(_packer) {
          var packerInstance = (typeof _packer === 'function') ? _packer(Model) : _packer;
          _raw = packerInstance.unpack(_raw, this);
        }
        return _raw;
      },

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

      // provide unpack function
      $$unpack: function(_raw) {
        if(_packer) {
          var packerInstance = (typeof _packer === 'function') ? _packer(Model) : _packer;
          _raw = packerInstance.unpackMany(_raw, this);
        }
        return _raw;
      },
    }, CollectionApi, ScopeApi, CommonApi);

    // expose collection prototype.
    Model.collectionPrototype = Collection.prototype;

    return Model;
  };

}]);
