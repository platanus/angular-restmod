'use strict';

RMModule.factory('RMBuilderComputed', ['restmod',
  function(restmod) {
    /**
     * @class RMBuilderComputedApi
     *
     * @description
     *
     * Builder DSL extension to build computed properties.
     *
     * A computed property is a "virtual" property which is created using
     * other model properties. For example, a user has a firstName and lastName,
     * A computed property, fullName, is generated from the two.
     *
     * Adds the following property modifiers:
     * * `computed` function will be assigned as getter to Model, maps to {@link RMBuilderComputedApi#attrAsComputed}
     *
     */
    var EXT = {

      /**
       * @memberof RMBuilderComputedApi#
       *
       * @description Registers a model computed property
       *
       * @param {string}  _attr Attribute name
       * @param {function} _fn Function that returns the desired attribute value when run.
       * @return {BuilderApi} self
       */
      attrAsComputed: function(_attr, _fn) {
        this.attrComputed(_attr, _fn);
        return this;
      }
    };

    return restmod.mixin(function() {
      this.extend('attrAsComputed', EXT.attrAsComputed, ['computed']);
    });
  }
]);