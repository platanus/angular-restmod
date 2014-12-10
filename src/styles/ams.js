
'use strict';

angular.module('restmod').factory('AMSApi', ['restmod', 'inflector', function(restmod, inflector) {

	return restmod.mixin('DefaultPacker', { // include default packer extension
		$config: {
			style: 'AMS',
			primaryKey: 'id',
			jsonMeta: 'meta',
			jsonLinks: 'links'
		},

		$extend: {
			// special snakecase to camelcase renaming
			Model: {
				decodeName: inflector.camelize,
				encodeName: function(_v) { return inflector.parameterize(_v, '_'); },
				encodeUrlName: inflector.parameterize
			}
		}
	});

}]);