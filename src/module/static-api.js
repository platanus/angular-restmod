'use strict';

RMModule.factory('RMStaticApi', ['$inflector', 'RMScopeApi', 'RMCommonApi', 'RMRecordApi', 'RMCollectionApi', 'RMUtils', function($inflector, ScopeApi, CommonApi, RecordApi, CollectionApi, Utils) {

  var extend = angular.extend;

  /**
   * @class StaticApi
   * @extends ScopeApi
   * @extends CommonApi
   *
   * @description
   *
   * The $restmod type API, every generated $restmod model type exposes this API.
   *
   * @property {object} $type Reference to the type itself, for compatibility with the {@link ScopeApi}
   *
   * #### About object creation
   *
   * Direct construction of object instances using `new` is not recommended. A collection of
   * static methods are available to generate new instances of a model, for more information
   * read the {@link ModelCollection} documentation.
   */
  return extend({

    /**
     * @memberof StaticApi#
     *
     * @description
     *
     * Called by record constructor on initialization.
     *
     * Note: Is better to add a hook to after-init than overriding this method.
     *
     * @param {mixed} _scope The instance scope.
     * @param {mixed} _params The collection parameters.
     */
    $initialize: function(_config) {

      this.$$baseUrl = null;
      this.$$config = {};

      if(_config) {
        if(typeof _config === 'string') {
          this.$$baseUrl = _config;
        } else {
          this.$$config = _config;
          this.$$baseUrl = _config.url;
        }
      }

      this.$type = this;
      this.$$urlPrefix = null;
      this.$$primaryKey = 'id';
      this.$$masks = {};
      this.$$defaults = [];
      this.$$decoders = {};
      this.$$encoders = {};
      this.$$nameDecoder = $inflector.camelize;
      this.$$nameEncoder = function(_v) { return $inflector.parameterize(_v, '_'); };

      // load the record api
      extend(this.prototype, RecordApi);

      // load the collection type
      this.Collection = Utils.buildArrayType();
      extend(this.Collection.prototype, CollectionApi);
    },

    // sets an attribute mask at runtime
    // private for now...
    $$setMask: function(_attr, _mask) {
      if(!_mask) {
        delete this.$$masks[_attr];
      } else {
        this.$$masks[_attr] = _mask === true ? Utils.FULL_MASK : _mask;
      }
    },

    /**
     * @memberof StaticApi#
     *
     * @description
     *
     * Builds a new collection of records
     *
     * Collections are bound to an api resource.
     *
     * @param  {object} _params  Additional query string parameters
     * @param  {object} _scope Collection scope
     * @return {CollectionApi} New collection
     */
    $collection: function(_params, _scope) {

      var col = new (this.Collection)();
      col.$type = this;
      col.$initialize(_scope || this, _params);

      return col;
    },

    /**
     * @memberof StaticApi#
     *
     * @description Returns a resource bound to a given url, with no parent scope.
     *
     * This can be used to create singleton resources:
     *
     * ```javascript
     * module('BikeShop', []).factory('Status', function($restmod) {
     *   return $restmod.model(null).$single('/api/status');
     * };)
     * ```
     *
     * @param {string} _url Url to bound resource to.
     * @return {Model} new resource instance.
     */
    $single: function(_url) {
      var Model = this;
      return new Model({
        $urlFor: function() {
          return Model.$$urlPrefix ? Utils.joinUrl(Model.$$urlPrefix, _url) : _url;
        }
      }, '');
    },

    /**
     * @memberof StaticApi#
     *
     * @description Returns true if model is anonymous.
     *
     * An anonymous model can only be used as a nested resource (using relations)
     *
     * @return {boolean} true if model is anonymous.
     */
    $anonymous: function() {
      return !this.$$baseUrl;
    },

    /**
     * @memberof StaticApi#
     *
     * @description Returns a model's object private key from model raw data.
     * If data is not an object, then it is considered to be the primary key value.
     *
     * The private key is the passed to the $urlFor function to obtain an object's url.
     *
     * This method should not be overriden directly, use the {@link ModelBuilder#setPrimaryKey}
     * method to change the primary key.
     *
     * @param {object} _data decoded object data (or pk)
     * @return {mixed} object private key
     */
    $inferKey: function(_rawData) {
      if(!_rawData || typeof _rawData[this.$$primaryKey] === 'undefined') return null;
      return _rawData[this.$$primaryKey];
    },

    /**
     * @memberof StaticApi#
     *
     * @description Returns the model base url.
     *
     * @return {string} The base url.
     */
    $url: function() {
      return this.$$urlPrefix ? Utils.joinUrl(this.$$urlPrefix, this.$$baseUrl) : this.$$baseUrl;
    },

    /**
     * @memberof StaticApi#
     *
     * @description Part of the scope interface, provides urls for collection's items.
     *
     * @param {Model} _pk Item key to provide the url to.
     * @return {string|null} The url or nill if item does not meet the url requirements.
     */
    $urlFor: function(_pk) {
      return Utils.joinUrl(this.$url(), _pk);
    }

  }, ScopeApi, CommonApi);

}]);