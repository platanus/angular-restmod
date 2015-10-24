'use strict';

describe('RMBuilderComputed', function() {

  var $injector, restmod, RMBuilderComputed, UserModel;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide) {
    $provide.factory('UserModel', function(restmod) {
      return restmod.model('/api/users', {
        firstName: ''
      });
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(['$injector',
    function(_$injector) {
      $injector = _$injector;
      restmod = $injector.get('restmod');
      RMBuilderComputed = $injector.get('RMBuilderComputed');
      UserModel = restmod.model('/api/users', {
        firstName: ''
      });
    }
  ]));

  describe('computed property', function() {

    describe('basics', function() {

      var DeviceModel, device;

      beforeEach(function() {
        DeviceModel = restmod.model('/api/devices', {
          vendor: 'default vendor',
          model: 'default model',
          fancyName: {
            computed: function() {
              return this.vendor + ': ' + this.model;
            }
          }
        });

        device = DeviceModel.$new().$decode({});
      });

      it('calculates using given function', function() {
        expect(device.fancyName).toEqual('default vendor: default model');
      });

      it('changes when model properties update', function() {
        device.vendor = 'Apple';
        device.model = 'iPhone';
        expect(device.fancyName).toEqual('Apple: iPhone');
      });

      it('should be masked by default',function() {
        var encoded = device.$encode();
        expect(encoded.fancyName).toBeUndefined();
      });

      it('should be listed in $each',function() {
        var test = {};
        device.$each(function(v, k) { test[k] = v; });
        expect(test.fancyName).toBeDefined();
      });

    });

    describe('with relations', function() {

      var DeviceModel, device;

      beforeEach(function() {

        DeviceModel = restmod.model('/api/devices', {
          vendor: '',
          model: '',
          user: {
            hasOne: 'UserModel'
          },
          ownedBy: {
            computed: function() {
              return this.user.firstName + '\'s ' + this.model;
            }
          }
        });
        device = DeviceModel.$new().$decode({
          vendor: 'Apple',
          model: 'Watch',
          user: {
            firstName: 'Johnny'
          }
        });
      });

      it('can access related models', function() {
        expect(device.ownedBy).toEqual('Johnny\'s Watch');
      });

    });

  });

});