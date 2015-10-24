'use strict';

RMModule.factory('RMSerializer', ['$injector', 'inflector', '$filter', 'RMUtils', function($injector, inflector, $filter, Utils) {

  function extract(_from, _path) {
    if(_from === null && _path.length > 1) return undefined;

    var node;
    for(var i = 0; _from && (node = _path[i]); i++) {
      _from = _from[node];
    }
    return _from;
  }

  function insert(_into, _path, _value) {
    for(var i = 0, l = _path.length-1; i < l; i++) {
      var node = _path[i];
      _into = _into[node] || (_into[node] = {});
    }
    _into[_path[_path.length-1]] = _value;
  }

  return function(_strategies) {

    var isArray = angular.isArray;

    // Private serializer attributes
    var masks = {},
        decoders = {},
        encoders = {},
        mapped = {},
        mappings = {},
        vol = {};

    function isMasked(_name, _mask, _ctx) {
      if(typeof _mask === 'function') return _mask(_name);
      var mask = masks[_name];
      if(typeof mask === 'function') mask = mask.call(_ctx); // dynamic mask
      return (mask && (mask === true || mask.indexOf(_mask) !== -1));
    }

    function decode(_from, _to, _prefix, _mask, _ctx) {
      var key, decodedName, fullName, value, maps, isMapped, i, l,
          prefix = _prefix ? _prefix + '.' : '';

      // explicit mappings
      maps = mappings[_prefix];
      if(maps) {
        for(i = 0, l = maps.length; i < l; i++) {
          fullName = prefix + maps[i].path;
          if(isMasked(fullName, _mask, _ctx)) continue;

          if(maps[i].map) {
            value = extract(_from, maps[i].map);
          } else {
            value = _from[_strategies.encodeName ? _strategies.encodeName(maps[i].path) : maps[i].path];
          }

          if(!maps[i].forced && value === undefined) continue;

          value = decodeProp(value, fullName, _mask, _ctx);
          if(value !== undefined) _to[maps[i].path] = value;
        }
      }

      // implicit mappings
      for(key in _from) {
        if(_from.hasOwnProperty(key)) {

          decodedName = _strategies.decodeName ? _strategies.decodeName(key) : key;
          if(decodedName[0] === '$') continue;

          if(maps) {
            // ignore already mapped keys
            // TODO: ignore nested mappings too.
            for(
              // is this so much faster than using .some? http://jsperf.com/some-vs-for-loop
              isMapped = false, i = 0, l = maps.length;
              i < l && !(isMapped = (maps[i].mapPath === key));
              i++
            );
            if(isMapped) continue;
          }

          fullName = prefix + decodedName;
          // prevent masked or already mapped properties to be set
          if(mapped[fullName] || isMasked(fullName, _mask, _ctx)) continue;

          value = decodeProp(_from[key], fullName, _mask, _ctx);
          if(value !== undefined) _to[decodedName] = value; // ignore value if filter returns undefined
        }
      }
    }

    function decodeProp(_value, _name, _mask, _ctx) {
      var filter = decoders[_name], result = _value;

      if(filter) {
        result = filter.call(_ctx, _value, _mask);
      } else if(typeof _value === 'object') {
        // IDEA: make extended decoding/encoding optional, could be a little taxing for some apps
        if(isArray(_value)) {
          result = [];
          for(var i = 0, l = _value.length; i < l; i++) {
            result.push(decodeProp(_value[i], _name + '[]', _mask, _ctx));
          }
        } else if(_value) {
          result = {};
          decode(_value, result, _name, _mask, _ctx);
        }
      }

      return result;
    }

    function encode(_from, _to, _prefix, _mask, _ctx) {
      var key, fullName, encodedName, value, maps,
          prefix = _prefix ? _prefix + '.' : '';

      // implicit mappings
      for(key in _from) {
        if(_from.hasOwnProperty(key) && key[0] !== '$') {
          fullName = prefix + key;
          // prevent masked or already mapped properties to be copied
          if(mapped[fullName] || isMasked(fullName, _mask, _ctx)) continue;

          value = encodeProp(_from[key], fullName, _mask, _ctx);
          if(value !== undefined) {
            encodedName = _strategies.encodeName ? _strategies.encodeName(key) : key;
            _to[encodedName] = value;
          }

          if(vol[fullName]) delete _from[key];
        }
      }

      // explicit mappings:
      maps = mappings[_prefix];
      if(maps) {
        for(var i = 0, l = maps.length; i < l; i++) {
          fullName = prefix + maps[i].path;
          if(isMasked(fullName, _mask, _ctx)) continue;

          value = _from[maps[i].path];
          if(!maps[i].forced && value === undefined) continue;

          value = encodeProp(value, fullName, _mask, _ctx);
          if(value !== undefined) {
            if(maps[i].map) {
              insert(_to, maps[i].map, value);
            } else {
              _to[_strategies.encodeName ? _strategies.encodeName(maps[i].path) : maps[i].path] = value;
            }
          }
        }
      }
    }

    function encodeProp(_value, _name, _mask, _ctx) {
      var filter = encoders[_name], result = _value;

      if(filter) {
        result = filter.call(_ctx, _value, _mask);
      } else if(_value !== null && typeof _value === 'object' && typeof _value.toJSON !== 'function') {
        // IDEA: make deep decoding/encoding optional, could be a little taxing for some apps
        if(isArray(_value)) {
          result = [];
          for(var i = 0, l = _value.length; i < l; i++) {
            result.push(encodeProp(_value[i], _name + '[]', _mask, _ctx));
          }
        } else if(_value) {
          result = {};
          encode(_value, result, _name, _mask, _ctx);
        }
      }

      return result;
    }

    return {

      // decodes a raw record into a record
      decode: function(_record, _raw, _mask) {
        decode(_raw, _record, '', _mask, _record);
      },

      // encodes a record, returning a raw record
      encode: function(_record, _mask) {
        var raw = {};
        encode(_record, raw, '', _mask, _record);
        return raw;
      },

      // builds a serializerd DSL, is a standalone object that can be extended.
      dsl: function() {

        return {

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
          attrMap: function(_attr, _serverPath, _forced) {
            // extract parent node from client name:
            var index = _attr.lastIndexOf('.'),
                node = index !== -1 ? _attr.substr(0, index) : '',
                leaf = index !== -1 ? _attr.substr(index + 1) : _attr;

            mapped[_attr] = true;

            var nodes = (mappings[node] || (mappings[node] = []));
            nodes.push({ path: leaf, map: _serverPath === '*' ? null : _serverPath.split('.'), mapPath: _serverPath, forced: _forced });
            return this;
          },

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
          attrMask: function(_attr, _mask) {
            if(!_mask) {
              delete masks[_attr];
            } else {
              masks[_attr] = _mask;
            }
            return this;
          },

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
          attrDecoder: function(_attr, _filter, _filterParam, _chain) {

            if(typeof _filter === 'string') {
              var filter = $filter(_filter);
              _filter = function(_value) { return filter(_value, _filterParam); };
            }

            decoders[_attr] = _chain ? Utils.chain(decoders[_attr], _filter) : _filter;
            return this;
          },

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
          attrEncoder: function(_attr, _filter, _filterParam, _chain) {

            if(typeof _filter === 'string') {
              var filter = $filter(_filter);
              _filter = function(_value) { return filter(_value, _filterParam); };
            }

            encoders[_attr] = _chain ? Utils.chain(encoders[_attr], _filter) : _filter;
            return this;
          },

          /**
           * @memberof BuilderApi#
           *
           * @description Makes an attribute volatile, a volatile attribute is deleted from source after encoding.
           *
           * @param {string} _name Attribute name
           * @param {boolean} _isVolatile defaults to true, if set to false then the attribute is no longer volatile.
           * @return {BuilderApi} self
           */
          attrVolatile: function(_attr, _isVolatile) {
            vol[_attr] = _isVolatile === undefined ? true : _isVolatile;
            return this;
          }
        };
      }
    };
  };

}]);