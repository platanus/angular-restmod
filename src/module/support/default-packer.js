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

  var unpack = function(_resource, _raw) {
    var name = null,
        links = this.getProperty('jsonLinks', 'included'),
        meta = this.getProperty('jsonMeta', 'meta'),
        root = this.getProperty('jsonRoot', {});

    if(root === false || typeof root === 'string') {
      name = root;
    } else {
      if(_resource.$isCollection) name = root.fetchMany;
      if(!name && name !== false) name = root.fetch;
      if(!name && name !== false) name = this.identity(_resource.$isCollection);
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

    return name ? _raw[name] : _raw;
  };

  var pack = function(_resource, _raw) {
    var name = null,
        root = this.getProperty('jsonRoot', {});

    if(root === false || typeof root === 'string') {
      name = root;
    } else {
      if(_resource.$isCollection) name = root.sendMany;
      if(!name && name !== false) name = root.send;
      if(!name && name !== false) name = this.identity(_resource.$isCollection);
    }

    if(name) {
      var result = {};
      result[name] = _raw;
      return result;
    } else {
      return _raw;
    }
  };

  /**
   * @class DefaultPacker
   *
   * @description
   *
   * Simple `$unpack` and `$pack` implementation that attempts to cover the standard proposed by
   * [active_model_serializers](https://github.com/rails-api/active_model_serializers.
   *
   * This used to match the wrapping structure recommented by the jsonapi.org standard. The current
   * standard is much more complex and we intend to support it via a special style.
   *
   * This mixin gives support for json root, side loaded associated resources (via supporting relations)
   * and response metadata.
   *
   * To activate add the mixin to model chain
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
   * To change or disable the response/request json root use the *jsonRoot** configuration variable:
   *
   * ```javascript
   * {
   *   $config: {
   *     jsonRoot: "data" // set json root to "data" for both requests and responses.
   *     // OR
   *     jsonRoot: {
   *       send: false, // disable json root for requests
   *       fetch: "data" // expect response to use "data" as json root.
   *     }
   *   }
   * }
   * ```
   *
   * ### Side loaded resources
   *
   * By default the mixin will look for links to other resources in the 'included' root property, you
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
   * ### Request root object
   *
   * By default the packer will use the same naming criteria for responses and requests.
   *
   * You can disable request wrapping by setting the `jsonRoot`
   *
   */
  return restmod.mixin(function() {
    this
      .define('Model.unpack', unpack)
      .define('Model.pack', pack);
  });

}]);