'use strict';

/**
 * @class Utils
 * @memberOf constants
 *
 * @description Various utilities used across
 * the library
 *
 * This utilities are available as the `Utils` constant when restmod is included.
 */
var Utils = {
  /**
   * @memberof constants.Utils
   *
   * @description Transforms a string to it's camelcase representation
   *
   * TODO: handle diacritics
   *
   * @param  {string} _string Original string
   * @return {string} Camelcased string
   */
  camelcase: function(_string) {
    if (typeof _string !== 'string') return _string;
    return _string.replace(/_[\w\d]/g, function (match, index, string) {
      return index === 0 ? match : string.charAt(index + 1).toUpperCase();
    });
  },
  /**
   * @memberof constants.Utils
   *
   * @description Transforms a string to it's snakecase representation
   *
   * TODO: handle diacritics
   *
   * @param  {string} _string Original string
   * @param  {string} _sep Case separator, defaults to '_'
   * @return {string} Camelcased string
   */
  snakecase: function(_string, _sep) {
    if (typeof _string !== 'string') return _string;
    return _string.replace(/[A-Z]/g, function (match, index) {
      return index === 0 ? match : (_sep || '_') + match.toLowerCase();
    });
  },
  /**
   * @memberof constants.Utils
   *
   * @description Chains to filtering functions together
   *
   * @param  {function} _first original function
   * @param  {function} _fun   function to call on the original function result
   * @return {mixed}        value returned by the last function call
   */
  chain: function(_first, _fun) {
    if(!_first) return _fun;
    return function(_value) {
      return _fun.call(this, _first.call(this, _value));
    };
  },
  /**
   * @memberof constants.Utils
   *
   * @description Override a property value, making overriden function available as this.$super
   *
   * @param  {function} _super Original value
   * @param  {mixed} _fun New property value
   * @return {mixed} Value returned by new function
   */
  override: function(_super, _fun) {
    if(!_super || typeof _fun !== 'function') return _fun;

    return function() {
      var oldSuper = this.$super;
      try {
        this.$super = _super;
        return _fun.apply(this, arguments);
      } finally {
        this.$super = oldSuper;
      }
    };
  },
  /**
   * @memberof constants.Utils
   *
   * @description Extend an object using `Utils.override` instead of just replacing the functions.
   *
   * @param  {object} _target Object to be extended
   * @param  {object} _other  Source object
   */
  extendOverriden: function(_target, _other) {
    for(var key in _other) {
      if(_other.hasOwnProperty(key)) {
        _target[key] = Utils.override(_target[key], _other[key]);
      }
    }
  }
};

// make this available as a restmod constant
angular.module('plRestmod').constant('Utils', Utils);
