'use strict';

RMModule.factory('SimplePacker', ['$inflector', '$filter', 'RMUtils', function($injector, $inflector, $filter, Utils) {

  function Packer(_model) {

  }

  Packer.prototype = {
    unpack: function(_unpackedRaw, _record) {

    },

    pack: function(_raw, _record) {

    },

    unpackMany: function(_unpackedRaw, _collection) {

    }
  };

  return Packer;

}]);