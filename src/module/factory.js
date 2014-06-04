'use strict';

RMModule.factory('RMModelFactory', ['$injector', '$inflector', '$filter', 'RMUtils', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMCollectionApi', function($injector, $inflector, $filter, Utils, ScopeApi, CommonApi, RecordApi, CollectionApi) {

  return function(_identity) {

    var extend = angular.extend,
        isArray = angular.isArray;

    // Private model attributes
    var urlPrefix = null,
        baseUrl = null,
        name = null,
        primaryKey = 'id',
        packer = null,
        masks = {},
        defaults = [],
        decoders = {},
        encoders = {},
        nameDecoder = $inflector.camelize,
        nameEncoder = function(_v) { return $inflector.parameterize(_v, '_'); };

    // setup model identity
    if(_identity)
    {
      if(typeof _identity === 'string') {
        baseUrl = _identity;
      } else {
        baseUrl = _identity.url;
        name = _identity.name;
      }

      // infer name from url.
      if(!name && baseUrl) {
        name = baseUrl.replace(/(.*?)([^\/]+$)/, '$2'); // TODO: make sure name is singular -> $inflector.singularize(this.$$name)
      }
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

    ///// Setup static api

    /**
     * @class StaticApi
     * @extends ScopeApi
     * @extends CommonApi
     *
     * @description
     *
     * The $restmod type API, every generated $restmod model type exposes this API.
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

      // sets the model url prefix
      $$setUrlPrefix: function(_prefix) {
        urlPrefix = _prefix;
      },

      // sets the model primary key
      $$setPrimaryKey: function(_key) {
        primaryKey = _key;
      },

      // sets the model name decoder
      $$setNameDecoder: function(_fun) {
        nameDecoder = _fun;
      },

      // sets the model name encoder
      $$setNameEncoder: function(_fun) {
        nameEncoder = _fun;
      },

      // sets the model packer
      $$setPacker: function(_packer) {
        if(typeof _packer === 'string') {
          _packer = $injector.get($inflector.camelize(_packer, true) + 'Packer');
        }

        if(typeof _packer === 'function') {
          _packer = new _packer(Model);
        }

        packer = _packer;
      },

      // sets an attrinute default value
      $$setDefault: function(_attr, _default) {
        defaults.push([_attr, _default]);
      },

      // sets an attrinute mask
      $$setMask: function(_attr, _mask) {
        if(!_mask) {
          delete masks[_attr];
        } else {
          masks[_attr] = _mask === true ? Utils.FULL_MASK : _mask;
        }
      },

      // sets an attrinute decoder
      $$setDecoder: function(_attr, _filter, _filterParam, _chain) {

        if(typeof _filter === 'string') {
          var filter = $filter(_filter);
          // TODO: if(!_filter) throw $setupError
          _filter = function(_value) { return filter(_value, _filterParam); };
        }

        decoders[_attr] = _chain ? Utils.chain(decoders[_attr], _filter) : _filter;
      },

      // sets an attribute encoder
      $$setEncoder: function(_attr, _filter, _filterParam, _chain) {

        if(typeof _filter === 'string') {
          var filter = $filter(_filter);
          // TODO: if(!_filter) throw $setupError
          _filter = function(_value) { return filter(_value, _filterParam); };
        }

        encoders[_attr] = _chain ? Utils.chain(encoders[_attr], _filter) : _filter;
      },

      // registers a new scope method (available at type and collection)
      $$addScopeMethod: function(_name, _fun) {
        if(typeof _name === 'string') {
          Collection.prototype[_name] = Utils.override(Collection.prototype[_name], _fun);
          Model[_name] = Utils.override(Model[_name], _fun);
        } else {
          Utils.extendOverriden(Collection.prototype, _name);
          Utils.extendOverriden(Model, _name);
        }
      },

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

      /**
       * @memberof StaticApi#
       *
       * @description
       *
       * Gets the model primary key
       *
       * @return {mixed} model primary key
       */
      $getPrimaryKey: function() {
        return primaryKey;
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
       * module('BikeShop', []).factory('Status', function($restmod) {
       *   return $restmod.model(null).$single('/api/status');
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
        return name;
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
        for(var i = 0; (tmp = defaults[i]); i++) {
          this[tmp[0]] = (typeof tmp[1] === 'function') ? tmp[1].apply(this) : tmp[1];
        }
      },

      // pack adaptor used by $wrap
      $$pack: function(_raw) {
        if(packer) {
          _raw = packer.pack(_raw, this);
        }
        return _raw;
      },

      // unpack adaptor used by $unwrap
      $$unpack: function(_raw) {
        if(packer) {
          _raw = packer.unpack(_raw, this);
        }
        return _raw;
      },

      // base transformation method used by $decode/$encode
      $$transform: function (_data, _prefix, _mask, _decode, _into) {

        var key, decodedName, encodedName, fullName, mask, filter, value, result = _into || {};

        for(key in _data) {
          if(_data.hasOwnProperty(key) && key[0] !== '$') {

            decodedName = (_decode && nameDecoder) ? nameDecoder(key) : key;
            fullName = _prefix + decodedName;

            // skip property if masked for this operation
            mask = masks[fullName];
            if(mask && mask.indexOf(_mask) !== -1) {
              continue;
            }

            value = _data[key];
            filter = _decode ? decoders[fullName] : encoders[fullName];

            if(filter) {
              value = filter.call(this, value);
              if(value === undefined) continue; // ignore value if filter returns undefined
            } else if(typeof value === 'object' && value &&
              (_decode || typeof value.toJSON !== 'function')) {
              // IDEA: make extended decoding/encoding optional, could be a little taxing for some apps
              value = transformExtended.call(this, value, fullName, _mask, _decode);
            }

            encodedName = (!_decode && nameEncoder) ? nameEncoder(decodedName) : decodedName;
            result[encodedName] = value;
          }
        }

        return result;
      }
    }, RecordApi, CommonApi);

    // extended part of $$transform function, enables deep object transform.
    var transformExtended = function(_data, _prefix, _mask, _decode) {
      if(isArray(_data))
      {
        var fullName = _prefix + '[]',
            filter = _decode ? decoders[fullName] : encoders[fullName],
            result = [], i, l, value;

        for(i = 0, l = _data.length; i < l; i++) {
          value = _data[i];
          if(filter) {
            value = filter.call(this, value);
          } else if(typeof value === 'object' && value &&
            (_decode || typeof value.toJSON !== 'function')) {
            value = transformExtended.call(this, value, _prefix, _mask, _decode);
          }
          result.push(value);
        }

        return result;
      } else {
        return this.$$transform(_data, _prefix + '.', _mask, _decode);
      }
    };

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
        if(packer) {
          _raw = packer.unpackMany(_raw, this);
        }
        return _raw;
      },
    }, CollectionApi, ScopeApi, CommonApi);

    return Model;
  };

}]);
