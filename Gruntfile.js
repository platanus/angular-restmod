'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('bower.json'),
    meta: {
      banner: '/**\n' +
      ' * <%= pkg.description %>\n' +
      ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * @link <%= pkg.homepage %>\n' +
      ' * @author <%= pkg.authors.join(", ") %>\n' +
      ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
      ' */\n'
    },
    bower: {
      install: {}
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>\n(function(angular, undefined) {\n\'use strict\';\n',
        footer: '})(angular);',
        process: function(src, filepath) {
          return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.js': [
            'src/module.js',
            'src/module/**/*.js'
          ],
          'dist/<%= pkg.name %>-bundle.js': [
            'bower_components/angular-inflector/dist/angular-inflector.js',
            'src/module.js',
            'src/module/**/*.js'
          ],
          'dist/plugins/debounced.js': 'src/plugins/debounced.js',
          'dist/plugins/dirty.js': 'src/plugins/dirty.js',
          'dist/plugins/paged.js': 'src/plugins/paged.js',
          'dist/plugins/find-many.js': 'src/plugins/find-many.js',
          'dist/plugins/preload.js': 'src/plugins/preload.js',
          'dist/plugins/nested-dirty.js': 'src/plugins/nested-dirty.js',
          'dist/styles/ams.js': 'src/styles/ams.js'
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js',
          'dist/<%= pkg.name %>-bundle.min.js': 'dist/<%= pkg.name %>-bundle.js',
          'dist/plugins/debounced.min.js': 'dist/plugins/debounced.js',
          'dist/plugins/dirty.min.js': 'dist/plugins/dirty.js',
          'dist/plugins/paged.min.js': 'dist/plugins/paged.js',
          'dist/plugins/find-many.min.js': 'dist/plugins/find-many.js',
          'dist/plugins/preload.min.js': 'dist/plugins/preload.js',
          'dist/plugins/nested-dirty.min.js': 'dist/plugins/nested-dirty.js',
          'dist/styles/ams.min.js': 'dist/styles/ams.js'
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        curly: false,
        browser: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        expr: true,
        node: true,
        globals: {
          exports: true,
          angular: false,
          $: false
        }
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      build: {
        singleRun: true,
        autoWatch: false
      },
      dev: {
        singleRun: false,
        autoWatch: true
      },
      sauce: {
        configFile: 'karma-sauce.conf.js',
        singleRun: true
      }
    },
    jsdoc : {
        dist : {
          src: ['src/*.js', 'src/**/*.js', 'docs/index.md'],
          options: {
            tutorials: 'docs/guides',
            destination: '.docs',
            configure: 'jsdoc.json'
          }
        }
    },
    'gh-pages': {
      options: {
        base: '.docs'
      },
      src: ['**']
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },
    gitcommit: {
      bump: {
        options: {
          message: "<%= pkg.version %>",
          noStatus: true
        },
        files: {
          src: [
            'bower.json',
            'package.json',
            'CHANGELOG.md',
            'dist/**/*'
            ]
        }
      }
    },
    gittag: {
      bump: {
        options: {
          tag: "v<%= pkg.version %>",
          noStatus: true
        }
      }
    },
    gitpush: {
      bump: {
        options: {
          branch: 'master',
          tags: true
        }
      }
    },
    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: ['build'],
        // if the workspace is dirty, abort publishing (to avoid publishing local changes)
        abortIfDirty: true,
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jsdoc'); // use jsdocs for now, until docular is ready
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-npm');

  // Default task
  grunt.registerTask('default', ['build']);

  // Build task
  grunt.registerTask('build', ['bower', 'karma:build', 'concat', 'uglify']);

  // Publish task
  grunt.registerTask('pub', ['jsdoc', 'gh-pages']);

  // Test task
  grunt.registerTask('test', ['karma:build']);

  // CI task
  grunt.registerTask('ci', ['karma:dev']);

  // Release Task
  grunt.registerTask('release', ['bump', 'changelog', 'build']);

  // Publish Task
  grunt.registerTask('publish', ['gitcommit:bump', 'gittag:bump', 'gitpush:bump', 'npm-publish']);

  // Provides the "bump" task.
  grunt.registerTask('bump', 'Increment version number', function() {
    var versionType = grunt.option('type');
    function bumpVersion(version, versionType) {
      var type = {patch: 2, minor: 1, major: 0},
          parts = version.split('.'),
          idx = type[versionType || 'patch'];
      parts[idx] = parseInt(parts[idx], 10) + 1;
      while(++idx < parts.length) { parts[idx] = 0; }
      return parts.join('.');
    }

    var version = grunt.config.data.pkg.version;
    version = bumpVersion(version, versionType || 'patch');

    grunt.config.data.pkg.version = version;
    grunt.file.write('bower.json', JSON.stringify(grunt.config.data.pkg, null, '  '));

    var packagejson = grunt.file.readJSON('package.json');
    packagejson.version = version;
    grunt.file.write('package.json', JSON.stringify(packagejson, null, '  '));

    grunt.log.ok('Version bumped to ' + version);
  });

};
