'use strict';

RMModule.factory('DefaultPacker', ['restmod', 'inflector', 'RMPackerCache', function(restmod, inflector, packerCache) {

  // process metadata
  function processMeta(_meta, _raw, _skip) {
    var metaDef = _meta;
    if(typeof metaDef === 'string') {
      if(metaDef === '.') {
        var meta = {};
        for(var key in _raw) {
          if(_raw.hasOwnProperty(key) &&  _skip.indexOf(key) === -1) { // skip links and object root if extracting from root.
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
	function processLinks(_links, _raw, _skip) {
    var source = _links === '.' ? _raw : _raw[_links];
    if(!source) return;

    // feed packer cache
    for(var key in source) {
      if(source.hasOwnProperty(key) && _skip.indexOf(key) === -1) {
        var cache = source[key];
        // TODO: check that cache is an array.
        packerCache.feed(key, cache);
      }
    }
  }

  /**
   * @class DefaultPacker
   *
   * @description
   *
   * Simple `$unpack` implementation that attempts to cover the standard proposed by
   * [active_model_serializers](https://github.com/rails-api/active_model_serializers.
   *
   * This is a simplified version of the wrapping structure recommented by the jsonapi.org standard,
   * it supports side loaded associated resources (via supporting relations) and metadata extraction.
   *
   * To activate add mixin to model chain
   *
   * ```javascript
   * restmodProvide.rebase('DefaultPacker');
   * ```
   *
   * ### Json root
   *
   * By default the mixin will use the singular model name as json root for single resource requests
   * and pluralized name for collection requests. Make sure the model name is correctly set.
   *
   * To override the name used by the mixin set the **jsonRootSingle** and **jsonRootMany** variables.
   * Or set **jsonRoot** to override both.
   *
   * ### Side loaded resources
   *
   * By default the mixin will look for links to other resources in the 'linked' root property, you
   * can change this by setting the jsonLinks variable. To use the root element as link source
   * use `jsonLinks: true`. To skip links processing, set it to false.
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
   * To change the metadata source property set the jsonMeta property to the desired name, set
   * it to '.' to capture the entire raw response or set it to false to skip metadata. It can also be set
   * to a function, for custom processsing.
   *
   * @property {mixed} single The expected single resource wrapper property name
   * @property {object} plural The expected collection wrapper property name
   * @property {mixed} links The links repository property name
   * @property {object} meta The metadata repository property name
   *
   */
  return restmod.mixin(function() {
    this.define('Model.unpack', function(_resource, _raw) {
      var name = null,
          links = this.getProperty('jsonLinks', 'linked'),
          meta = this.getProperty('jsonMeta', 'meta');

      if(_resource.$isCollection) {
        name = this.getProperty('jsonRootMany') || this.getProperty('jsonRoot') || this.getProperty('plural');
      } else {
        // TODO: use plural for single resource option.
        name = this.getProperty('jsonRootSingle') || this.getProperty('jsonRoot') || this.getProperty('name');
      }

      if(meta) _resource.$metadata = processMeta(meta, _raw, [name, links]);
      if(links) processLinks(links, _raw, [name]);
      return _raw[name];
    });
  });

}]);