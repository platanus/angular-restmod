/**
 * @mixin NestedDirtyModel
 *
 * @description Adds the `$dirty` method to a model`s instances. Acts in the same way as the DirtyModel plugin, but supports nested objects.
 */

'use strict';

angular.module('restmod').factory('NestedDirtyModel', ['restmod', function(restmod) {

  function copyOriginalData(_from) {
    var Model = _from.$type, result = {};

    _from.$each(function(value, key) {
      var meta = Model.$$getDescription(key);
      if(!meta || !meta.relation) {
        // TODO: skip masked properties too?
        result[key] = angular.copy(value);
      }
    });

    return result;
  }

  function hasValueChanged(_model, _original, _keys, _comparator) {
    var isDirty = false,
        prop = _keys.pop(),
        propChain = buildPropChain(_model, _original, _keys);

    _model = propChain[0];
    _original = propChain[1];

    if(_original.hasOwnProperty(prop)) {
      if(_comparator && typeof _comparator === 'function') {
        isDirty = !!_comparator(_model[prop], _original[prop]);
      } else {
        isDirty = !angular.equals(_model[prop], _original[prop]);
      }
    }

    return isDirty;
  }

  function findChangedValues(_model, _original, _keys, _comparator) {
    var changes = [], childChanges;

    if(_original) {
      for(var key in _original) {
        if(_original.hasOwnProperty(key)) {
          // isObject returns true if value is an array
          if(angular.isObject(_original[key]) && !angular.isArray(_original[key])) {
            childChanges = findChangedValues(_model[key], _original[key], _keys.concat([key]), _comparator);
            changes.push.apply(changes, childChanges);
          } else {
            if(hasValueChanged(_model, _original, [key], _comparator)) {
              changes.push(_keys.concat([key]).join('.'));
            }
          }
        }
      }
    }

    return changes;
  }

  // Helper function to build a property chain from a set of keys
  function buildPropChain(_model, _original, _keys) {
    var key;

    while(_keys.length) {
      key = _keys.shift();
      _model = _model[key];
      _original = _original[key];
    }

    return [_model, _original];
  }

  return restmod.mixin(function() {
    this.on('after-feed', function() {
          // store original information in a model's special property
          this.$cmStatus = copyOriginalData(this);
        })
        /**
         * @method $dirty
         * @memberof NestedDirtyModel#
         *
         * @description Retrieves the model changes
         *
         * Property changes are determined using the strict equality operator if no comparator
         * function is provided.
         *
         * If given a property name, this method will return true if property has changed
         * or false if it has not.
         *
         * The comparator function can be passed either as the first or second parameter.
         * If first, this function will compare all properties using the comparator.
         *
         * Called without arguments, this method will return a list of changed property names.
         *
         * @param {string|function} _prop Property to query or function to compare all properties
         * @param {function} _comparator Function to compare property
         * @return {boolean|array} Property state or array of changed properties
         */
        .define('$dirty', function(_prop, _comparator) {
          var original = this.$cmStatus;

          if(_prop && !angular.isFunction(_prop)) {
            return hasValueChanged(this, original, _prop.split('.'), _comparator);
          } else {
            if(angular.isFunction(_prop)) _comparator = _prop;
            return findChangedValues(this, original, [], _comparator);
          }
        })
        /**
         * @method $restore
         * @memberof NestedDirtyModel#
         *
         * @description Restores the model's last fetched values.
         *
         * Usage:
         *
         * ```javascript
         * bike = Bike.$create({ brand: 'Trek' });
         * // later on...
         * bike.brand = 'Giant';
         * bike.$restore();
         *
         * console.log(bike.brand); // outputs 'Trek'
         * ```
         *
         * @param {string} _prop If provided, only _prop is restored
         * @return {Model} self
         */
        .define('$restore', function(_prop) {
          return this.$action(function() {
            var original = this.$cmStatus,
                model = this;

            if(_prop) {
              var keys = _prop.split('.'), propChain;

              _prop = keys.pop();
              propChain = buildPropChain(model, original, keys);

              propChain[0][_prop] = angular.copy(propChain[1][_prop]);
            } else {
              for(var key in original) {
                if(original.hasOwnProperty(key)) model[key] = angular.copy(original[key]);
              }
            }
          });
        });
  });
}]);