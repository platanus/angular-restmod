/**
 * API Bound Models for AngularJS
 * @version v0.1.1 - 2013-09-23
 * @link https://github.com/angular-platanus/angular-restmod
 * @author Ignacio Baixas <iobaixas@gmai.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
var $restmodMinErr = angular.noop; //minErr('$restmod');

/*
 * Usage - Model Definition:
 *
 *  module('module'.factory('PagedModel', ['$restModel', function($restModel) {
 *    return $restmodFactory()
 *      .on('before_collection_fetch', function() {
 *      });
 *      .classDefine('nextPage', function() {
 *      });
 *  }]));
 *
 *  module('module').factory('Book', ['$restModel', 'Author', Chapter', function($restModel, Author, Chapter) {
 *    return $restModel('api/books', {
 *      name: { primary: true },
 *      seen: { def: false, ignore: true },
 *      createdAt: { parse: 'rails-date' },
 *      chapters: { hasMany: Chapter },
 *      author: { hasOne: Author }
 *    }, function(_builder) {
 *      _builder.parse(function(_rawData, _localData) {
 *
 *      });
 *      _builder.render(function(_localData, _toData) {
 *
 *      });
 *      _builder.before_create(function() {
 *        // Do something with book before persisting!
 *        });
 *    }, PagedModel);
 *  }]);
 *
 * Usage - Services/Controllers:
 *
 *  module('module').service('Library', ['Author', 'Book', function(Book) {
 *
 *    ...
 *
 *    // Get all books with more than 100 pages
 *    books = Book.$search({ minPages: 100 })
 *
 *    // Get all chapters that belong to the Book with name 'angular-for-dummies'
 *    chapters = Author.mock('angular-for-dummies').chapters().fetch();
 *
 *    // Add a chapter to the same book
 *    chapter = Book.mock('angular-for-dummies').chapters().create({ title: 'Angular And IE7', pages: 30 });
 *
 *    // Modify a book's author (without fetching data)
 *    Book.mock('angular-for-dummies').author().update({ name: 'A. Dummy' });
 *
 *    // Modify a loaded book
 *    book.rating = 3;
 *    book.$save();
 *
 *    ...
 *
 *  }]);
 *
 */

