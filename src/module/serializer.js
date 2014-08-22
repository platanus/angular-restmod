'use strict';

RMModule.factory('RMSerializerFactory', ['$injector', 'inflector', '$filter', 'RMUtils', function($injector, inflector, $filter, Utils) {

  function extract(_from, _path) {
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

  return function() {

    var isArray = angular.isArray;

    // Private serializer attributes
    var masks = {},
        decoders = {},
        encoders = {},
        mapped = {},
        mappings = {},
        nameDecoder = inflector.camelize,
        nameEncoder = function(_v) { return inflector.parameterize(_v, '_'); };

    function isMasked(_name, _mask) {
      var mask = masks[_name];
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
          if(isMasked(fullName, _mask)) continue;

          if(maps[i].map) {
            value = extract(_from, maps[i].map);
          } else {
            value = _from[nameEncoder ? nameEncoder(maps[i].path) : maps[i].path];
          }

          if(!maps[i].forced && value === undefined) continue;

          value = decodeProp(value, fullName, _mask, _ctx);
          if(value !== undefined) _to[maps[i].path] = value;
        }
      }

      // implicit mappings
      for(key in _from) {
        if(_from.hasOwnProperty(key)) {

          decodedName = nameDecoder ? nameDecoder(key) : key;
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
          if(mapped[fullName] || isMasked(fullName, _mask)) continue;

          value = decodeProp(_from[key], fullName, _mask, _ctx);
          if(value !== undefined) _to[decodedName] = value; // ignore value if filter returns undefined
        }
      }
    }

    function decodeProp(_value, _name, _mask, _ctx) {
      var filter = decoders[_name], result = _value;

      if(filter) {
        result = filter.call(_ctx, _value);
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
          if(mapped[fullName] || isMasked(fullName, _mask)) continue;

          value = encodeProp(_from[key], fullName, _mask, _ctx);
          if(value !== undefined) {
            encodedName = nameEncoder ? nameEncoder(key) : key;
            _to[encodedName] = value;
          }
        }
      }

      // explicit mappings:
      maps = mappings[_prefix];
      if(maps) {
        for(var i = 0, l = maps.length; i < l; i++) {
          fullName = prefix + maps[i].path;
          if(isMasked(fullName, _mask)) continue;

          value = _from[maps[i].path];
          if(!maps[i].forced && value === undefined) continue;

          value = encodeProp(value, fullName, _mask, _ctx);
          if(value !== undefined) {
            if(maps[i].map) {
              insert(_to, maps[i].map, value);
            } else {
              _to[nameEncoder ? nameEncoder(maps[i].path) : maps[i].path] = value;
            }
          }
        }
      }
    }

    function encodeProp(_value, _name, _mask, _ctx) {
      var filter = encoders[_name], result = _value;

      if(filter) {
        result = filter.call(_ctx, _value);
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

      // sets the model name decoder
      setNameDecoder: function(_fun) {
        nameDecoder = _fun;
        return this;
      },

      // sets the model name encoder
      setNameEncoder: function(_fun) {
        nameEncoder = _fun;
        return this;
      },

      // specifies a single server to client property mapping
      setMapping: function(_attr, _serverPath, _forced) {
        // extract parent node from client name:
        var index = _attr.lastIndexOf('.'),
            node = index !== -1 ? _attr.substr(0, index) : '',
            leaf = index !== -1 ? _attr.substr(index + 1) : _attr;

        mapped[_attr] = true;

        var nodes = (mappings[node] || (mappings[node] = []));
        nodes.push({ path: leaf, map: _serverPath === '*' ? null : _serverPath.split('.'), mapPath: _serverPath, forced: _forced });
        return this;
      },

      // sets an attrinute mask
      setMask: function(_attr, _mask) {
        if(!_mask) {
          delete masks[_attr];
        } else {
          masks[_attr] = _mask;
        }
        return this;
      },

      // sets an attrinute decoder
      setDecoder: function(_attr, _filter, _filterParam, _chain) {

        if(typeof _filter === 'string') {
          var filter = $filter(_filter);
          // TODO: if(!_filter) throw $setupError
          _filter = function(_value) { return filter(_value, _filterParam); };
        }

        decoders[_attr] = _chain ? Utils.chain(decoders[_attr], _filter) : _filter;
        return this;
      },

      // sets an attribute encoder
      setEncoder: function(_attr, _filter, _filterParam, _chain) {

        if(typeof _filter === 'string') {
          var filter = $filter(_filter);
          // TODO: if(!_filter) throw $setupError
          _filter = function(_value) { return filter(_value, _filterParam); };
        }

        encoders[_attr] = _chain ? Utils.chain(encoders[_attr], _filter) : _filter;
        return this;
      },

      // decodes a raw record into a record
      decode: function(_record, _raw, _mask) {
        decode(_raw, _record, '', _mask, _record);
      },

      // encodes a record, returning a raw record
      encode: function(_record, _mask) {
        var raw = {};
        encode(_record, raw, '', _mask, _record);
        return raw;
      }
    };
  };

}]);