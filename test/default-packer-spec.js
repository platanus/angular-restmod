'use strict';

describe('DefaultPacker', function() {

  var restmod, packerCache, User, Part;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');
    packerCache = $injector.get('RMPackerCache');
    User = restmod.model('/api/users');
    Part = restmod.model('/api/parts');
  }));

  describe('extractRoot', function() {

    it('should extract single resource using singular name by default', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker');

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' } });
      expect(record.model).toEqual('Slash');
    });

    it('should extract collection using plural name by default', function() {
      var model = restmod.model().mix({
        $config: { name: 'bike' }
      }).mix('DefaultPacker');

      var many = model.$collection();
      many.$unwrap({ bikes: [{ model: 'Slash' }] });
      expect(many[0].model).toEqual('Slash');
    });

    it('should let the single and plural keys to be overriden separately', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: {
          jsonRootSingle: 'one_bike',
          jsonRootMany: 'many_bikes'
        }
      });

      var record = model.$new(1);
      record.$unwrap({ one_bike: { model: 'Slash' } });
      expect(record.model).toEqual('Slash');

      var many = model.$collection();
      many.$unwrap({ many_bikes: [{ model: 'Slash' }] });
      expect(many[0].model).toEqual('Slash');
    });

    it('should let the single and plural keys to be overriden using jsonRoot', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonRoot: 'the_root' }
      });

      var record = model.$new(1);
      record.$unwrap({ the_root: { model: 'Slash' } });
      expect(record.model).toEqual('Slash');

      var many = model.$collection();
      many.$unwrap({ the_root: [{ model: 'Slash' }] });
      expect(many[0].model).toEqual('Slash');
    });

  });

  describe('processMeta', function() {

    it('should extract metadata from meta property by default', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker');

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, meta: { pages: 1 } });
      expect(record.$metadata).toBeDefined();
      expect(record.$metadata.pages).toEqual(1);
    });

    it('should extract metadata from specified property', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: 'extra' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, extra: { pages: 1 } });
      expect(record.$metadata).toBeDefined();
      expect(record.$metadata.pages).toEqual(1);
    });

    it('should not fail if property is not found', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker');

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' } });
      expect(record.$metadata).toEqual({});
    });

    it('should extract metadata from root if set to dot', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: '.' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, pages: 20 });
      expect(record.$metadata.pages).toBeDefined();
    });

    it('should skip links and name if set to dot', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: '.' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, included: { users: [] }, pages: 20 });
      expect(record.$metadata.bike).toBeUndefined();
      expect(record.$metadata.linked).toBeUndefined();

      var model2 = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: '.', jsonLinks: ['users', 'parts'] }
      });

      record = model2.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, users: [], parts: [], pages: 20 });
      expect(record.$metadata.bike).toBeUndefined();
      expect(record.$metadata.users).toBeUndefined();
      expect(record.$metadata.parts).toBeUndefined();
    });

    it('should skip metadata extraction if set to false', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: false }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, meta: { pages: 20 } });
      expect(record.$metadata).toBeUndefined();
    });

    it('should extract only properties specified in array if array is given', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonMeta: ['pages', 'status'] }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, pages: 20, status: 'success', pageSz: 20 });
      expect(record.$metadata.pages).toBeDefined();
      expect(record.$metadata.status).toBeDefined();
      expect(record.$metadata.pageSz).toBeUndefined();
    });

  });

  describe('processLinks', function() {

    beforeEach(function() {
      packerCache.feed = jasmine.createSpy();
    });

    it('should process links under "linked" by default', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker');

      var record = model.$new(1);
      record.$unwrap({ bike: {}, included: { users: [] } });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
    });

    it('should process links under the property defined by used', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: 'links' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, links: { users: [] } });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
    });

    it('should process links from root if set to dot', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: '.' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, users: [] });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
      expect(packerCache.feed).not.toHaveBeenCalledWith('bike', []);
    });

    it('should not process links if set to false', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: false }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, included: { users: [] } });
      expect(packerCache.feed).not.toHaveBeenCalledWith('users', []);
    });

    it('should skip metadata and name if set to dot', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: '.' }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, users: [], meta: {} });
      expect(packerCache.feed).not.toHaveBeenCalledWith('meta', {});

      var model2 = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: '.', jsonMeta: ['pages'] }
      });

      record = model2.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, users: [], parts: [], pages: 20 });
      expect(packerCache.feed).not.toHaveBeenCalledWith('pages', 20);
    });

    it('should extract only links specified in array if array is given', function() {
      var model = restmod.model('/api/bikes').mix('DefaultPacker', {
        $config: { jsonLinks: ['users', 'parts'] }
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, users: [], parts: [], rides: [] });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
      expect(packerCache.feed).toHaveBeenCalledWith('parts', []);
      expect(packerCache.feed).not.toHaveBeenCalledWith('rides', []);
    });

  });

});