'use strict';

RMModule.factory('DefaultPacker', ['inflector', 'RMPackerCache', function(inflector, packerCache) {

  /**
   * @class DefaultPacker
   *
   * @description
   *
   * Simple packer implementation that attempts to cover the standard proposed by
   * [active_model_serializers]{@link https://github.com/rails-api/active_model_serializers}.
   *
   * This is a simplified version of the wrapping structure recommented by the jsonapi.org standard,
   * it supports side loaded associated resources (via supporting relations) and metadata extraction.
   *
   * To activate use
   *
   * ```javascript
   * PACKER: 'default'
   * ```
   *
   * ### Json root
   *
   * By default the packer will use the singular model name as json root for single resource requests
   * and pluralized name for collection requests. Make sure the model name is correctly set.
   *
   * To override the name used by the packer set the JSON_ROOT_SINGLE and JSON_ROOT_MANY variables.
   * Or set JSON_ROOT to override both.
   *
   * ### Side loaded resources
   *
   * By default the packer will look for links to other resources in the 'linked' root property, you
   * can change this by setting the JSON_LINKS variable. To use the root element as link source
   * use `JSON_LINKS: true`. To skip links processing, set it to false.
   *
   * Links are expected to use the pluralized version of the name for the referenced model. For example,
   * given the following response:
   *
   * ```json
   * {
   *   bikes: [...],
   *   links {
   *     parts: [...]
   *   }
   * }
   * ```
   *
   * Restmod will expect that the Part model plural name is correctly set parts. Only properties declared
   * as reference relations (belongsTo and belongsToMany) will be correctly resolved.
   *
   * ### Metadata
   *
   * By default metadata is only captured if it comes in the 'meta' root property. Metadata is then
   * stored in the $meta property of the resource being unwrapped.
   *
   * To change the metadata source property set the JSON_META property to the desired name, set
   * it to '.' to capture the entire raw response or set it to false to skip metadata. It can also be set
   * to a function, for custom processsing.
   *
   * @property {mixed} single The expected single resource wrapper property name
   * @property {object} plural The expected collection wrapper property name
   * @property {mixed} links The links repository property name
   * @property {object} meta The metadata repository property name
   *
   */
  function Packer(_model) {
    this.single = _model.$getProperty('jsonRootSingle') || _model.$getProperty('jsonRoot') || _model.$getProperty('name');
    this.plural = _model.$getProperty('jsonRootMany') || _model.$getProperty('jsonRoot') || _model.$getProperty('plural');

    // Special options
    this.links = _model.$getProperty('jsonLinks', 'linked');
    this.meta = _model.$getProperty('jsonMeta', 'meta');
    // TODO: use plural for single resource option.
  }

  // process metadata
  function processMeta(_packer, _raw, _skip) {
    var metaDef = _packer.meta;
    if(typeof metaDef === 'string') {
      if(metaDef === '.') {
        var meta = {};
        for(var key in _raw) {
          if(_raw.hasOwnProperty(key) && key !== _skip && key !== _packer.links) { // skip links and object root if extracting from root.
            meta[key] = _raw[key];
          }
        }
        return meta;
      } else {
        return _raw[metaDef];
      }
    } else if(typeof metaDef === 'function') {
      return metaDef(_raw);
    }
  }

  // process links and stores them in the packer cache
	function processLinks(_packer, _raw, _skip) {
    var source = _packer.links === '.' ? _raw : _raw[_packer.links];
    if(!source) return;

    // feed packer cache
    for(var key in source) {
      if(source.hasOwnProperty(key) && key !== _skip) {
        var cache = source[key];
        // TODO: check that cache is an array.
        packerCache.feed(key, cache);
      }
    }
  }

  Packer.prototype = {

    unpack: function(_unpackedRaw, _record) {
      if(this.meta) _record.$metadata = processMeta(this, _unpackedRaw, this.single);
      if(this.links) processLinks(this, _unpackedRaw, this.single);
      return _unpackedRaw[this.single];
    },

    unpackMany: function(_unpackedRaw, _collection) {
      if(this.meta) _collection.$metadata = processMeta(this, _unpackedRaw, this.plural);
      if(this.links) processLinks(this, _unpackedRaw, this.plural);
      return _unpackedRaw[this.plural];
    },

    pack: function(_raw) {
      return _raw; // no special packing
    }
  };

  return function(_model) {
    return new Packer(_model);
  };

}]);