'use strict';

RMModule.factory('DefaultPacker', ['restmod', 'inflector', 'RMPackerCache', function(restmod, inflector, packerCache) {

  function include(_source, _list, _do) {
    for(var i = 0, l = _list.length; i < l; i++) {
      _do(_list[i], _source[_list[i]]);
    }
  }

  function exclude(_source, _skip, _do) {
    for(var key in _source) {
      if(_source.hasOwnProperty(key) && _skip.indexOf(key) === -1) {
        _do(key, _source[key]);
      }
    }
  }

  // process links and stores them in the packer cache
  function processFeature(_raw, _name, _feature, _other, _do) {
    if(_feature === '.' || _feature === true) {
      var skip = [_name];
      if(_other) skip.push.apply(skip, angular.isArray(_other) ? _other : [_other]);
      exclude(_raw, skip, _do);
    } else if(typeof _feature === 'string') {
      exclude(_raw[_feature], [], _do);
    } else { // links is an array
      include(_raw, _feature, _do);
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
   * use `jsonLinks: '.'`. You can also explicitly select which properties to consider links using an
   * array of property names. To skip links processing altogether, set it to false.
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
   * Just like links, to change the metadata source property set the jsonMeta property to the desired name, set
   * it to '.' to capture the entire raw response or set it to false to skip metadata and set it to an array of properties
   * to be extract selected properties.
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
          links = this.getProperty('jsonLinks', 'included'),
          meta = this.getProperty('jsonMeta', 'meta');

      if(_resource.$isCollection) {
        name = this.getProperty('jsonRootMany') || this.getProperty('jsonRoot') || this.identity(true);
      } else {
        // TODO: use plural for single resource option.
        name = this.getProperty('jsonRootSingle') || this.getProperty('jsonRoot') || this.identity();
      }

      if(meta) {
        _resource.$metadata = {};
        processFeature(_raw, name, meta, links, function(_key, _value) {
          _resource.$metadata[_key] = _value;
        });
      }

      if(links) {
        processFeature(_raw, name, links, meta, function(_key, _value) {
          // TODO: check that cache is an array.
          packerCache.feed(_key, _value);
        });
      }

      return _raw[name];
    });
  });

}]);