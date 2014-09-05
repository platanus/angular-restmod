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
      var model = restmod.model('/api/bikes', {
        PACKER: 'default'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' } });
      expect(record.model).toEqual('Slash');
    });

    it('should extract collection using plural name by default', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default'
      });

      var many = model.$collection();
      many.$unwrap({ bikes: [{ model: 'Slash' }] });
      expect(many[0].model).toEqual('Slash');
    });

    it('should let the single and plural keys to be overriden separately', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_ROOT_SINGLE: 'one_bike',
        JSON_ROOT_MANY: 'many_bikes'
      });

      var record = model.$new(1);
      record.$unwrap({ one_bike: { model: 'Slash' } });
      expect(record.model).toEqual('Slash');

      var many = model.$collection();
      many.$unwrap({ many_bikes: [{ model: 'Slash' }] });
      expect(many[0].model).toEqual('Slash');
    });

    it('should let the single and plural keys to be overriden using jsonRoot', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_ROOT: 'the_root'
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
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, meta: { pages: 1 } });
      expect(record.$metadata).toBeDefined();
      expect(record.$metadata.pages).toEqual(1);
    });

    it('should extract metadata from specified property', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_META: 'extra'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, extra: { pages: 1 } });
      expect(record.$metadata).toBeDefined();
      expect(record.$metadata.pages).toEqual(1);
    });

    it('should not fail if property is not found', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' } });
      expect(record.$metadata).toBeUndefined();
    });

    it('should extract metadata from root if set to dot', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_META: '.'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, pages: 20 });
      expect(record.$metadata.bike).toBeUndefined();
      expect(record.$metadata.pages).toBeDefined();
    });

    it('should skip metadata extraction if set to false', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_META: false
      });

      var record = model.$new(1);
      record.$unwrap({ bike: { model: 'Slash' }, meta: { pages: 20 } });
      expect(record.$metadata).toBeUndefined();
    });

  });

  describe('processLinks', function() {

    beforeEach(function() {
      packerCache.feed = jasmine.createSpy();
    });

    it('should process links under "linked" by default', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, linked: { users: [] } });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
    });

    it('should process links under the property defined by used', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_LINKS: 'links'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, links: { users: [] } });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
    });

    it('should process links from root if set to dot', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_LINKS: '.'
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, users: [] });
      expect(packerCache.feed).toHaveBeenCalledWith('users', []);
      expect(packerCache.feed).not.toHaveBeenCalledWith('bike', []);
    });

    it('should not process links if set to false', function() {
      var model = restmod.model('/api/bikes', {
        PACKER: 'default',
        JSON_LINKS: false
      });

      var record = model.$new(1);
      record.$unwrap({ bike: {}, linked: { users: [] } });
      expect(packerCache.feed).not.toHaveBeenCalledWith('users', []);
    });

  });

});