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
      'src/module/**/*.js',
      'src/plugins/*.js',
      'src/styles/*.js',

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
      'SL_Chrome': {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: '34'
      },
      'SL_Firefox': {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '26'
      },
      'SL_Safari': {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.9',
        version: '7'
      },
      'SL_IE_8': { // TODO: fix IE8 tests, for some reason tests do not work as expected (but library does), maybe is a jasmine/angularjs issue?
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows XP',
        version: '8'
      },
      'SL_IE_9': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2008',
        version: '9'
      },
      'SL_IE_10': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2012',
        version: '10'
      },
      'SL_IE_11': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
      }
    },

    browsers: ['SL_Chrome', 'SL_Firefox', 'SL_Safari', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11']
  });

  // set tunnel identifier for travis builds, by default it uses the job number.
  if (process.env.TRAVIS) {
    config.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }
};
