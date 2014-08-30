var FULL_BROWSER_TEST = !!process.env.SAUCE_USERNAME; // use sauce if credentials are available

// Karma configuration
// Generated on Fri Aug 09 2013 14:14:35 GMT-0500 (CDT)

module.exports = function(config) {
  config.set({

    // Base path, that will be used to resolve files and exclude
    basePath: '',

    // Load jasmine and requirejs (require is used by the readme spec)
    frameworks: ['jasmine', 'requirejs'],

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

  		// tests
  		{ pattern: 'test/**/*spec.js', included: false },
      { pattern: 'README.md', included: false },

      'test/requirejs-main.js',
      { pattern: 'node_modules/text/text.js', included: false }
    ],

    // Karma plugins
    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-sauce-launcher',
      'karma-osx-reporter'
    ],

    // List of files to exclude
    exclude: [

    ],

    // Test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters: ['progress', 'osx', 'saucelabs'],

    // Web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Broser connection tolerances
    browserDisconnectTolerance: 2,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,

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

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: FULL_BROWSER_TEST ? ['sl_ie_9', 'sl_firefox_4', 'sl_firefox', 'sl_ie_11'] : ['Firefox']
  });
};
