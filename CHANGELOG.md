<a name="0.17.0"></a>
## 0.17.0 (2014-08-25)


#### Bug Fixes

* **Gruntfile:** couple of syntax errors ([e5c3da47](http://github.com/angular-platanus/restmod/commit/e5c3da47f06158506429229f6c87833bbd6feb4f))
* **default_packer:** changes default links property to li linked ([ad3fa2f9](http://github.com/angular-platanus/restmod/commit/ad3fa2f9b8bb754387ceee1d82710cf5cf7c2069))
* **relations:** fixes default belongsToMany key property to use singularized attribute name ([2d474dea](http://github.com/angular-platanus/restmod/commit/2d474deaaa487d795ad1e4ba02ea0413ad76652d))


#### Features

* adds the default packer! ([e790ef0b](http://github.com/angular-platanus/restmod/commit/e790ef0be0f8c56d3ec39b3b3214e35c10f1227c), closes [#62](http://github.com/angular-platanus/restmod/issues/62))
* adds PackerCache service. ([99d7639f](http://github.com/angular-platanus/restmod/commit/99d7639f1adaed3ae8b18810379cd08e83d0e7da))
* **builder:**
  * changes the __var__ format for model config to all caps VAR format ([decb21e0](http://github.com/angular-platanus/restmod/commit/decb21e07ddf4327dda9c4e753ac2dc9c0f2d578))
  * makes packer a configuration option settable as __packer__ ([fc12bd9d](http://github.com/angular-platanus/restmod/commit/fc12bd9dd64aff9ff2200e0fca1b1863635f8f87))
  * changes model configuration variables name format. ([b0b87e22](http://github.com/angular-platanus/restmod/commit/b0b87e22bedf686eb510f7cb409a530a18fa17a2))
* **docs:** adds the integration guide! ([153caf8e](http://github.com/angular-platanus/restmod/commit/153caf8e6211281de63097fd7fe000747a8b9891), closes [#101](http://github.com/angular-platanus/restmod/issues/101))
* **factory:** adds default value fallback to $getProperty ([da283132](http://github.com/angular-platanus/restmod/commit/da2831329156e8e4080e6d5c4d024cbf8ecf7a40))
* **model:**
  * adds model name inference from url. ([c3ab4819](http://github.com/angular-platanus/restmod/commit/c3ab4819832628733876e763e11a5e06304fe9ba))
  * changes baseUrl property name to url ([e654176a](http://github.com/angular-platanus/restmod/commit/e654176a0811ac02b8f99b5104e5497e32074ffb))
* **packer_cache:** changed to expect plural resource names ([59305f5f](http://github.com/angular-platanus/restmod/commit/59305f5f57119a8ab86c84873c2169214dc79194))


#### Breaking Changes

* renames restmodProvider.pushModelBase method to restmodProvider.rebase


# 0.16.3 (2014-08-19)

## Bug fixes

### serializer

* moves the check for the $ prefix to after the nameDecoder is called. (c0c0f65)

# 0.16.2 (2014-08-18)

## Features

### builder

* adds the belongsToMany relation. (8c368ff)

## Bug fixes

### serializer

* fixes wildcard mapping for decoding and adds missing test (db27cf1)

* encoding failing for null values (4d515c8)

# 0.16.0 (2014-08-14)

## Features

## Builder

* Adds attribute mapping support

## Model

* Adds packer support

* Adds $wrap/$unwrap methods

## Breaking Changes

* Adds query parameter support to $find (193dedc)

* Changes module name to 'restmod'

* Changes service name to 'restmod' and provider name to 'restmodProvider'

# 0.14.0 (2014-05-19)

## Features

### Model

* Adds the `$reveal` method, this methods allows to display before a call to $save succeds.

* Adds the `$moveTo` method, this method is used to change the item position in parent collection even before it is revealed.

## Breaking Changes

* changes the way creation of object in collection work. (7803c90)

* makes `$inferKey` only be called for raw data. (58a2378)

* changes $extend to only copy non-private properties. (5172aa9)

* makes $build use $extend. (c00ea92)


# 0.13.0 (2014-03-14)

## Breaking Changes

* replaces SyncMask by string mask. Use `attr: { ignore: 'CRU' }` in an attribute definition to specify if it should be considered when **C**reating, **U**pdating or **R**eading (d6b39e2)
* makes properties that start with **$** private. Private properties are not consideren when encoding/decoding an object (2549845)

* makes $each method skip private properties (9d36bdd)


# 0.12.0 (2014-01-24)

## Features
### ModelBuilder

* adds the setUrlPrefix builder method. (1cce503)

* adds setPrimaryKey function. (59bc815)

## Breaking Changes

* $build, it no longer allows a private key to be passed directly, for that use $new or $build({ id: X })

# 0.11.1 (2014-01-22)

## Features
### Model

* adds the after-init hook. (f761fec)

# 0.11.0 (2014-01-22)

## Breaking Changes

* removes build hook shorcut methods (`afterCreate`, `afterFeed`, etc ...). Use `on('hook-name', function() {})` instead.

# 0.10.2 (2014-01-22)

## Features
### DirtyModel

* Adds $restore method (652620e)

### Builder

* adds ability to define class methods and hooks in the object definition using special prefixes. (7c26ed5)

# 0.10.1 (2014-01-16)

## Features
### Collection

* adds $indexOf method and makes $remove actually remove something. (0175ae8)

# 0.10.0 (2014-01-15)

## Features

* adds belongsTo relation and improves url generation. (f3bb097)

## Breaking Changes

* replaces the hasMany/hasOne modifiers parameter `alias` by `path`.
* removes the restUrlBuilder and all related functions.

# 0.1.1

* Initial prototype.
