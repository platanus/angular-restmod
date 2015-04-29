'use strict';

// Preload some angular stuff
var RMModule = angular.module('restmod', ['ng', 'platanus.inflector']);

/**
 * @class restmodProvider
 *
 * @description
 *
 * The restmodProvider exposes restmod configuration methods
 */
RMModule.provider('restmod', [function() {

  var BASE_CHAIN = ['RMBuilderExt', 'RMBuilderRelations', 'RMBuilderComputed'];

  function wrapInInvoke(_mixin) {
    return function(_injector) {
      _injector.invoke(_mixin, this, { $builder: this });
    };
  }

  return {
    /**
     * @memberof restmodProvider#
     *
     * @description
     *
     * Adds base mixins for every generated model.
     *
     * **ATTENTION** Model names should NOT be added to this chain.
     *
     * All mixins added to the chain are prepended to every generated model.
     *
     * Usage:
     *
     * ```javascript
     * $provider.rebase('ChangeModel', 'LazyRelations', 'ThrottledModel')
     * ```
     */
    rebase: function(/* _mix_names */) {
      var mixin, i, l = arguments.length;
      for(i = 0; i < l; i++) {
        mixin = arguments[i];
        if(angular.isArray(mixin) || angular.isFunction(mixin)) {
          mixin = wrapInInvoke(mixin);
        }
        BASE_CHAIN.push(mixin);
      }
      return this;
    },

    /**
     * @class restmod
     *
     * @description
     *
     * The restmod service provides factory methods for the different restmod consumables.
     */
    $get: ['RMModelFactory', '$log', function(buildModel, $log) {

      var arraySlice = Array.prototype.slice;

      var restmod = {
        /**
         * @memberOf restmod#
         *
         * @description
         *
         * The model factory is used to generate new restmod model types. It's recommended to put models inside factories,
         * this is usefull later when defining relations and inheritance, since the angular $injector is used by
         * these features. It's also the angular way of doing things.
         *
         * A simple model can be built like this:
         *
         * ```javascript
         * angular.module('bike-app').factory('Bike', function(restmod) {
         *   return restmod.model('/bikes');
         * });
         *```
         *
         * The `_url` parameter is the resource url the generated model will be bound to, if `null` is given then
         * the model is *nested* and can only be used in another model context.
         *
         * The model also accepts one or more definition providers as one or more arguments after the _url parameter,
         * posible definition providers are:
         *
         * * A definition object (more on this at the {@link BuilderApi}):
         *
         * ```javascript
         * restmod.model('/bikes', {
         *   viewed: { init: false },
         *   parts: { hasMany: 'Part' },
         *   '~afterCreate': function() {
         *     alert('Bike created!!');
         *   }
         * });
         *```
         *
         * * A definition function (more on this at the {@link BuilderApi}):
         *
         * ```javascript
         * restmod.model('/bikes', function() {
         *   this.attrDefault('viewed', false);
         *   this.attrMask('id', 'CU');
         * });
         *```
         *
         * * A mixin (generated using the mixin method) or model factory name:
         *
         * ```javascript
         * restmod.model('/bikes', 'BaseModel', 'PagedModel');
         *```
         *
         * * A mixin (generated using the mixin method) or model object:
         *
         * ```javascript
         * restmod.model('/bikes', BaseModel, PagedModel);
         * ```
         *
         * @param {string} _url Resource url.
         * @param {mixed} _mix One or more mixins, description objects or description blocks.
         * @return {StaticApi} The new model.
         */
        model: function(_baseUrl/* , _mix */) {
          var model = buildModel(_baseUrl, BASE_CHAIN);

          if(arguments.length > 1) {
            model.mix(arraySlice.call(arguments, 1));
            $log.warn('Passing mixins and definitions in the model method will be deprecated in restmod 1.2, use restmod.model().mix() instead.');
          }

          return model;
        },

        /**
         * @memberOf restmod#
         *
         * @description
         *
         * The mixin factory is used to pack model behaviors without the overload of generating a new
         * model. The mixin can then be passed as argument to a call to {@link restmod#model#model}
         * to extend the model capabilities.
         *
         * A mixin can also be passed to the {@link restmodProvider#rebase} method to provide
         * a base behavior for all generated models.
         *
         * @param {mixed} _mix One or more mixins, description objects or description blocks.
         * @return {object} The mixin
         */
        mixin: function(/* _mix */) {
          return { $isAbstract: true, $$chain: arraySlice.call(arguments, 0) };
        },

        /**
         * @memberOf restmod#
         *
         * @description
         *
         * Shorcut method used to create singleton resources.
         *
         * Same as calling `restmod.model(null).$single(_url)`
         *
         * Check the {@link StaticApi#$single} documentation for more information.
         *
         * @param {string} _url Resource url,
         * @param {mixed} _mix Mixin chain.
         * @return {RecordApi} New resource instance.
         */
        singleton: function(_url/*, _mix */) {
          return restmod.model.apply(this, arguments).single(_url);
        }
      };

      return restmod;
    }]
  };
}])
.factory('model', ['restmod', function(restmod) {
  return restmod.model;
}])
.factory('mixin', ['restmod', function(restmod) {
  return restmod.mixin;
}]);
