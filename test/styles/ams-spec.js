'use strict';

describe('Style: AMS', function() {

  var bike;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('AMSApi');
    $provide.factory('Bike', function(restmod) {
      return restmod.model('/api/bikes', {
        user: { belongsTo: restmod.model('/api/users') },
        allUsers: { hasMany: restmod.model('/api/users') }
      });
    });
  }));

  beforeEach(inject(function(Bike) {
    bike = Bike.$new();
  }));

  it('should properly rename names on decode/encode', function() {
    bike.$decode({ 'rear_wheel': 'crossmax' });

    expect(bike.rearWheel).toBeDefined();
    expect(bike['rear_wheel']).not.toBeDefined();
    expect(bike.$encode()['rear_wheel']).toBeDefined();
    expect(bike.$encode().rearWheel).not.toBeDefined();
  });

  it('should use "id" as primary key', function() {
    bike.$decode({ id: 1 });
    expect(bike.$pk).toEqual(1);
  });

  it('should properly encode url names using lowercase and dashes', function() {
    expect(bike.$decode({ id: 1 }).allUsers.$url()).toEqual('/api/bikes/1/all-users');
  });

  it('should extract metadata from "meta" property', function() {
    bike.$unwrap({ bike: { id: 1 }, meta: { date: '2014-05-01'  } });
    expect(bike.$metadata).toBeDefined();
    expect(bike.$metadata.date).toBeDefined();
  });

  it('should extract links from "links" property', function() {
    bike.$unwrap({ bike: { id: 1, 'user_id': 1 }, links: { users: [ { id: 1, name: 'Pancho' } ] } });
    expect(bike.user).toBeDefined();
    expect(bike.user.name).toEqual('Pancho');
  });
});
