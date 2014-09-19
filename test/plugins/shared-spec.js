'use strict';

describe('Plugin: Shared Model', function() {

  var Bike;

  beforeEach(module('restmod'));

  beforeEach(inject(function(restmod) {
    Bike = restmod.model('/api/bikes', 'SharedModel');
  }));

  it('should cache instances on $new and provide them on $new', function() {
    var bike = Bike.$new(2);
    var bike2 = Bike.$new(2);
    var bike3 = Bike.$new(3);
    var bike4 = Bike.$collection().$new(2);

    expect(bike2).toBe(bike);
    expect(bike3).not.toBe(bike);
    expect(bike4).toBe(bike);
  });

  it('should cache instances on $decode and provide them on $new', function() {
    var bike = Bike.$new().$decode({ id: 2 });
    var bike2 = Bike.$new(2);

    expect(bike2).toBe(bike);
  });
});
