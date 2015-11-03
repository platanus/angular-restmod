/**
 * @mixin DirtyModel
 *
 * @description Adds the `$dirty` method to a model`s instances.
 */

'use strict';

angular.module('restmod').factory('DirtyModel', ['restmod', function(restmod) {

  function copyOriginalData(_this) {
    var original = _this.$cmStatus = {};
    _this.$each(function(_value, _prop) {
      original[_prop] = _value;
    });
  }

  function updateOriginalData(_this, _data) {
    var original = _this.$cmStatus;
    for(var _prop in _data) {
      original[_prop]  = _data[_prop];
    }
  }

  return restmod.mixin(function() {
    this.on('after-init', function() {
          copyOriginalData(this);
        })
        .on('after-feed', function(_data) {
          updateOriginalData(this, _data);
        })
        /**
         * @method $dirty
         * @memberof DirtyModel#
         *
         * @description Retrieves the model changes
         *
         * Property changes are determined using the strict equality operator.
         *
         * IDEA: allow changing the equality function per attribute.
         *
         * If given a property name, this method will return true if property has changed
         * or false if it has not.
         *
         * Called without arguments, this method will return a list of changed property names.
         *
         * @param {string} _prop Property to query
         * @return {boolean|array} Property state or array of changed properties
         */
        .define('$dirty', function(_prop) {
          var self = this, original = self.$cmStatus;
          if(_prop) {
            return (!original[_prop] || original[_prop] !== self[_prop]);
          } else {
            var changes = [];
            self.$each(function(_value, _key) {
              if(!original[_key] || original[_key] !== self[_key]) {
                changes.push(_key);
              }
            });
            return changes;
          }
        })
        /**
         * @method $restore
         * @memberof DirtyModel#
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
            var original = this.$cmStatus;
            if(_prop) {
              this[_prop] = original[_prop];
            } else {
              for(var key in original) {
                if(original.hasOwnProperty(key)) this[key] = original[key];
              }
            }
          });
        });
  });
}]);
