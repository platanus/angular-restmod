'use strict';

/**
 * @class Utils
 *
 * @description
 *
 * Various utilities used across the library.
 *
 */
RMModule.factory('RMUtils', ['$log', function($log) {

  // determine browser support for object prototype changing
  var IFRAME_REF = [];
  var PROTO_SETTER = (function() {
    var Test = function() {};
    if(Object.setPrototypeOf) {
      return function(_target, _proto) {
        Object.setPrototypeOf(_target, _proto); // Not sure about supporting this...
      };
    } else if((new Test).__proto__ === Test.prototype) {
      return function(_target, _proto) {
        _target.__proto__ = _proto;
      };
    }
  })();

  var Utils = {

    // Ignore Masks
    CREATE_MASK: 'C',
    UPDATE_MASK: 'U',
    READ_MASK: 'R',
    WRITE_MASK: 'CU',
    FULL_MASK: 'CRU',

    /**
     * @memberof Utils
     *
     * @description
     *
     * Formats a string
     *
     * @param  {string} _str String to format
     * @param  {array} _args String arguments
     * @return {string} Formated string
     */
    format: function(_str, _args) {
      for(var i = 0; _args && i < _args.length; i++) {
        _str = _str.replace('$' + (i+1), _args[i]);
      }
      return _str;
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Test for a condition to be met, if not an exception is thrown.
     *
     * @param  {boolean} _condition Condition to assert
     * @param  {string} _msg Error message
     */
    assert: function(_condition, _msg /*, params */) {
      if(!_condition) {
        var params = Array.prototype.slice.call(arguments, 2);
        _msg = Utils.format(_msg, params);
        $log.error(_msg); // log error message
        throw new Error(_msg);
      }
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Simple url joining, returns null if _head or _tail is null.
     *
     * @param  {string} _head Url prefix
     * @param  {string} _tail Url suffix
     * @return {string} Resulting url
     */
    joinUrl: function(_head, _tail) {
      if(!_head || !_tail) return null;
      return (_head+'').replace(/\/$/, '') + '/' + (_tail+'').replace(/^\//, '');
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Cleans trailing slashes from an url
     *
     * @param  {string} _url Url to clean
     * @return {string} Resulting url
     */
    cleanUrl: function(_url) {
      return _url ? _url.replace(/\/$/, '') : _url;
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Chains to filtering functions together
     *
     * @param  {function} _first original function
     * @param  {function} _fun   function to call on the original function result
     * @return {mixed} value returned by the last function call
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
     * @description
     *
     * Override a property value, making overriden function available as this.$super
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
     * @description
     *
     * Finds the location of a matching object in an array.
     *
     * @param {array} _array target array
     * @param {function} _accept matching function
     * @param {integer} _fromIdx Index from which to start searching, defaults to 0
     * @return {number} Object index or -1 if not found
     */
    indexWhere: function(_array, _accept, _fromIdx) {
      for(var i = _fromIdx || 0, l = _array.length; i < l; i++) {
        if(_accept(_array[i])) return i;
      }
      return -1;
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Extend an object using `Utils.override` instead of just replacing the functions.
     *
     * @param  {object} _target Object to be extended
     * @param  {object} _other  Source object
     */
    extendOverriden: function(_target) {
      for(var i = 1; i < arguments.length; i++) {
        var other = arguments[i];
        for(var key in other) {
          if(other.hasOwnProperty(key)) {
            _target[key] = _target[key] && typeof _target[key] === 'function' ? Utils.override(_target[key], other[key]) : other[key];
          }
        }
      }

      return _target;
    },

    /**
     * @memberof Utils
     *
     * @description
     *
     * Generates a new array type, handles platform specifics (bag-O-hacks)
     *
     * @return {object} Independent array type.
     */
    buildArrayType: function(_forceIframe) {

      var arrayType;

      if(PROTO_SETTER && !_forceIframe) {

        // Use object prototype override technique
        //
        // Very nice array subclassing analysis: http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#why_subclass_an_array
        //

        var SubArray = function() {
          var arr = [ ];
          arr.push.apply(arr, arguments);
          PROTO_SETTER(arr, SubArray.prototype);
          return arr;
        };

        SubArray.prototype = [];
        SubArray.prototype.last = function() {
          return this[this.length - 1];
        };

        arrayType = SubArray;

      } else  {

        // Use iframe hijack technique for IE11<
        //
        // Based on the awesome blog post of Dean Edwards: http://dean.edwards.name/weblog/2006/11/hooray/
        //

        // create a hidden <iframe>.
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.height = 0;
        iframe.width = 0;
        iframe.border = 0;

        document.body.appendChild(iframe);

        // write a script into the <iframe> and steal its Array object.
        window.frames[window.frames.length - 1].document.write('<script>parent.RestmodArray = Array;<\/script>');

        // take the array object and move it to local context.
        arrayType = window.RestmodArray;
        delete window.RestmodArray;

        // copy this context Array's extensions to new array type (could be a little slow...)
        for(var key in Array.prototype) {
          if(typeof Array.prototype[key] === 'function' && !arrayType.prototype[key]) {
            arrayType.prototype[key] = Array.prototype[key];
          }
        }

        // remove iframe from DOM.
        //
        // Even though MS says that removing iframe from DOM will release it's related structures (http://msdn.microsoft.com/en-us/library/ie/gg622929(v=vs.85).aspx),
        // actually keeping it referenced has proven to be enough to keep the structures alive. (that includes our array type)
        //
        document.body.removeChild(iframe);
        IFRAME_REF.push(iframe); // keep iframe reference!
      }

      return arrayType;
    }
  };

  return Utils;
}]);
