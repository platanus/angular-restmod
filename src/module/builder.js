'use strict';

RMModule.factory('RMBuilder', ['$injector', 'inflector', '$log', 'RMUtils', function($injector, inflector, $log, Utils) {

  // TODO: add urlPrefix option

  var forEach = angular.forEach,
      isObject = angular.isObject,
      isArray = angular.isArray,
      isFunction = angular.isFunction,
      extend = angular.extend,
      VAR_RGX = /^[A-Z]+[A-Z_0-9]*$/;

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
   *   $config: {
   *     name: 'resource',
   *     primaryKey: '_id'
   *   },
   *
   *   // ATTRIBUTE MODIFIERS AND RELATIONS
   *
   *   propWithDefault: { init: 20 },
   *   propWithDecoder: { decode: 'date', chain: true },
   *   hasManyRelation: { hasMany: 'Other' },
   *   hasOneRelation: { hasOne: 'Other' },
   *
   *   // HOOKS
   *
   *   $hooks: {
   *     'after-create': function() {
   *     }
   *   },
   *
   *   // METHODS
   *
   *   $extend: {
   *     Record: {
   *       instanceMethod: function() {
   *       }
   *     },
   *     Model: {
   *       scopeMethod: function() {
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * Special model configuration variables can be set by using a `$config` block:
   *
   * ```javascript
   * restmod.model({
   *
   *   $config: {
   *     name: 'resource',
   *     primaryKey: '_id'
   *   }
   *
   *  });
   * ```
   *
   * With the exception of model configuration variables and properties starting with a special character (**@** or **~**),
   * each property in the definition object asigns a behavior to the same named property in a model's record.
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
   * * `volatile` sets the attribute volatility, maps to {@link BuilderApi#attrVolatile}
   *
   * **For relations modifiers take a look at {@link RelationBuilderApi}**
   *
   * **For other extended bundled methods check out the {@link ExtendedBuilderApi}**
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
   * To add/override methods from the record api, use the `$extend` block:
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   $extend: {
   *     sayHello: function() { alert('hello!'); }
   *   }
   * })
   *
   * // then say hello is available for use at model records
   * Model.$new().sayHello();
   * ```
   *
   * To add a static method or a collection method, you must specify the method scope: , prefix the definition key with **^**, to add it to the model collection prototype,
   * prefix it with ***** static/collection methods to the Model, prefix the definition property name with **@**
   * (same as calling {@link BuilderApi#scopeDefine} at a definition function).
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   $extend: {
   *     'Collection.count': function() { return this.length; },  // scope is set using a prefix
   *
   *     Model: {
   *       sayHello: function() { alert('hello!'); } // scope is set using a block
   *     }
   * })
   *
   * // then the following call will be valid.
   * Model.sayHello();
   * Model.$collection().count();
   * ```
   *
   * More information about method scopes can be found in {@link BuilderApi#define}
   *
   * To add hooks to the Model lifecycle events use the `$hooks` block:
   *
   * ```javascript
   * var Model = restmod.model('/', {
   *   $hooks: {
   *     'after-init': function() { alert('hello!'); }
   *   }
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
  function Builder(_baseDsl) {

    var mappings = [
      { fun: 'attrDefault', sign: ['init'] },
      { fun: 'attrMask', sign: ['ignore'] },
      { fun: 'attrMask', sign: ['mask'] },
      { fun: 'attrMap', sign: ['map', 'force'] },
      { fun: 'attrDecoder', sign: ['decode', 'param', 'chain'] },
      { fun: 'attrEncoder', sign: ['encode', 'param', 'chain'] },
      { fun: 'attrVolatile', sign: ['volatile'] }
    ];

    // DSL core functions.

    this.dsl = extend(_baseDsl, {

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
            $log.warn('Usage of @ in description objects will be removed in 1.2, use a $extend block instead');
            this.define('Scope.' + _attr.substring(1), _desc); // set static method
            break;
          case '~':
            _attr = inflector.parameterize(_attr.substring(1));
            $log.warn('Usage of ~ in description objects will be removed in 1.2, use a $hooks block instead');
            this.on(_attr, _desc);
            break;
          default:
            if(_attr === '$config') { // configuration block
              for(var key in _desc) {
                if(_desc.hasOwnProperty(key)) this.setProperty(key, _desc[key]);
              }
            } else if(_attr === '$extend') { // extension block
              for(var key in _desc) {
                if(_desc.hasOwnProperty(key)) this.define(key, _desc[key]);
              }
            } else if(_attr === '$hooks') { // hooks block
              for(var key in _desc) {
                if(_desc.hasOwnProperty(key)) this.on(key, _desc[key]);
              }
            } else if(VAR_RGX.test(_attr)) {
              $log.warn('Usage of ~ in description objects will be removed in 1.2, use a $config block instead');
              _attr = inflector.camelize(_attr.toLowerCase());
              this.setProperty(_attr, _desc);
            }
            else if(isObject(_desc)) this.attribute(_attr, _desc);
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
          if(_mapping) mappings.push({ fun: _name, sign: _mapping });
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
        var i = 0, map;
        while((map = mappings[i++])) {
          if(_description.hasOwnProperty(map.sign[0])) {
            var args = [_name];
            for(var j = 0; j < map.sign.length; j++) {
              args.push(_description[map.sign[j]]);
            }
            args.push(_description);
            this[map.fun].apply(this, args);
          }
        }
        return this;
      }
    });
  }

  Builder.prototype = {

    // use the builder to process a mixin chain
    chain: function(_chain) {
      for(var i = 0, l = _chain.length; i < l; i++) {
        this.mixin(_chain[i]);
      }
    },

    // use the builder to process a single mixin
    mixin: function(_mix) {
      if(_mix.$$chain) {
        this.chain(_mix.$$chain);
      } else if(typeof _mix === 'string') {
        this.mixin($injector.get(_mix));
      } else if(isArray(_mix)) {
        this.chain(_mix);
      } else if(isFunction(_mix)) {
        _mix.call(this.dsl, $injector);
      } else {
        this.dsl.describe(_mix);
      }
    }
  };

  return Builder;

}]);