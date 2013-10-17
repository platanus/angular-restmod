 /*
  * Model builder interface definition
  *
  * TODO.
  *
  */

angular.module('plRestmod')
  .factory('ModelBuilder', ['$injector', '$parse', '$filter', 'Utils', 'SyncMask', function($injector, $parse, $filter, Utils, SyncMask) {
    'use strict';

    // Preload some angular stuff

    var bind = angular.bind,
        forEach = angular.forEach,
        isFunction = angular.isFunction,
        isObject = angular.isObject;

    // Utility functions

    // chain to filters together
    function chain(_first, _fun) {
      if(!_first) return _fun;
      return function(_value) {
        return _fun.call(this, _first.call(this, _value));
      };
    }

    // override a function, making overriden function available as this.$super
    function override(_super, _fun) {
      if(!_super) return _fun;

      return function() {
        var oldSuper = this.$super;
        try {
          this.$super = _super;
          return _fun.apply(this, arguments);
        } finally {
          this.$super = oldSuper;
        }
      };
    }

    // uses override to merge to override a set of methods
    function extendOverriden(_target, _other) {
      for(var key in _other) {
        if(_other.hasOwnProperty(key)) {
          _target[key] = override(_target[key], _other[key]);
        }
      }
    }

    // resolve a serializer given its name
    function resolveSerializer(_name) {
      return $injector.get(Utils.camelcase(_name) + 'Serializer');
    }

    return function(_modelSpec) {

      // Available mappings.
      var mappings = {
        primary: ['attrPrimary'],
        init: ['attrDefault'],
        ignore: ['attrIgnored'],
        decode: ['attrDecoder', 'param', 'chain'],
        encode: ['attrEncoder', 'param', 'chain'],
        type: ['attrSerializer'],
        hasMany: ['hasMany', 'alias'],
        hasOne: ['hasOne', 'alias']
      };

      return {
        /**
         * Extends the builder DSL
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
         * @return {object} self
         */
        extend: function(_name, _fun, _mapping) {
          if(typeof _name === 'string') {
            this[_name] = override(this[name], _fun);
            if(_mapping) {
              mappings[_mapping[0]] = _mapping;
              _mapping[0] = _name;
            }
          } else extendOverriden(this, _name);
          return this;
        },
        /**
         * Parses a description object, calls the proper builder method depending
         * on each property description type.
         *
         * @param {object} _description The description object
         * @return {object} self
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
         * Sets an attribute properties.
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
         * @return {object} self
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

        /// Attribute behavior

        /**
         * Sets attribute as primary key.
         *
         * Requires to be supported by the model's url builder.
         *
         * @param {string} _attr Attribute name
         * @return {object} self
         */
        attrPrimary: function(_attr, _isPrimary) {
          if(_isPrimary) _modelSpec.urlBuilder.addPrimaryKey(_attr);
          return this;
        },
        /**
         * Sets the default value for an attribute.
         *
         * Defaults values are set only on object construction phase.
         *
         * if `_init` is a function, then its evaluated every time the
         * default value is required.
         *
         * @param {string} _attr Attribute name
         * @param {mixed} _init Defaulf value / iniline function
         * @return {object} self
         */
        attrDefault: function(_attr, _init) {
          // IDEA: maybe fixed defaults could be added to Model prototype...
          _modelSpec.defaults.push([_attr, _init]);
          return this;
        },
        /**
         * Ignores/un-ignores an attribute.
         *
         * This method changes the attribute masmask
         *
         * @param {string} _attr Attribute name
         * @param {boolean|integer} _mask Ignore mask.
         * @param {boolean} _reset If set to true, old mask is reset.
         * @return {[type]} [description]
         */
        attrIgnored: function(_attr, _mask, _reset) {

          if(_mask === true) {
            _modelSpec.mask[_attr] = SyncMask.ALL;
          } else if(_mask === false) {
            delete _modelSpec.mask[_attr];
          } else if(_reset) {
            _modelSpec.mask[_attr] = _mask;
          } else {
            _modelSpec.mask[_attr] |= _mask;
          }

          return this;
        },
        /**
         * Assigns a serializer to a given attribute.
         *
         * A _serializer is:
         * * an object that defines both a `decode` and a `encode` method
         * * a function that when called returns an object that matches the above description.
         * * a string that represents an injectable that matches any of the above descriptions.
         *
         * @param {string} _name Attribute name
         * @param {string|object|function} _serializer The serializer
         * @return {object} self
         */
        attrSerializer: function(_name, _serializer, _opt) {
          if(typeof _serializer === 'string') _serializer = resolveSerializer(_serializer);
          // TODO: if(!_serializer) throw $setupError
          if(isFunction(_serializer)) _serializer = _serializer(_opt);
          if(_serializer.decode) this.attrDecoder(_name, bind(_serializer, _serializer.decode));
          if(_serializer.encode) this.attrEncoder(_name, bind(_serializer, _serializer.encode));
          return this;
        },
        /**
         * Assigns a decoding function/filter to a given attribute.
         *
         * @param {string} _name Attribute name
         * @param {string|function} _filter filter or function to register
         * @param {mixed} _filterParam Misc filter parameter
         * @param {boolean} _chain If true, filter is chained to the current attribute filter.
         * @return {object} self
         */
        attrDecoder: function(_name, _filter, _filterParam, _chain) {
          if(typeof _filter === 'string') {
            var filter = $filter(_filter);
            // TODO: if(!_filter) throw $setupError
            _filter = function(_value) { return filter(_value, _filterParam); };
          }

          _modelSpec.decoders[_name] = _chain ? chain(_modelSpec.decoders[_name], _filter) : _filter;
          return this;
        },
        /**
         * Assigns a encoding function/filter to a given attribute.
         *
         * @param {string} _name Attribute name
         * @param {string|function} _filter filter or function to register
         * @param {mixed} _filterParam Misc filter parameter
         * @param {boolean} _chain If true, filter is chained to the current attribute filter.
         * @return {object} self
         */
        attrEncoder: function(_name, _filter, _filterParam, _chain) {
          if(typeof _filter === 'string') {
            var filter = $filter(_filter);
            // TODO: if(!_filter) throw $setupError
            _filter = function(_value) { return filter(_value, _filterParam); };
          }

          _modelSpec.encoders[_name] = _chain ? chain(_modelSpec.encoders[_name], _filter) : _filter;
          return this;
        },

        /// Relations

        /**
         * Registers a model hasMany relation
         *
         * The `_model` attribute supports both a string (using injector) o
         * a direct restmod Model type reference.
         *
         * @param {string}  _name Attribute name
         * @param {string|object} _model Other model
         * @param {string} _url Partial url
         * @return {object} self
         */
        hasMany: function(_name, _model, _alias) {
          return this.attrDefault(_name, function() {
            if(typeof _model === 'string') _model = $injector.get(_model); // inject type (only the first time...)
            return _model.$collection(null, _alias || Utils.snakecase(_name, '-'), this); // TODO: put snakecase transformation in URLBuilder
          }).attrDecoder(_name, function(_raw) {
            this[_name].$feed(_raw);
          });
        },
        /**
         * Registers a model hasOne relation
         *
         * The `_model` attribute supports both a string (using injector) o
         * a direct restmod Model type reference.
         *
         * @param {string}  _name Attribute name
         * @param {string|object} _model Other model
         * @param {string} _url Partial url
         * @return {object} self
         */
        hasOne: function(_name, _model, _partial) {
          return this.attrDefault(_name, function() {
            if(typeof _model === 'string') _model = $injector.get(_model); // inject type (only the first time...)
            return new _model(null, _partial || Utils.snakecase(_name, '-'), this); // TODO: put snakecase transformation in URLBuilder
          }).attrDecoder(_name, function(_raw) {
            this[_name].$decode(_raw);
          });
        },

        /// Prototype extensions.

        /**
         * Registers an instance method
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
         * @param {function} _fun
         * @return {object} self
         */
        define: function(_name, _fun) {
          if(typeof _name === 'string') {
            _modelSpec.objectProto[_name] = override(_modelSpec.objectProto[_name], _fun);
          } else {
            extendOverriden(_modelSpec.objectProto, _name);
          }
          return this;
        },
        /**
         * Registers a class method
         *
         * It is posible to override an existing method using define,
         * if overriden, the old method can be called using `this.$super`
         * inside de new method.
         *
         * @param {string} _name Method name
         * @param {function} _fun
         * @return {object} self
         */
        classDefine: function(_name, _fun) {
          if(typeof _name === 'string') {
            _modelSpec.classProto[_name] = override(_modelSpec.classProto[_name], _fun);
          } else {
            extendOverriden(_modelSpec.classProto, _name);
          }
          return this;
        },
        /**
         * Adds an event hook
         *
         * Hooks are used to extend or modify the model behavior, and are not
         * designed to be used as an event listening system.
         *
         * The given function is executed in the hook's context, different hooks
         * make different parameters available to callbacks.
         *
         * @param {string} _hook The hook name, refer to restmod docs for builtin hooks.
         * @param {function} _do function to be executed
         * @return {object} self
         */
        on: function(_hook, _do) {
          var cbs = _modelSpec.callbacks[_hook];
          if(!cbs) cbs = _modelSpec.callbacks[_hook] = [];
          cbs.push(_do);
          return this;
        },

        beforeSave: function(_do) { return this.on('before_save', _do); },
        beforeCreate: function(_do) { return this.on('before_create', _do); },
        afterCreate: function(_do) { return this.on('after_create', _do); },
        beforeUpdate: function(_do) { return this.on('before_update', _do); },
        afterUpdate: function(_do) { return this.on('after_update', _do); },
        afterSave: function(_do) { return this.on('after_save', _do); },
        beforeDestroy: function(_do) { return this.on('before_destroy', _do); },
        afterDestroy: function(_do) { return this.on('after_destroy', _do); },
        afterFeed: function(_do) { return this.on('after_feed', _do); },
        beforeRender: function(_do) { return this.on('before_render', _do); },

        /// Experimental modifiers

        /**
         * Volatile attributes are reset after being rendered.
         *
         * @param {string}  _name Attribute name
         * @param  {[type]} _isVolatile Default/Reset value
         * @return {object} self
         */
        attrVolatile: function(_attr, _init) {
          return this.attrDefault(_attr, _init).attrEncoder(_attr, function(_value) {
            // Not sure about modifying object during encoding
            this[_attr] = isFunction(_init) ? _init.call(this) : _init;
            return _value;
          }, null, true);
        },
        /**
         * Expression attributes are evaluated every time new data is fed to the model.
         *
         * @param {string}  _name Attribute name
         * @param {string} _expr Angular expression to evaluate
         * @return {object} self
         */
        attrExpression: function(_name, _expr) {
          var filter = $parse(_expr);
          this.on('after_feed', function() {
            this[_name] = filter(this);
          });
        }
      };
    };
  }]);
