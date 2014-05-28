'use strict';

/**
 * @class Utils
 *
 * @description Various utilities used across
 * the library
 *
 * This utilities are available as the `Utils` constant when restmod is included.
 */
RMModule.constant('RMUtils', {

  // Ignore Masks
  CREATE_MASK: 'C',
  UPDATE_MASK: 'U',
  READ_MASK: 'R',
  WRITE_MASK: 'CU',
  FULL_MASK: 'CRU',

  /**
   * @memberof Utils
   *
   * @description Simple url joining.
   *
   */
  joinUrl: function(_head, _tail) {
    if(!_head || !_tail) return null;
    return (_head+'').replace(/\/$/, '') + '/' + (_tail+'').replace(/(\/$|^\/)/g, '');
  },

  /**
   * @memberof Utils
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
   * @memberof Utils
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
   * @memberof Utils
   *
   * @description Extend an object using `Utils.override` instead of just replacing the functions.
   *
   * @param  {object} _target Object to be extended
   * @param  {object} _other  Source object
   */
  extendOverriden: function(_target, _other) {
    for(var key in _other) {
      if(_other.hasOwnProperty(key)) {
        _target[key] = this.override(_target[key], _other[key]);
      }
    }
  },
  /**
   * @memberof Utils
   *
   * @description Generates a new array type, handles platform specifics.
   *
   * Based on the awesome blog post of Dean Edwards: http://dean.edwards.name/weblog/2006/11/hooray/
   *
   * @return {object} Independent array type.
   */
  buildArrayType: function() {

    var arrayType, ieMode = true;

    if(ieMode)
    {
      // create an <iframe>.
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // write a script into the <iframe> and steal its Array object.
      frames[frames.length - 1].document.write('<script>parent.RestmodArray = Array;<\/script>');

      // take the array object and move it to local context.
      arrayType = window.RestmodArray;
      delete window.RestmodArray;

      // remove iframe (need to test this a little more)
      document.body.removeChild(iframe);

    } else {
      arrayType = function() {  }; // a constructor cant be provided
      arrayType.prototype = [];
    }

    return arrayType;
  }

});
