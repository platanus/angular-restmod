'use strict';

describe('Restmod REST url building:', function() {

  var builderFactory,
      dummyObj = { $context: null, $partial: null, id: 20, name: 'a-dummy' };

  beforeEach(module('plRestmod'));

  describe('factory options', function() {

    describe('extension', function() {

      beforeEach(inject(function(restUrlBuilderFactory) {
        builderFactory = restUrlBuilderFactory({ extension: '.json' });
      }));

      it('should add the extension to all generated urls', function() {
        var builder = builderFactory('/api/test/');
        expect(builder.resourceUrl(dummyObj)).toBe('/api/test/20.json');
        expect(builder.collectionUrl(dummyObj)).toBe('/api/test.json');
        expect(builder.collectionUrl(dummyObj, { extension: 'xml' })).toBe('/api/test.xml');
      });
    });

    describe('primary', function() {

      beforeEach(inject(function(restUrlBuilderFactory) {
        builderFactory = restUrlBuilderFactory({ primary: 'name' });
      }));

      it('should change the default primary key', function() {
        var builder = builderFactory('/api/test/');
        expect(builder.resourceUrl(dummyObj)).toBe('/api/test/a-dummy');
      });
    });
  });

  // TODO: describe nesting behavior
});