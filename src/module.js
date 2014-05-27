'use strict';

// Simple url joining.
function joinUrl(_head, _tail) {
  if(!_head || !_tail) return null;
  return (_head+'').replace(/\/$/, '') + '/' + (_tail+'').replace(/(\/$|^\/)/g, '');
}

// Preload some angular stuff
var RMModule = angular.module('plRestmod', ['ng', 'platanus.inflector']),
    bind = angular.bind,
    forEach = angular.forEach,
    extend = angular.extend,
    noop = angular.noop,
    isObject = angular.isObject,
    isArray = angular.isArray,
    isFunction = angular.isFunction;

// Constants
var CREATE_MASK = 'C',
    UPDATE_MASK = 'U',
    READ_MASK = 'R',
    WRITE_MASK = 'CU',
    FULL_MASK = 'CRU';

/**
 * @class $restmodProvider
 *
 * @description
 *
 * The $restmodProvider exposes $restmod configuration methods
 */
RMModule.provider('$restmod', [function() {

  var BASE_CHAIN = []; // The base mixin chain

  return {
    /**
     * @memberof $restmodProvider
     *
     * @description
     * Adds mixins to the base model chain.
     *
     * Non abstract models should NOT be added to this chain.
     *
     * Base model chain is by default empty, all mixins added to the chain are
     * prepended to every generated model.
     *
     * Usage:
     *
     * ```javascript
     * $provider.pushModelBase('ChangeModel', 'LazyRelations', 'ThrottledModel')
     * ```
     */
    pushModelBase: function(/* mixins */) {
      Array.prototype.push.apply(BASE_CHAIN, arguments);
      return this;
    },

    /**
     * @module $restmod
     *
     * @description
     *
     * The restmod service provides the `model` and `mixin` factories.
     */
    $get: ['RMModelFactory', 'RMBuilder', function(factory, Builder) {

      var arraySlice = Array.prototype.slice;

      var restmod = {
        /**
         * @memberOf $restmod#
         *
         * @description
         *
         * The model factory is used to generate mode types using a rich building DSL provided
         * by the {@link restmod.class:ModelBuilder ModelBuilder}.
         *
         * For more information about model generation see {@link Building a Model}
         */
        model: function(_baseUrl/* , _mix */) {

          // Generate a new model type.
          var Model = factory(_baseUrl);

          // Load builder and execute it.
          var builder = new Builder(Model);
          builder.loadMixinChain(BASE_CHAIN);
          builder.loadMixinChain(Model.$chain = arraySlice.call(arguments, 1));

          return Model;
        },

        /**
         * @memberOf $restmod#
         *
         * @description
         *
         * The mixin factory
         *
         * A mixin is just a metadata container that can be included in a mixin chain.
         *
         * @return {object} The abstract model
         */
        mixin: function(/* mixins */) {
          return { $isAbstract: true, $chain: arraySlice.call(arguments, 0) };
        },

        /**
         * @memberOf $restmod#
         *
         * @description
         *
         * Shorcut method used to create singleton resources. see {@link StaticApi@$single}.
         *
         * @param {string} _url Resource url,
         * @param {mixed} _mixins Mixin chain.
         * @return {object} New resource instance.
         */
        singleton: function(_url/*, _mixins*/) {
          return restmod.model.apply(this, arguments).$single(_url);
        }
      };

      return restmod;
    }]
  };
}])
.factory('model', ['$restmod', function($restmod) {
  return $restmod.model;
}])
.factory('mixin', ['$restmod', function($restmod) {
  return $restmod.mixin;
}]);