angular.module('plRestmod', ['ng']).
  provider('$restmod', [function() {

  // Cache som angular stuff
  var forEach = angular.forEach,
    extend = angular.extend,
    isFunction = angular.isFunction,
    isObject = angular.isObject,
    isArray = angular.isArray,
    isString = angular.isString,
    arraySlice = Array.prototype.slice;

  // snake to camel -case function
  function toCamelCase(_key) {
    if (!isString(_key)) return _key;

    return _key.replace(/_[\w\d]/g, function (match, index, string) {
      return index === 0 ? match : string.charAt(index + 1).toUpperCase();
    });
  }

  // camel to snake -case function
  function toSnakeCase(_key) {
    if (!isString(_key)) return _key;

    // TODO match the latest logic from Active Support
    return _key.replace(/[A-Z]/g, function (match, index) {
      return index === 0 ? match : '_' + match.toLowerCase();
    });
  }

    /*
     * The RESTfull url builder factory class
     * TODO: Put this in a separate module.
     */

  var RestUrlBuilderFactory = function(_primary) {
    this.primary = _primary;
  };

  RestUrlBuilderFactory.prototype = {
    get: function(_baseUrl) {

      var defaults = {
        primary: this.primary
      };

      return {
        /**
         * called by builder when a primary: true attribute is found.
         */
        setPrimaryKey: function(_key) {
          defaults.primary = _key;
        },
        /**
         * called by collection whenever implicit key is used
         */
        inferKey: function(/* _context */) {
          return defaults.primary;
        },
        /**
         * called by buildCollection whenever a
         */
        queryUrl: function() {
          return _baseUrl;
        },
        /**
         * called by resource to resolve the resource's url
         */
        resourceUrl: function(_res) {
          var pk = _res[defaults.primary];
          if(pk === null || pk === undefined) return null;
          // use base url if provided
          if(_baseUrl) {
            return _baseUrl + '/' + pk;
          }
          // use collection url as base url
          if(_res.$context && _res.$context.$url) {
            return _res.$context.$url + '/' + pk;
          }
          return null;
        },
        /**
         * called by an unbound resource whenever save is called
         */
        createUrl: function(_res) {
          if(_res.$context && _res.$context.$url) return _res.$context.$url;
          return _baseUrl;
        },
        /**
         * called by a bound resource whenever save is called
         */
        updateUrl: function(_res) {
          return _res.$url;
        },
        /**
         * called by resource to build a relation url
         */
        nestedUrl: function(_res, _alias) {
          return _res.$url + '/' + _alias;
        }
      };
    }
  };

    /* Module Globals */
  var URL_BUILDER_FC = new RestUrlBuilderFactory('id'),
    TR_CACHE = {
      'rails-date': function(_string) {
        if(!_string) return _string;
        var m = _string.match(/(\d{2,4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if(m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10),
          parseInt(m[4],10), parseInt(m[5],10), parseInt(m[6],10));
        m = _string.match(/(\d{2,4})-(\d{2})-(\d{2})/);
        if(m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
        m = _string.match(/(\d{2,4})\/(\d{2})\/(\d{2})/);
        if(m) return new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
        return null;
      }
    };

  return {

    /**
     * Change the default url builder.
     *
     * The provided factory must implement a `get` method
     * that receives the resource baseUrl and returns an
     * url builder.
     *
     * TODO: describe url builder interface
     */
    setUrlBuilder: function(_urlBuilderFactory) {
      URL_BUILDER_FC = _urlBuilderFactory;
      return this;
    },
    /**
     * Register a new transformation function.
     * TODO: describe datatype interface
     */
    addTransformation: function(_name, _fun) {
      if(isObject(_name)) {
        extend(TR_CACHE, _name);
      } else {
        TR_CACHE[_name] = _fun;
      }
      return this;
    },
    /**
     * Registers a new datatype.
     * TODO: describe datatype interface
     */
    addDatatype: function(_name, _handler) {
      // TODO.
    },
    /**
     * The factory function, returns a new model builder factory.
     *
     * The model builder factory can be used to generate new model builder instances
     * given an url and a series of metadata objects, once generated, the model builder
     * can be used generate a new model.
     *
     * The `_url` parameter also accepts an url builder implementation.
     */
    $get: ['$http', '$q', function($http, $q) {

      return function modelBuilderFactory(_url/* , _meta */) {

        var urlBuilder = isObject(_url) ? _url : URL_BUILDER_FC.get(_url),
          ignored = {
            $url: true,
            $promise: true,
            $resolved: true,
            $error: true,
            $context: true,
            $relcache: true
          },
          defaults = {},
          parsers = {},
          renderers = {},
          callbacks = {};

        // runs all callbacks associated with a given hook.
        function callback(_hook, _ctx /*, args */) {
          var cbs = callbacks[_hook];
          if(cbs) {
            var i = 0, args = arraySlice.call(arguments, 2), cb;
            while((cb = cbs[i++])) {
              // execute callback
              cb.apply(_ctx, args);
            }
          }
        }

        /*
         * The Model Type definition
         */

        var Model = function(_init, _url, _context) {

          this.$resolved = true;
          this.$context = _context;
          this.$url = _url;

          var key, value;

          // apply defaults
          for(key in defaults) {
            if(defaults.hasOwnProperty(key)) {
              value = defaults[key];
              this[key] = (typeof value == 'function') ? value.apply(this) : value;
            }
          }

          if(_init) {
            // copy initial values (if given)
            for(key in _init) {
              if (_init.hasOwnProperty(key)) {
                this[key] = _init[key];
              }
            }

            if(!this.$url) this.$url = urlBuilder.resourceUrl(this);
          }
        };

        Model.prototype = extend({
          /**
           * Return true if resource is bound to an url.
           */
          $isBound: function() {
            return !!this.$url;
          },
          /**
           * Allows calling custom hooks, usefull when implementing custom actions.
           */
          $callback: function(_hook /*, args */) {
            callback(this, _hook, arraySlice.call(arguments, 1));
            return this;
          },
          /**
           * Feed raw data to this instance.
           *
           * @param {object} _raw Raw data to be fed
           * @return {Model} this
           */
          $feed: function(_raw) {
            // var original = {}; TODO: enable change queries
            var key, camelKey, parser, value;
            for(key in _raw) {
              if(_raw.hasOwnProperty(key)) {
                camelKey = toCamelCase(key);
                parser = parsers[camelKey];
                value = parser ? parser.call(this, _raw[key]) : _raw[key];

                // original[camelKey] = value;
                if(value !== undefined) this[camelKey] = value;
              }
            }

            callback('after_feed', this, _raw);

            // this.$original = original;
            if(!this.$url) this.$url = urlBuilder.resourceUrl(this);
            return this;
          },
          /**
           * Generate data to be sent to the server when creating/updating the resource.
           *
           * @return {Model} this
           */
          $render: function() {
            var key, snakeKey, renderer, result = {};
            for(key in this) {
              if(this.hasOwnProperty(key) && !ignored[key]) {
                snakeKey = toSnakeCase(key);
                renderer = renderers[snakeKey];
                result[snakeKey] = renderer ? renderer.call(this, this[key]) : this[key];
              }
            }

            callback('before_render', this, result);

            return result;
          },
          /**
           * Begin a server request for updated resource data.
           *
           * The request's promise is provided as the $promise property.
           *
           * @return {Model} this
           */
          $fetch: function(_success, _error) {
            // verify that instance has a bound url
            if(!this.$url) throw $restmodMinErr('notsup', 'Cannot fetch an unbound resource');
            return this.$send({ method: 'GET', url: this.$url, feed: true }, _success, _error);
          },
          /**
           * Begin a server request to create/update resource.
           *
           * The request's promise is provided as the $promise property.
           *
           * @return {Model} this
           */
          $save: function(_success, _error) {
            if(this.$isBound()) {
              // If bound, update
              callback('before_update', this);
              callback('before_save', this);
              this.$send({ method: 'PUT', url: this.$url, data: this.$render(), feed: true }, function(_response) {
                callback('after_update', this);
                callback('after_save', this);
                if(_success) _success(_response);
              }, _error);
            } else {
              // If not bound create.
              var url = urlBuilder.createUrl(this);
              if(!url) throw $restmodMinErr('notsup', 'Create not supported by this resource');
              callback('before_save', this);
              callback('before_create', this);
              this.$send({ method: 'POST', url: url, data: this.$render(), feed: true }, function(_response) {
                callback('after_create', this);
                callback('after_save', this);
                if(_success) _success(_response);
              }, _error);
            }
            return this;
          },
          /**
           * Begin a server request to destroy the resource.
           *
           * The request's promise is provided as the $promise property.
           *
           * @return {Model} this
           */
          $destroy: function(_success, _error) {
            callback('before_destroy', this);
            return this.$send({ method: 'DELETE', url: this.$getUrl() }, function(_response) {
              callback('after_destroy', this);
              if(_success) _success(_response);
            }, _error);
          },
          /**
           *
           *
           * @param  {[type]} _httpConfig [description]
           * @return {[type]} [description]
           */
          $send: function(_config, _success, _error) {
            var self = this;

            /* IDEA: comm queuing, never allow two simultaneous requests.
            if(this.$fetching) {
              this.$promise.then(function() {
                this.$send(_config, _success, _error);
              });
            }
            */

            this.$resolved = false;
            this.$error = false;
            this.$promise = $http(_config).then(function(_response) {

              // TODO: a response interceptor could add additional error states based on returned data,
              // this could allow for additional error state behaviours (for example, an interceptor
              // could watch for rails validation errors and store them in the model, then return false
              // to trigger a promise queue error).

              if(_config.feed) {
                // retrieve data and make sure is valid.
                var data = _response.data;
                if (!data || isArray(data)) {
                  throw $restmodMinErr('badresp', 'Expected object while feeding resource');
                }
                self.$feed(data);
              }

              self.$resolved = true;
              _response.resource = self;

              if(_success) _success(_response);

              return _response;

            }, function(_response) {

              self.$resolved = true;
              self.$error = true;

              if(_error) _error(_response);

              return $q.reject(_response);
            });

            return this;
          }
        });

        /* Collection type definition */

        /**
         * Collection constructor.
         *
         * @param {string} _url Bound url
         * @param {object} _params Fetch query parameteres
         * @param {array} _raw Initial raw data
         */
        Model.$collection = function(_url, _params, _raw) {

          var col = extend([], Model.collection_proto);

          col.$url = _url;
          col.$isCollection = true;
          col.$params = _params;

          if(isArray(_raw)) {
            forEach(_raw, col.$buildRaw, col);
            col.$resolved = true;
          } else {
            col.$resolved = false;
          }

          return col;
        };

        Model.collection_proto = {
          /**
           * Begin a server request to populate collection.
           *
           * TODO: support POST data queries (complex queries scenarios)
           *
           * @param {object} _params Additional request parameters, this parameters are not stored in collection.
           * @return {[type]} [description]
           */
          $fetch: function(_params, _success, _error) {

            if(isFunction(_params)) {
              _params = null;
              _success = _params;
              _error = _success;
            }

            var self = this,
              params = _params ? extend({}, this.$params, _params) : this.$params;

            // setup promise
            this.$resolved = false;
            this.$error = false;
            this.$promise = $http({ method: 'GET', url: this.$url, params: params }).then(function(_response) {

              // TODO: response interceptor

              var data = _response.data;
              if(!data || !isArray(data)) {
                throw $restmodMinErr('badcfg', 'Error in resource {0} configuration. Expected response to be array');
              }

              // reset collection data
              self.length = 0;
              forEach(data, self.$buildRaw, self);
              self.$resolved = true;

              // execute callback
              callback('after_collection_fetch', self, _response);

              _response.resource = self;

              if(_success) _success(_response);
              return _response;
            },
            function(_response) {
              self.$resolved = true;
              self.$error = true;

              if(_error) _error(_response);
              return $q.reject(_response);
            });

            return this;
          },
          $fetchMore: function(_params, _success, _error) {
            // TODO: same as fetch, does not reset array
          }

          /* TODO: $push, $remove, etc */
        };

        /*
           * The context prototype, shared by the Model type and collection instances.
         */
        var context_proto = {
          $build: function(_attr) {
            var obj = new Model(_attr, null, this);
            if(this.$isCollection) this.push(obj); // on collection, push new object
            return obj;
          },
          $buildRaw: function(_raw) {
            return this.$build(null).$feed(_raw);
          },
          $create: function(_attr, _success, _error) {
            return this.$build(_attr).$save(_success, _error);
          },
          $find: function(_key, _success, _error) {
            var init, keyName;
            if(!isObject(_key)) {
              init = {};
              keyName = urlBuilder.inferKey(this);
              if(!keyName) throw $restmodMinErr('notsup', 'Cannot infer find key, use explicit mode');
              init[keyName] = _key;
            } else init = _key;

            // dont use $build, find does not push into current collection.
            return (new Model(init, null, this)).$fetch(_success, _error);
          },
          $buildQuery: function(_params) {
            var url, params;
            if(this.$isCollection) {
              url = this.$url;
              params = extend({}, this.$params, _params);
            } else {
              url = urlBuilder.queryUrl();
              if(!url) throw $restmodMinErr('notsup', 'Collection not supported by resource root');
              params = _params;
            }
            return Model.$collection(url, params);
          },
          $search: function(_params, _success, _error) {
            return this.$buildQuery(_params).$fetch(_success, _error);
          }
        };

        /*
         * Model builder interface definition
         */

        // TODO: types -> parser/renderer combos.
        var Builder = {
          loadMeta: function(_meta) {
            if(_meta.$meta) {
              this.loadMeta(_meta.$meta);
            } else if(isArray(_meta)) {
              var i=0, meta;
              while((meta = _meta[i++])) {
                this.loadMeta(meta);
              }
            } else if(isFunction(_meta)) {
              _meta.call(this, this);
            } else {
              forEach(_meta, function(_def, _attr) {
                if(!isFunction(_def))
                {
                  if(_def.hasMany) this.hasMany(_attr, _def.hasMany, _def);
                  else if(_def.hasOne) this.hasOne(_attr, _def.hasOne, _def);
                  else {
                    // This is a regular attribute
                    if(_def.primary && urlBuilder.primary) this.attrPrimary(_attr);
                    if(_def.ignore) this.attrIgnore(_attr, true);
                    if(_def.init) this.attrDefault(_attr, _def.init);
                    if(_def.parse) this.attrParser(_attr, _def.parse, _def);
                    if(_def.render) this.attrRenderer(_attr, _def.render, _def);
                  }
                }
                else this.define(_attr, _def);
              }, this);
            }
          },
          /* */
          attrPrimary: function(_attr) {
            urlBuilder.addPrimaryKey(_attr);
            return this;
          },
          /* */
          attrIgnore: function(_attr, _ignore) {
            ignored[_attr] = _ignore;
            return this;
          },
          /* */
          attrDefault: function(_attr, _value) {
            defaults[_attr] = _value;
            return this;
          },
          /* Registers a model attributes */
          attrParser: function(_attr, _using, _opt) {
            if(isFunction(_using)) {
              parsers[_attr] = _using;
            } else {
              parsers[_attr] = function(_value) {
                // TODO: add other transformation sources?
                return TR_CACHE[_using](_value, _opt);
              };
            }
            return this;
          },
          attrRenderer: function(_attr, _using, _opt) {
            if(isFunction(_using)) {
              renderers[_attr] = _using;
            } else {
              renderers[_attr] = function(_value) {
                // add other transformation sources?
                return TR_CACHE[_using](_value, _opt);
              };
            }
            return this;
          },
          /* TODO: Registers an attribute type -> this adds both parser and serializer)
          attrType: function(_attr, _type, _opt) {

          },
          */
          /* Registers a model hasMany relation */
          hasMany: function(_name, _type, _opt) {

            Model.prototype[_name] = function(_resetOrRaw) {
              if(!this.$relcache) this.$relcache = {};
              var rel = this.$relcache[_name];
              if(!rel || _resetOrRaw) {
                // TODO: is the call to nestedUrl enough to support a wide range of api scenarios?
                var url = _opt.url || urlBuilder.nestedUrl(this, _opt.alias || _name, _type, _opt),
                  raw = isArray(_resetOrRaw) ? _resetOrRaw : null;

                this.$relcache[_name] = rel = _type.$collection(url, {}, raw);
              }
              return rel;
            };

            // TODO: maybe registering as parser should be optional.
            parsers[_name] = function(_raw) {
              this[_name](_raw);
            }

            return this;
          },
          /* Registers a model hasOne relation */
          hasOne: function(_name, _type, _opt) {

            Model.prototype[_name] = function(_resetOrRaw) {
              if(!this.$relcache) this.$relcache = {};
              var rel = this.$relcache[_name];
              if(!rel || _resetOrRaw) {
                var url = _opt.url || urlBuilder.nestedUrl(this, _opt.alias || _name, _type, _opt),
                  raw = isObject(_resetOrRaw) ? _resetOrRaw : null;

                this.$relcache[_name] = rel = _type.$buildRaw(raw, url, this);
              }
              return rel;
            };

            // TODO: maybe registering as parser should be optional.
            parsers[_name] = function(_raw) {
              this[_name](_raw);
            }

            return this;
          },
          /* Registers an instance method */
          define: function(_name, _fun) {
            if(isObject(_name)) {
              forEach(_name, function(_fun, _key) {
                Model.prototype[_key] = _fun;
              }, this);
            } else Model.prototype[_name] = _fun;
            return this;
          },
          /* Registers a class method */
          classDefine: function(_name, _fun) {
            if(isObject(_name)) {
              forEach(_name, function(_fun, _key) {
                this.classDefine(_key, _fun);
              }, this);
            } else context_proto[_name] = _fun;
            return this;
          },
          /* Event listening and shorcuts */
          on: function(_hook, _do) {
            var cbs = callbacks[_hook];
            if(!cbs) cbs = callbacks[_hook] = [];
            cbs.push(_do);
            return this;
          },
          beforeSave: function(_do) { return this.on('before_save', _do); },
          beforeCreate: function(_do) { return this.on('before_create', _do); },
          afterCreate: function(_do) { return this.on('after_create', _do); },
          beforeUpdate: function(_do) { return this.on('before_update', _do); },
          afterUpdate: function(_do) { return this.on('after_update', _do); },
          afterSave: function(_do) { return this.on('after_save', _do); },
          beforeDestroy: function(_do) { return this.on('before_destroy', _do); },
          afterDestroy: function(_do) { return this.on('after_destroy', _do); },
          afterFeed: function(_do) { return this.on('after_feed', _do); },
          beforeRender: function(_do) { return this.on('before_render', _do); }
        };

        // Finish building model type.
        Model.$meta = arraySlice.call(arguments, 1);
        Builder.loadMeta(Model.$meta);

        extend(Model, context_proto);
        extend(Model.collection_proto, context_proto);
        return Model;
      };
    }]
  };
}]);

