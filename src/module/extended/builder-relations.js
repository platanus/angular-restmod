'use strict';

RMModule.factory('RMBuilderRelations', ['$injector', 'inflector', '$log', 'RMUtils', 'restmod', 'RMPackerCache', function($injector, inflector, $log, Utils, restmod, packerCache) {

  /**
   * @class RelationBuilderApi
   *
   * @description
   *
   * Builder DSL extension to build model relations
   *
   * Adds the following property modifiers:
   * * `hasMany` sets a one to many hierarchical relation under the attribute name, maps to {@link RelationBuilderApi#attrAsCollection}
   * * `hasOne` sets a one to one hierarchical relation under the attribute name, maps to {@link RelationBuilderApi#attrAsResource}
   * * `belongsTo` sets a one to one reference relation under the attribute name, maps to {@link RelationBuilderApi#attrAsReference}
   * * `belongsToMany` sets a one to many reference relation under the attribute name, maps to {@link RelationBuilderApi#attrAsReferenceToMany}
   *
   */
  var EXT = {
    /**
     * @memberof RelationBuilderApi#
     *
     * @description Registers a model **resources** relation
     *
     * @param {string}  _name Attribute name
     * @param {string|object} _model Other model, supports a model name or a direct reference.
     * @param {string} _url Partial url
     * @param {string} _source Inline resource alias (optional)
     * @param {string} _inverseOf Inverse property name (optional)
     * @return {BuilderApi} self
     */
    attrAsCollection: function(_attr, _model, _url, _source, _inverseOf) {

      this.attrDefault(_attr, function() {

        if(typeof _model === 'string') {
          _model = $injector.get(_model);

          if(_inverseOf) {
            var desc = _model.$$getDescription(_inverseOf);
            if(!desc || desc.relation !== 'belongs_to') {
              $log.warn('Must define an inverse belongsTo relation for inverseOf to work');
              _inverseOf = false; // disable the inverse if no inverse relation is found.
            }
          }
        }

        var self = this,
            scope = this.$buildScope(_model, _url || inflector.parameterize(_attr)),
            col = _model.$collection(null, scope);

        // TODO: there should be a way to modify scope behavior just for this relation,
        // since relation item scope IS the collection, then the collection should
        // be extended to provide a modified scope. For this an additional _extensions
        // parameters could be added to collection, then these 'extensions' are inherited
        // by child collections, the other alternative is to enable full property inheritance ...

        // set inverse property if required.
        if(_inverseOf) {
          col.$on('after-add', function(_obj) {
            _obj[_inverseOf] = self;
          });
        }

        return col;
      // simple support for inline data, TODO: maybe deprecate this.
      });

      if(_source || _url) this.attrMap(_attr, _source || _url);

      this.attrDecoder(_attr, function(_raw) {
            this[_attr].$reset().$decode(_raw);
          })
          .attrMask(_attr, Utils.WRITE_MASK)
          .attrMeta(_attr, { relation: 'has_many' });

      return this;
    },

    /**
     * @memberof RelationBuilderApi#
     *
     * @description Registers a model **resource** relation
     *
     * @param {string}  _name Attribute name
     * @param {string|object} _model Other model, supports a model name or a direct reference.
     * @param {string} _url Partial url (optional)
     * @param {string} _source Inline resource alias (optional)
     * @param {string} _inverseOf Inverse property name (optional)
     * @return {BuilderApi} self
     */
    attrAsResource: function(_attr, _model, _url, _source, _inverseOf) {

      this.attrDefault(_attr, function() {

        if(typeof _model === 'string') {
          _model = $injector.get(_model);

          if(_inverseOf) {
            var desc = _model.$$getDescription(_inverseOf);
            if(!desc || desc.relation !== 'belongs_to') {
              $log.warn('Must define an inverse belongsTo relation for inverseOf to work');
              _inverseOf = false; // disable the inverse if no inverse relation is found.
            }
          }
        }

        var scope = this.$buildScope(_model, _url || inflector.parameterize(_attr)),
            inst = _model.$new(null, scope);

        // TODO: provide a way to modify scope behavior just for this relation

        if(_inverseOf) {
          inst[_inverseOf] = this;
        }

        return inst;
      });

      if(_source || _url) this.attrMap(_attr, _source || _url);

      this.attrDecoder(_attr, function(_raw) {
            this[_attr].$decode(_raw);
          })
          .attrMask(_attr, Utils.WRITE_MASK)
          .attrMeta(_attr, { relation: 'has_one' });

      return this;
    },

    /**
     * @memberof RelationBuilderApi#
     *
     * @description Registers a model **reference** relation.
     *
     * A reference relation expects the host object to provide the primary key of the referenced object or the referenced object itself (including its key).
     *
     * For example, given the following resource structure with a foreign key:
     *
     * ```json
     * {
     *   user_id: 20
     * }
     * ```
     *
     * Or this other structure with inlined data:
     *
     * ```json
     * {
     *   user: {
     *     id: 30,
     *     name: 'Steve'
     *   }
     * }
     * ```
     *
     * You should define the following model:
     *
     * ```javascript
     * restmod.model({
     *   PATH: '/bikes',
     *   user: { belongsTo: 'User' } // works for both cases detailed above
     * })
     * ```
     *
     * The object generated by the relation is not scoped to the host object, but to it's base class instead (not like hasOne),
     * so the type should not be anonymous.
     *
     * Its also posible to override the **foreign key name**.
     *
     * When a object containing a belongsTo reference is encoded for a server request, only the primary key value is sent using the
     * same **foreign key name** that was using on decoding. (`user_id` in the above example).
     *
     * @param {string}  _name Attribute name
     * @param {string|object} _model Other model, supports a model name or a direct reference.
     * @param {string} _key foreign key property name (optional, defaults to _attr + '_id').
     * @param {bool} _prefetch if set to true, $fetch will be automatically called on relation object load.
     * @return {BuilderApi} self
     */
    attrAsReference: function(_attr, _model, _key, _prefetch) {

      this.attrDefault(_attr, null)
          .attrMask(_attr, Utils.WRITE_MASK)
          .attrMeta(_attr, { relation: 'belongs_to' });

      function loadModel() {
        if(typeof _model === 'string') {
          _model = $injector.get(_model);
        }
      }

      // TODO: the following code assumes that attribute is at root level! (when uses this[_attr] or this[_attr + 'Id'])

      // inline data handling
      this.attrDecoder(_attr, function(_raw) {
        if(_raw === null) return null;
        loadModel();
        if(!this[_attr] || this[_attr].$pk !== _model.$$inferKey(_raw)) {
          this[_attr] = _model.$buildRaw(_raw);
        } else {
          this[_attr].$decode(_raw);
        }
      });

      // foreign key handling
      if(_key !== false) {
        this.attrMap(_attr + 'Id', _key || '*', true) // set a forced mapping to always generate key
            .attrDecoder(_attr + 'Id', function(_value) {
              if(_value === undefined) return;
              if(!this[_attr] || this[_attr].$pk !== _value) {
                if(_value !== null && _value !== false) {
                  loadModel();
                  this[_attr] = packerCache.resolve(_model.$new(_value)); // resolve inmediatelly if cached
                  if(_prefetch) this[_attr].$fetch();
                } else {
                  this[_attr] = null;
                }
              }
            })
            .attrEncoder(_attr + 'Id', function() {
              return this[_attr] ? this[_attr].$pk : null;
            });
      }

      return this;
    },

    /**
     * @memberof RelationBuilderApi#
     *
     * @description Registers a model **reference** relation.
     *
     * A reference relation expects the host object to provide the primary key of the referenced objects or the referenced objects themselves (including its key).
     *
     * For example, given the following resource structure with a foreign key array:
     *
     * ```json
     * {
     *   users_ids: [20, 30]
     * }
     * ```
     *
     * Or this other structure with inlined data:
     *
     * ```json
     * {
     *   users: [{
     *     id: 20,
     *     name: 'Steve'
     *   },{
     *     id: 30,
     *     name: 'Pili'
     *   }]
     * }
     * ```
     *
     * You should define the following model:
     *
     * ```javascript
     * restmod.model({
     *   PATH: '/bikes',
     *   users: { belongsToMany: 'User' } // works for both cases detailed above
     * })
     * ```
     *
     * The object generated by the relation is not scoped to the host object, but to it's base class instead (unlike hasMany),
     * so the referenced type should not be anonymous.
     *
     * When a object containing a belongsToMany reference is encoded for a server request, only the primary key value is sent for each object.
     *
     * @param {string}  _name Attribute name
     * @param {string|object} _model Other model, supports a model name or a direct reference.
     * @param {string} _keys Server name for the property that holds the referenced keys in response and request.
     * @return {BuilderApi} self
     */
    attrAsReferenceToMany: function(_attr, _model, _keys) {

      this.attrDefault(_attr, function() { return []; })
          .attrMask(_attr, Utils.WRITE_MASK)
          .attrMeta(_attr, { relation: 'belongs_to_many' });

      // TODO: the following code assumes that attribute is at root level! (when uses this[_attr])

      function loadModel() {
        if(typeof _model === 'string') {
          _model = $injector.get(_model);
        }
      }

      function processInbound(_raw, _ref) {
        loadModel();
        _ref.length = 0;
        // TODO: reuse objects that do not change (compare $pks)
        for(var i = 0, l = _raw.length; i < l; i++) {
          if(typeof _raw[i] === 'object') {
            _ref.push(_model.$buildRaw(_raw[i]));
          } else {
            _ref.push(packerCache.resolve(_model.$new(_raw[i])));
          }
        }
      }

      // inline data handling
      this.attrDecoder(_attr, function(_raw) {
        // TODO: if _keys == _attr then inbound data will be processed twice!
        if(_raw) processInbound(_raw, this[_attr]);
      });

      // foreign key handling
      if(_keys !== false) {
        var attrIds = inflector.singularize(_attr) + 'Ids';
        this.attrMap(attrIds, _keys || '*', true)
            .attrDecoder(attrIds, function(_raw) {
              if(_raw) processInbound(_raw, this[_attr]);
            })
            .attrEncoder(attrIds, function() {
              var result = [], others = this[_attr];
              for(var i = 0, l = others.length; i < l; i++) {
                result.push(others[i].$pk);
              }
              return result;
            });
      }

      return this;
    }
  };

  return restmod.mixin(function() {
    this.extend('attrAsCollection', EXT.attrAsCollection, ['hasMany', 'path', 'source', 'inverseOf']) // TODO: rename source to map, but disable attrMap if map is used here...
        .extend('attrAsResource', EXT.attrAsResource, ['hasOne', 'path', 'source', 'inverseOf'])
        .extend('attrAsReference', EXT.attrAsReference, ['belongsTo', 'key', 'prefetch'])
        .extend('attrAsReferenceToMany', EXT.attrAsReferenceToMany, ['belongsToMany', 'keys']);
  });

}]);