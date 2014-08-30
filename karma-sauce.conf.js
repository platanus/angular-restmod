// Karma configuration
// Generated on Fri Aug 09 2013 14:14:35 GMT-0500 (CDT)

module.exports = function(config) {
  config.set({

    // Base path, that will be used to resolve files and exclude
    basePath: '',

    // Load jasmine and requirejs (require is used by the readme spec)
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: [
  		// libraries
  		'bower_components/angular/angular.js',
      'bower_components/angular-inflector/dist/angular-inflector.js',
      'bower_components/angular-mocks/angular-mocks.js',

  		// our app
      'src/module.js',
      'src/module/*.js',
      'src/plugins/*.js',

      // the specs
      // Do not run the README test since it requires requirejs and I could make it work on sauce
      'test/**/*spec.js'
    ],

    // Karma plugins
    plugins: [
      'karma-jasmine',
      'karma-sauce-launcher'
    ],

    // List of files to exclude
    exclude: [
      'test/readme-spec.js'
    ],

    // Test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters: ['progress', 'saucelabs'],

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Broser connection tolerances (partially based on angularjs configuration)
    captureTimeout: 0,
    browserDisconnectTolerance: 2,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,

    // Disable websocket for full browser tests
    transports: ['xhr-polling'],

    // Continuous Integration mode by default
    singleRun: true,

    // Sauce config, requires username and accessKey to be loaded in ENV
    sauceLabs: {
      testName: 'Restmod Unit Tests',
      startConnect: false
    },

    // Custom sauce launchers
    customLaunchers:
    {
      sl_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7',
        version: '35'
      },
      sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '30'
      },
      sl_firefox_4: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '4'
      },
      sl_ios_safari: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version: '7.1'
      },
      sl_ie_9: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 7',
        version: '9'
      },
      sl_ie_11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
      }
    },

    browsers: ['sl_ie_9', 'sl_firefox_4', 'sl_firefox', 'sl_ie_11']
  });
};
