// 'use strict';

// describe('Plugin: Save Inline', function() {

//   beforeEach(module('restmod'));

//   beforeEach(module(function($provide, restmodProvider) {
//     restmodProvider.rebase('restmod.SaveInline');

//     $provide.factory('Bike', function(restmod) {
//       return restmod.model('/api/bikes').mix({
//         parts: { hasMany: 'Part', saveInline: true }
//       });
//     });

//     $provide.factory('Part', function(restmod) {
//       return restmod.model('/api/parts');
//     });
//   }));

//   describe('when enconding a new owner record', function() {

//     var bike;

//     beforeEach(inject(function(Bike) {
//       bike = Bike.$build({ brand: 'trek' });
//     }));

//     it('should send along the encoded child records', function() {

//       bike.parts.$build({ name: 'wheel' });
//       bike.parts.$build({ name: 'tire' });

//       expect(bike.$encode()).toEqual({
//         brand: 'trek',
//         partsAttributes: [
//           { name: 'wheel' },
//           { name: 'tire' }
//         ]
//       });

//     });

//   });

//   describe('when enconding an existing owner record', function() {

//     var bike;

//     beforeEach(inject(function(Bike) {
//       bike = Bike.$buildRaw({
//         id: 1,
//         brand: 'trek',
//         parts: [
//           { id: 1, name: 'handlebars' },
//           { id: 2, name: 'grips' },
//           { id: 3, name: 'brakes' }
//         ]
//       });
//     }));

//     it('should only send along new and removed records', function() {
//       bike.parts.$remove(bike.parts[0]);
//       bike.parts.$build({ name: 'wheel' });

//       expect(bike.$encode()).toEqual({
//         id: 1,
//         brand: 'trek',
//         partsAttributes: [
//           { id: 1, name: 'handlebars', _destroy: true },
//           { name: 'wheel' }
//         ]
//       });
//     });

//   });

// });
