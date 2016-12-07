'use strict';

describe('Plugin: Cache Model', function () {

    beforeEach(module('restmod'));

    beforeEach(module(function ($provide, restmodProvider) {
        restmodProvider.pushModelBase('CacheModel');
        $provide.factory('Bike', function (restmod) {
            return restmod.model('/api/bikes');
        });
    }));

    describe('$search', function () {
        var bikesResponse = [{}, {}];
        beforeEach(inject(function ($httpBackend) {
            $httpBackend.expectGET('/api/bikes').respond(200, bikesResponse);

        }));

        it('should generate only one request when called consecutivelly', inject(function ($httpBackend, Bike) {
            var bikes = Bike.$collection();
            bikes.$fetch();
            bikes.$fetch();
            $httpBackend.flush();
        }));

        it('should return cached collection on second call', inject(function ($httpBackend, Bike) {
            var bikes1 = Bike.$search();
            $httpBackend.flush();
            var bikes2 = Bike.$search();
            expect(bikes1).toEqual(bikes2);
        }));

        it('should clear cache on eject', inject(function ($httpBackend, Bike) {
            Bike.$search();
            $httpBackend.flush();
            Bike.$eject();
            expect(Bike.$cache).toEqual({});
        }));

        it('should not return cached collection after eject', inject(function ($httpBackend, Bike) {
            var bikes1 = Bike.$search();
            $httpBackend.flush();
            Bike.$eject();
            var bikes2 = Bike.$search();
            $httpBackend.expectGET('/api/bikes').respond(200, bikesResponse);
            $httpBackend.flush();
            expect(bikes1).not.toEqual(bikes2);
        }));
    });

    describe('$find', function () {
        var bikesResponse = {
            id: 1
        };

        it('should generate only one request when called consecutivelly', inject(function ($httpBackend, Bike) {
            $httpBackend.expectGET('/api/bikes/1').respond(200, bikesResponse);
            Bike.$find(1);
            Bike.$find(1);
            $httpBackend.flush();
        }));

        it('should return cached record on second call', inject(function ($httpBackend, Bike) {
            $httpBackend.expectGET('/api/bikes/1').respond(200, bikesResponse);
            var bike1 = Bike.$find(1);
            $httpBackend.flush();
            var bike2 = Bike.$find(1);
            expect(bike1).toEqual(bike2);
        }));

        it('should return cached record from a $search', inject(function ($httpBackend, Bike) {
            $httpBackend.expectGET('/api/bikes').respond(200, [bikesResponse]);
            Bike.$search();
            $httpBackend.flush();
            var bike = Bike.$find(1);
            expect(bike.$pk).toEqual(1);
        }));
    });

    describe('$save', function () {
        it('should cache a saved record', inject(function ($httpBackend, $timeout, Bike) {
            $httpBackend.expectPOST('/api/bikes').respond(200, {
                id: 2
            });
            var spy = jasmine.createSpy();
            Bike.$create({
                id: 2
            });
            $httpBackend.flush();
            Bike.$find(2).$then(spy);
            $timeout.flush();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('$destroy', function () {
        var bike;
        beforeEach(inject(function($httpBackend, Bike) {
            //Cache record
            $httpBackend.expectGET('/api/bikes/1').respond(200, {
                id: 1
            });
            bike = Bike.$find(1);
            $httpBackend.flush();
            expect(Bike.$cache[bike.$url()]).toBeDefined();
        }));

        it('should remove destroyed record from cache', inject(function ($httpBackend, Bike) {
            //Destroy record
            $httpBackend.expectDELETE('/api/bikes/1').respond(200);
            bike.$destroy();
            $httpBackend.flush();
            expect(Bike.$cache[bike.$url()]).toBeUndefined();
        }));

        it('should remove destroyed record from collections', inject(function ($httpBackend, Bike) {
            $httpBackend.expectGET('/api/bikes').respond(200, [{id:1}, {id:2}]);
            Bike.$search();
            $httpBackend.flush();
            //Destroy record
            $httpBackend.expectDELETE('/api/bikes/1').respond(200);
            bike.$destroy();
            $httpBackend.flush();
            var bikes = Bike.$search();
            angular.forEach(bikes, function(record) {
                if(record.id === bike.id) throw Error('Record not removed from collection');
            });
        }));
    });
});
