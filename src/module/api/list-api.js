'use strict';

RMModule.factory('RMListApi', [function() {

  /**
   * @class ListApi
   *
   * @description Common methods for Lists and Collections.
   */
  return {

    /**
     * @memberof ListApi#
     *
     * @description Generates a new list from this one.
     *
     * If called without arguments, the list is popupated with the same contents as this list.
     *
     * If there is a pending async operation on the host collection/list, then this method will
     * return an empty list and fill it when the async operation finishes. If you don't need the async behavior
     * then use `$type.list` directly to generate a new list.
     *
     * @param {function} _filter A filter function that should return the list contents as an array.
     * @return {ListApi} list
     */
    $asList: function(_filter) {
      var list = this.$type.list(),
          promise = this.$asPromise();

      // set the list initial promise to the resolution of the parent promise.
      list.$promise = promise.then(function(_this) {
        list.push.apply(list, _filter ? _filter(_this) : _this);
      });

      return list;
    }
  };

}]);