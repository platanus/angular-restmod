'use strict';

/**
 * Simple RESTful URL Builder implementation.
 */

angular.module('plRestmod').
  constant('RestUrlBuilderFactory', (function() {

    var RestUrlBuilderFactory = function(_primary, _baseUrl) {
      this.primary = _primary;
      this.baseUrl = _baseUrl;
    };

    RestUrlBuilderFactory.prototype = {
      get: function(_resUrl) {

        if(this.baseUrl) _resUrl = this.baseUrl + '/' + _resUrl;

        var defaults = {
          primary: this.primary
        };

        return {
          /**
           * called by builder when a primary: true attribute is found.
           */
          setPrimaryKey: function(_key) {
            defaults.primary = _key;
          },
          /**
           * called by collection whenever implicit key is used
           */
          inferKey: function(/* _context */) {
            return defaults.primary;
          },
          /**
           * Called by resource to resolve the resource's url
           */
          resourceUrl: function(_res) {
            var partial = _res.$partial, pk;

            if(!partial) {
              // if no partial is provided, attempt to use pk with base url
              pk = _res[defaults.primary];
              if(pk === null || pk === undefined) return null;
              if(_resUrl) return _resUrl + '/' + pk; // this preceeds context
            }

            if(_res.$context) {
              // if a context is provided attemp to use it with partial or pk
              var base = _res.$context.$url();
              if(!base) return null;
              return base + '/' + (partial || pk);
            }

            // finally return partial if given, if not return null.
            return (partial || null);
          },
          /**
           * Called by collections when an url is needed
           *
           * @param  {[type]} _col [description]
           * @return {[type]}      [description]
           */
          collectionUrl: function(_col) {
            if(_col.$context) {
              var base = _col.$context.$url();
              if(!base) return null;
              return _col.$partial ? base + '/' + _col.$partial : base;
            } else if(_col.$partial) {
              return _col.$partial;
            } else {
              return _resUrl;
            }
          },
          /**
           * called by an unbound resource whenever save is called
           */
          createUrl: function(_res) {
            if(_res.$context) return _res.$context.$url();
            return _resUrl;
          },
          /**
           * called by a bound resource whenever save is called
           */
          updateUrl: function(_res) {
            return this.resourceUrl(_res);
          },
          /**
           * called by a bound resource whenever destroy is called
           */
          destroyUrl: function(_res) {
            return this.resourceUrl(_res);
          }
        };
      }
    };

    return RestUrlBuilderFactory;
  })());
