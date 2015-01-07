'use strict';

/**
 * @class FastQ
 *
 * @description
 *
 * Synchronous promise implementation (partial)
 *
 */
RMModule.factory('RMFastQ', [function() {

  var isFunction = angular.isFunction,
      catchError = function(_error) {
        return this.then(null, _error);
      };

  function simpleQ(_val, _withError) {

    if(_val && isFunction(_val.then)) return wrappedQ(_val);

    return {
      simple: true,

      then: function(_success, _error) {
        return simpleQ(_withError ? _error(_val) : _success(_val));
      },
      'catch': catchError,
      'finally': function(_cb) {
        var result = _cb();
        if(result && isFunction(_val.then)) {
          // if finally returns a promise, then
          return wrappedQ(_val.then(
            function() { return _withError ? simpleQ(_val, true) : _val; },
            function() { return _withError ? simpleQ(_val, true) : _val; })
          );
        } else {
          return this;
        }
      }
    };
  }

  function wrappedQ(_promise) {
    if(_promise.simple) return _promise;

    var simple;

    // when resolved, make $q a simpleQ
    _promise.then(function(_val) {
      simple = simpleQ(_val);
    }, function(_val) {
      simple = simpleQ(_val, true);
    });

    return {
      then: function(_success, _error) {
        return simple ?
          simple.then(_success, _error) :
          wrappedQ(_promise.then(_success, _error));
      },
      'catch': catchError,
      'finally': function(_cb) {
        return simple ?
          simple['finally'](_cb) :
          wrappedQ(_promise['finally'](_cb));
      }
    };
  }

  return {
    reject: function(_reason) {
      return simpleQ(_reason, true);
    },

    // non waiting promise, if resolved executes immediately
    when: function(_val) {
      return simpleQ(_val, false);
    },

    wrap: wrappedQ
  };
}]);
