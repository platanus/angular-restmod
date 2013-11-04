'use strict';


/**
 * @method restUrlBuilderFactory
 * @memberOf constants
 *
 * @description This will no longer be provided as a constant.
 */
angular.module('plRestmod')
  .constant('restUrlBuilderFactory', (function() {

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
      var primary = _options.primary || 'id';

      /**
       * @class RestUrlBuilder
       *
       * @description The default url builder implementation
       *
       * Instances of RestUrlBuilder are generated using the restUrlBuilderFactory.
       * The restUrlBuilderFactory is provided as constant and is actually a factory factory.
       *
       * Factory usage:
       *
       * ```javascript
       * return $restmod(function() {
       *   var builderFactory = restUrlBuilderFactory({ options }); // restUrlBuilderFactory injection not shown.
       *   this.setUrlBuilderFactory(builderFactory);
       *   // or using the provided helper.
       *   this.setRestUrlOptions({ options });
       * });
       * ```
       *
       */
      return function(_resUrl) {

        if(_options.baseUrl) _resUrl = joinUrl(_options.baseUrl, _resUrl);

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
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide a resource's primary key given a resource.
           *
           * IDEA: replace this by something like extractKey?
           */
          inferKey: function(/* _res */) {
            return primary;
          },
          /**
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide a resource's url.
           *
           * The resource url is used to fetch resource contents and to provide
           * a base url for children.
           *
           * IDEA: merge resourceUrl and collectionUrl code?
           *
           * @param  {Model} _res target resource
           * @param  {mixed} _opt options passed to the $url() function.
           * @return {string} The resource url, null if anonymous
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
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide a collection's url.
           *
           * The collection url is used to fetch collection contents and to provide
           * a base url for children.
           *
           * @param  {Collection} _col target collection
           * @param  {mixed} _opt options passed to the $url() function.
           * @return {string} The collection url, null if anonymous
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
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide an url for resource creation.
           *
           * @param {Model} _res target resource
           * @return {string} url
           */
          createUrl: function(_res) {
            return _res.$context ? _res.$context.$url() : prepareUrl(_resUrl);
          },
          /**
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide an url for resource update.
           *
           * Returns the resource url by default.
           *
           * @param {Model} _res target resource
           * @return {string} url
           */
          updateUrl: function(_res) {
            return this.resourceUrl(_res);
          },
          /**
           * @method
           * @memberOf RestUrlBuilder#
           *
           * @description Called to provide an url for resource destruction.
           *
           * Returns the resource url by default.
           *
           * @param {Model} _res target resource
           * @return {string} url
           */
          destroyUrl: function(_res) {
            return this.resourceUrl(_res);
          }
        };
      };
    };
  })())
  .config(['$restmodProvider', function($restmodProvider) {
    $restmodProvider.pushModelBase(['$injector', function($injector) {
      /**
       * @method setRestUrlOption
       * @memberof ModelBuilder#
       *
       * @description The setRestUrlOptions extensions allows to easily setup a rest url builder factory
       * for a given model chain.
       *
       * This is only available if the restUrlBuilderFactory is included.
       *
       * TODO: improve inheritance support.
       *
       * Available `options` are:
       * * primary: the selected primary key, defaults to 'id'.
       * * baseUrl: the api base url, this will be prepended to every url path.
       * * extension: a extension to append to every generated url.
       *
       * @param  {object} _options Options
       * @return {ModelBuilder} self
       */
      this.extend('setRestUrlOptions', function(_options) {
        return this.setUrlBuilderFactory($injector.get('restUrlBuilderFactory')(_options));
      });
    }]);
  }]);
