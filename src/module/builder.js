'use strict';

RMModule.factory('RMBuilder', ['$injector', '$inflector', 'RMUtils', 'RMSerializerFactory', 'RMModelFactory', 'RMBuilderExt', function($injector, $inflector, Utils, buildSerializer, buildModel, builderExt) {

  // TODO: add urlPrefix option

  var forEach = angular.forEach,
      isObject = angular.isObject,
      isArray = angular.isArray,
      isFunction = angular.isFunction,
      extend = angular.extend;

  /**
   * @class BuilderApi
   *
   * @description
   *
   * Provides the DSL for model generation, it supports to modes of model definitions:
   *
   * ## Definition object
   *
   * This is the preferred way of describing a model behavior.
   *
   * A model description object looks like this:
   *
   * ```javascript
   * restmod.model({
   *
   *   // MODEL CONFIGURATION
   *
   *   '!baseUrl': 'resource',
   *   '!name': 'resource'
   *   '!primaryKey': '_id',
   *
   *   // ATTRIBUTE MODIFIERS
   *
   *   propWithDefault: { init: 20 },
   *   propWithDecoder: { decode: 'date', chain: true },
   *
   *   // RELATIONS
   *
   *   hasManyRelation: { hasMany: 'Other' },
   *   hasOneRelation: { hasOne: 'Other' }
   *
   *   // METHODS
   *
   *   instanceMethod: function() {
   *   },
   *
   *   '@classMethod': function() {
   *   },
   *
   *   // HOOKS
   *
   *   '~afterCreate': function() {
   *   }
   * });
   * ```
   *
   * Special model configuration variables can be set using the name prefixed with the **!** character.
   * See the {@link BuilderApi#attrAsReferenceToMany} documentation for more information.
   *
   * With the exception of properties starting with a special character (**!**, **@** or **~**),
   * each property in the definition object asigns a behavior to the same named property
   * in a model's record.
   *
   * To modify a property behavior assign an object with the desired modifiers to a
   * definition property with the same name. Builtin modifiers are:
   *
   * The following built in property modifiers are provided (see each mapped-method docs for usage information):
   *
   * * `init` sets an attribute default value, see {@link BuilderApi#attrDefault}
   * * `mask` and `ignore` sets an attribute mask, see {@link BuilderApi#attrMask}
   * * `map` sets an explicit server attribute mapping, see {@link BuilderApi#attrMap}
   * * `decode` sets how an attribute is decoded after being fetch, maps to {@link BuilderApi#attrDecoder}
   * * `encode` sets how an attribute is encoded before being sent, maps to {@link BuilderApi#attrEncoder}
   * * `serialize` sets the encoder and decoder beaviour for an attribute, maps to {@link BuilderApi#attrSerializer}
   * * `hasMany` sets a one to many hierarchical relation under the attribute name, maps to {@link BuilderApi#attrAsCollection}
   * * `hasOne` sets a one to one hierarchical relation under the attribute name, maps to {@link BuilderApi#attrAsResource}
   * * `belongsTo` sets a one to one reference relation under the attribute name, maps to {@link BuilderApi#attrAsReference}
   * * `belongsToMany` sets a one to many reference relation under the attribute name, maps to {@link BuilderApi#attrAsReferenceToMany}
   *
   * To add/override methods from the record api, a function can be passed to one of the
   * description properties:
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   sayHello: function() { alert('hello!'); }
   * })
   *
   * // then say hello is available for use at model records
   * Model.$new().sayHello();
   * ```
   *
   * If other kind of value (different from object or function) is passed to a definition property,
   * then it is considered to be a default value. (same as calling {@link BuilderApi#define} at a definition function)
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   im20: 20 // same as { init: 20 }
   * })
   *
   * // then say hello is available for use at model records
   * Model.$new().im20; // 20
   * ```
   *
   * To add static/collection methods to the Model, prefix the definition property name with **@**
   * (same as calling {@link BuilderApi#classDefine} at a definition function).
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   '@sayHello': function() { alert('hello!'); }
   * })
   *
   * // then say hello is available for use at model type and collection.
   * Model.sayHello();
   * Model.$collection().sayHello();
   * ```
   *
   * To add hooks to the Model lifecycle events, prefix the definition property name with **~** and make sure the
   * property name matches the event name (same as calling {@link BuilderApi#on} at a definition function).
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   '~afterInit': function() { alert('hello!'); }
   * })
   *
   * // the after-init hook is called after every record initialization.
   * Model.$new(); // alerts 'hello!';
   * ```
   *
   * ## Definition function
   *
   * The definition function gives complete access to the model builder api, every model builder function described
   * in this page can be called from the definition function by referencing *this*.
   *
   * ```javascript
   * restmod.model('', function() {
   *   this.attrDefault('propWithDefault', 20)
   *       .attrAsCollection('hasManyRelation', 'ModelName')
   *       .on('after-create', function() {
   *         // do something after create.
   *       });
   * });
   * ```
   *
   */
  function Builder() {

    var vars = {
        primaryKey: 'id',
        baseUrl: null,
        urlPrefix: null
      },
      defaults = [],
      serializer = buildSerializer(),
      packer = null,
      deferred = [],
      meta = {},
      mappings = {
        init: ['attrDefault'],
        mask: ['attrMask'],
        ignore: ['attrMask'],
        map: ['attrMap', 'force'],
        decode: ['attrDecoder', 'param', 'chain'],
        encode: ['attrEncoder', 'param', 'chain'],
        serialize: ['attrSerializer'],
        hasMany: ['attrAsCollection', 'path', 'source', 'inverseOf'], // TODO: rename source to map, but disable attrMap if map is used here...
        hasOne: ['attrAsResource', 'path', 'source', 'inverseOf'],
        belongsTo: ['attrAsReference', 'key', 'prefetch'],
        belongsToMany: ['attrAsReferenceToMany', 'keys']
      };

    // DSL core functions.

    this.dsl = extend({

      /**
       * @memberof BuilderApi#
       *
       * @description Parses a description object, calls the proper builder method depending
       * on each property description type.
       *
       * @param {object} _description The description object
       * @return {BuilderApi} self
       */
      describe: function(_description) {
        forEach(_description, function(_desc, _attr) {
          switch(_attr.charAt(0)) {
          case '@':
            this.classDefine(_attr.substring(1), _desc);
            break;
          case '~':
            _attr = $inflector.parameterize(_attr.substring(1));
            this.on(_attr, _desc);
            break;
          case '=':
            this.setProperty(_attr.substring(2), _description);
            break;
          default:
            if(isObject(_desc)) this.attribute(_attr, _desc);
            else if(isFunction(_desc)) this.define(_attr, _desc);
            else this.attrDefault(_attr, _desc);
          }
        }, this);
        return this;
      },

      /**
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
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
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
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
       * @memberof BuilderApi#
       *
       * @description Adds a function to be applied to model after being created.
       *
       * Funtion is called with model as the first argument.
       *
       * @param {function} _fun Function to be called
       * @return {BuilderApi} self
       */
      defer: function(_fun) {
        deferred.push(_fun);
        return this;
      },

      /**
       * @memberof BuilderApi#
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
       * var packer = packerFactory(Model);
       * ```
       *
       * ### Packer structure.
       *
       * Custom packers must implement the following methods:
       *
       * * **unpack(_rawData, _record):** unwraps data belonging to a single record, must return the unpacked
       * data to be passed to `$decode`.
       * * **unpackMany(_rawData, _collection):** unwraps the data belonging to a collection of records,
       * must return the unpacked data array, each array element will be passed to $decode on each new element.
       * * **pack(_rawData, _record):** wraps the encoded data from a record before is sent to the server,
       * must return the packed data object to be sent.
       *
       * Currently the following builtin strategies are provided:
       * TODO: provide builtin strategies!
       *
       * @param {string|object} _mode The packer instance, constructor or name
       * @return {BuilderApi} self
       */
      setPacker: function(_packer) {
        if(typeof _packer === 'string') {
          _packer = $injector.get($inflector.camelize(_packer, true) + 'Packer');
        }

        packer = _packer;
        return this;
      },

      /**
       * @memberof BuilderApi#
       *
       * Sets one of the model's configuration properties.
       *
       * The following configuration parameters are available by default:
       * * primaryKey: The model's primary key, defaults to **id**. Keys must use server naming convention!
       * * urlPrefix: Url prefix to prepend to resource url, usefull to use in a base mixin when multiples models have the same prefix.
       * * baseUrl: The resource base url, null by default. If not given resource is considered anonymous.
       *
       * @param {string} _key The configuration key to set.
       * @param {mixed} _value The configuration value.
       * @return {BuilderApi} self
       */
      setProperty: function(_key, _value) {
        vars[_key] = _value;
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
       * @param {object} _meta Attribute metadata
       * @return {BuilderApi} self
       */
      attrMeta: function(_name, _metadata) {
        meta[_name] = extend(meta[_name] || {}, _metadata);
        return this;
      },

      // serializer forwards:

      /**
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
       */
      setNameDecoder: serializer.setNameDecoder,

      /**
       * @memberof BuilderApi#
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
       * @return {BuilderApi} self
       */
      setNameEncoder: serializer.setNameEncoder,

      /**
       * @memberof BuilderApi#
       *
       * @description Sets an attribute mask.
       *
       * An attribute mask prevents the attribute to be loaded from or sent to the server on certain operations.
       *
       * The attribute mask is a string composed by:
       * * C: To prevent attribute from being sent on create
       * * R: To prevent attribute from being loaded from server
       * * U: To prevent attribute from being sent on update
       *
       * For example, the following will prevent an attribute to be send on create or update:
       *
       * ```javascript
       * builder.attrMask('readOnly', 'CU');
       * ```
       *
       * If a true boolean value is passed as mask, then 'CRU' will be used
       * If a false boolean valus is passed as mask, then mask will be removed
       *
       * @param {string} _attr Attribute name
       * @param {boolean|string} _mask Attribute mask
       * @return {BuilderApi} self
       */
      attrMask: serializer.setMask,

      /**
       * @memberof BuilderApi#
       *
       * @description Sets an attribute mapping.
       *
       * Allows a explicit server to model property mapping to be defined.
       *
       * For example, to map the response property `stats.created_at` to model's `created` property.
       *
       * ```javascript
       * builder.attrMap('created', 'stats.created_at');
       * ```
       *
       * It's also posible to use a wildcard '*' as server name to use the default name decoder as
       * server name. This is used to force a property to be processed on decode/encode even if its
       * not present on request/record (respectively), by doing this its posible, for example, to define
       * a dynamic property that is generated automatically before the object is send to the server.
       *
       * @param {string} _attr Attribute name
       * @param {string} _serverName Server (request/response) property name
       * @return {BuilderApi} self
       */
      attrMap: serializer.setMapping,

      /**
       * @memberof BuilderApi#
       *
       * @description Assigns a decoding function/filter to a given attribute.
       *
       * @param {string} _name Attribute name
       * @param {string|function} _filter filter or function to register
       * @param {mixed} _filterParam Misc filter parameter
       * @param {boolean} _chain If true, filter is chained to the current attribute filter.
       * @return {BuilderApi} self
       */
      attrDecoder: serializer.setDecoder,

      /**
       * @memberof BuilderApi#
       *
       * @description Assigns a encoding function/filter to a given attribute.
       *
       * @param {string} _name Attribute name
       * @param {string|function} _filter filter or function to register
       * @param {mixed} _filterParam Misc filter parameter
       * @param {boolean} _chain If true, filter is chained to the current attribute filter.
       * @return {BuilderApi} self
       */
      attrEncoder: serializer.setEncoder

    }, builderExt);

    // Generate factory function
    this.buildModel = function() {
      var model = buildModel(vars, defaults, serializer, packer, meta);
      forEach(deferred, function(_fun) { _fun(model); });
      return model;
    };
  }

  Builder.prototype = {
    // use the builder to process a mixin chain
    loadMixinChain: function(_chain) {
      for(var i = 0, l = _chain.length; i < l; i++) {
        this.loadMixin(_chain[i]);
      }
    },

    // use the builder to process a single mixin
    loadMixin: function(_mix) {
      if(_mix.$chain) {
        this.loadMixinChain(_mix.$chain);
      } else if(typeof _mix === 'string') {
        this.loadMixin($injector.get(_mix));
      } else if(isArray(_mix) || isFunction(_mix)) {
        // TODO: maybe invoke should only be called for BASE_CHAIN functions
        $injector.invoke(_mix, this.dsl, { $builder: this.dsl });
      } else this.dsl.describe(_mix);
    }
  };

  return Builder;

}]);