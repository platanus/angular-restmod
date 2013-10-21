'use strict';

/**
 * Simple RESTful URL Builder implementation.
 */

angular.module('plRestmod').
  constant('restUrlBuilderFactory', (function() {

    // Url join function
    function joinUrl(_base/*, parts */) {
      var i = 1, url = (_base + '').replace(/\/$/, ''), partial;
      while((partial = arguments[i++]) !== undefined) {
        url += '/' + (partial + '').replace(/(\/$|^\/)/g, '');
      }
      return url;
    }

    return function(_options) {

      _options = _options || {};

      return function(_resUrl) {

        if(_options.baseUrl) _resUrl = joinUrl(_options.baseUrl, _resUrl);
        var primary = _options.primary || 'id';

        // gives the finishing touches to an url before returning
        function prepareUrl(_url, _opt) {
          if(_url) {
            _url = _url.replace(/\/$/, ''); // always remove trailing slash
            var ext = (_opt && _opt.extension !== undefined) ? _opt.extension : _options.extension;
            if(ext) {
              _url += ext[0] !== '.' ? '.' + ext : ext;
            }
          }
          return _url;
        }

        return {
          /**
           * called by builder when a primary: true attribute is found.
           */
          setPrimaryKey: function(_key) {
            primary = _key;
          },
          /**
           * called by collection whenever implicit key is used
           */
          inferKey: function(/* _context */) {
            return primary;
          },
          /**
           * Called by resource to resolve the resource's url
           */
          resourceUrl: function(_res, _opt) {
            var partial = _res.$partial, pk;

            if(!partial) {
              // if no partial is provided, attempt to use pk with base url
              pk = _res[primary];
              if(pk === null || pk === undefined) return null;
              if(_resUrl) return prepareUrl(joinUrl(_resUrl, pk), _opt); // this preceeds context
            }

            if(_res.$context) {
              // if a context is provided attemp to use it with partial or pk
              var base = _res.$context.$url({ extension: false });
              if(!base) return null;
              return prepareUrl(joinUrl(base, partial || pk), _opt);
            }

            // finally return partial if given, if not return null.
            return prepareUrl(partial || null, _opt);
          },
          /**
           * Called by collections when an url is needed
           *
           * @param  {[type]} _col [description]
           * @return {[type]}      [description]
           */
          collectionUrl: function(_col, _opt) {
            if(_col.$context) {
              var base = _col.$context.$url({ extension: false });
              if(!base) return null;
              return prepareUrl(_col.$partial ? joinUrl(base, _col.$partial) : base, _opt);
            } else if(_col.$partial) {
              return prepareUrl(_col.$partial, _opt);
            } else {
              return prepareUrl(_resUrl, _opt);
            }
          },
          /**
           * called by an unbound resource whenever save is called
           */
          createUrl: function(_res) {
            return _res.$context ? _res.$context.$url() : prepareUrl(_resUrl);
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
      };
    };
  })());
