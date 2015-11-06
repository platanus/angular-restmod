/**
 * @mixin SaveInline
 *
 * @description Adds support for rails style nested relations
 *
 * Usage: TODO
 *
 * ```javascript
 * ```
 */

'use strict';

angular.module('restmod').factory('restmod.SaveInline', ['restmod', 'RMUtils', function(restmod, Utils) {

  var onRemove = function(_obj) {
    if(!_obj.$isNew()) this.$$removed.push(_obj);
  };

  var EXT = {
    attrSaveInline: function(_attr, _inlineMode, _inlineKey) {

      // TODO: make sure attr is a hasMany

      var dummyKey = '$' + (_inlineKey || ((_path || _source || _model.encodeUrlName(_attr)) + 'Attributes') ),
          targetKey = _key || '*';

      if(_inlineMode === 'changes')
      {
        this.on('after-init', function() {
          // keep track of removed items
          this[_attr].$$removed = [];
          this[_attr].$on('after-remove', onRemove);
        });

        this.on('after-save', function() {
          this[_attr].$$removed = [];
        });
      }

      this
      .attrMap(_attr, dummyKey, true)
      .attrEncoder(dummyKey, function(_value, _mask) {
        if(_inlineMode === 'all') {
          return this[_attr].$encode(_mask);
        } else {
          var rawAttr = [], col = this[_attr], i, l, rawRec;

          for(i = 0, l = col.length; i < l; i++) {
            if(col[i].$isNew()) {
              rawAttr.push(col[i].$encode(_mask));
            } else if(col[i].$dirty && col[i].$dirty().length > 0) {
              // dirty model integration
              rawAttr.push(col[i].$encode(_mask));
            }
          }

          for(i = 0, l = col.$$removed.length; i < l; i++) {
            rawRec = col.$$removed[i].$encode(_mask); // TODO: only provide pk
            rawRec._destroy = true;
            rawAttr.push(rawRec);
          }

          return rawAttr;
        }
      })
      .attrMask(dummyKey, function() {
        if(_inlineMode === 'create') {
          return Utils.READ_MASK + Utils.UPDATE_MASK;
        } else {
          return Utils.READ_MASK;
        }
      });
    }
  };

  return restmod.mixin(function() {
    this.extend('attrSaveInline', EXT.attrSaveInline, ['saveInline', 'path', 'source', 'inlineKey']);
  });
}]);