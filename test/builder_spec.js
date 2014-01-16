'use strict';

describe('Restmod builder:', function() {

  beforeEach(module('plRestmod'));

  var Bike;
  var $restmod, $httpBackend;
  beforeEach(inject(function($injector) {
    $restmod = $injector.get('$restmod');
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', '/api/bikes/1').respond(200, { 'dropper_seat': true });
  }));

  describe('disableRenaming', function() {

    beforeEach(function() {
      Bike = $restmod.model('/api/bikes', function() {
        this.disableRenaming();
      });
    });

    it('should disable renaming', function() {
      var bike = Bike.$find(1);
      $httpBackend.flush();
      expect(bike.dropperSeat).not.toBeDefined();
      expect(bike.dropper_seat).toBeDefined();
    });
  });

  describe('setNameDecoder', function() {

    beforeEach(function() {
      Bike = $restmod.model('/api/bikes', function() {
        this.setNameDecoder(function(_name) { return '_' + _name; });
      });
    });

    it('should change name decoding', function() {
      var bike = Bike.$find(1);
      $httpBackend.flush();
      expect(bike._dropper_seat).toBeDefined();
      expect(bike.dropper_seat).not.toBeDefined();
    });
  });

  describe('setNameEncoder', function() {

    beforeEach(function() {
      Bike = $restmod.model('/api/bikes', function() {
        this.setNameDecoder(function(_name) { return _name.substr(1); });
      });
    });

    it('should change name encoding', function() {
      // var bike = Bike.$build(1);
      // $httpBackend.flush();
      // expect(bike._noUndercore).toBeDefined();
    });
  });

  // describe('when building', function() {

  //   // TODO: test just the model builder, pass fake specs and test that are properly modified

  //   describe('using a base class', function() {

  //     // generate a dummy base  module
  //     beforeEach(module(function($provide) {
  //       $provide.factory('Base', function($restmod) {
  //         return $restmod.model(null, {
  //           coverSize: { init: 20 },
  //           getPages: function() {
  //             return this.pages || 0;
  //           }
  //         });
  //       });
  //     }));

  //     it('should inherit properties', inject(function($restmod, Base) {
  //       var book = $restmod.model('api/books', Base).$build();
  //       expect(book.getPages).toBeDefined();
  //       var otherBook = $restmod.model('api/books').$build();
  //       expect(otherBook.getPages).not.toBeDefined();
  //     }));

  //     it('should support overriding properties', inject(function($restmod, Base) {
  //       var book = $restmod.model('api/books', Base, { coverSize: { init: 30 } }).$build();
  //       expect(book.getPages).toBeDefined();
  //       expect(book.coverSize).toEqual(30);
  //     }));

  //     it('should support injector resolving', inject(function($restmod) {
  //       var book = $restmod.model('api/books', 'Base').$build();
  //       expect(book.getPages).toBeDefined();
  //     }));

  //   });

  // });

});

