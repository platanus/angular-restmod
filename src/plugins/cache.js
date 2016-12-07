'use strict';

angular.module('restmod').factory('CacheModel', ['restmod',
    function (restmod) {
        var mixin = restmod.mixin(function () {

            var cache = {};

            //
            // Listeners
            // ------------------------------------------------------------
            this.on('after-fetch-many', function (xhr) {
                cache[this.$url()] = this;
                angular.forEach(this, function (record) {
                    cache[record.$url()] = record;
                });
            });

            this.on('after-fetch', function (xhr) {
                cache[this.$url()] = this;
            });

            this.on('after-save', function (xhr) {
                cache[this.$url()] = this;
            });

            this.on('after-destroy', function (xhr) {
                delete cache[this.$url()];
            });

            //
            // Cache overrides
            // ------------------------------------------------------------
            this.classDefine('$fetch', function () {
                var cached = cache[this.$url()];
                if (cached) {
                    return cached;
                } else {
                    this.$super.apply(this, arguments);
                    cache[this.$url()] = this;
                    return this;
                }
            });

            this.classDefine('$find', function (_pk) {
                var cached = cache[this.$urlFor(_pk)];
                if (cached) {
                    return cached;
                } else {
                    var record = this.$super.apply(this, arguments);
                    cache[record.$url()] = record;
                    return record;
                }
            });

            this.classDefine('$eject', function () {
                angular.forEach(Object.keys(cache), function(key) {
                    delete cache[key];
                });
            });
            // set a pointer for cache
            this.classDefine('$cache', cache);
        });

        return mixin;
    }
]);
