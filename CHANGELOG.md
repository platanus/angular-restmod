<a name="1.1.11"></a>
### 1.1.11 (2015-10-26)


#### Bug Fixes

* **Builder:** fixes `mask` modifier being removed by mistake ([dc498735](http://github.com/angular-platanus/restmod/commit/dc49873538a260f26bf503498926cc22ed7e0156))


<a name="1.1.10"></a>
### 1.1.10 (2015-10-24)


#### Bug Fixes

* **CommonApi:** makes canceled request promises resolve to error ([afcde0b4](http://github.com/angular-platanus/restmod/commit/afcde0b4c19c6a05cc7b09378e05b4462fb2cfc6), closes [#288](http://github.com/angular-platanus/restmod/issues/288))
* **DefaultPacker:** fixes plural name not being infered from name. ([e4c02a13](http://github.com/angular-platanus/restmod/commit/e4c02a13447d3862bbfcf7eb7d1ee17e20bb22cd), closes [#224](http://github.com/angular-platanus/restmod/issues/224))
* **Relations:** fixes hasMany and hasOne failing when inline property is null. ([05ab5479](http://github.com/angular-platanus/restmod/commit/05ab5479b9aed15fc5d42f09c6bad43b7f6239aa))
* **Serializer:** fixes decoder being called on mapped properties even if the parent object was nu ([e8041b8d](http://github.com/angular-platanus/restmod/commit/e8041b8d9e5ba9aeb6833afce67bd1b7267df91a))


#### Features

* **CommonApi:** adds $off method to unregister callbacks ([591db81b](http://github.com/angular-platanus/restmod/commit/591db81b223c57b7b94b306c629aa3ab22d34f6e), closes [#257](http://github.com/angular-platanus/restmod/issues/257))
* **ModelApi:** makes identity do the pluralizing if plural is not defined ([b94b349b](http://github.com/angular-platanus/restmod/commit/b94b349b2d8038fb68af9b51f1274a7dc14a320a))
* **RecordApi:**
  * adds $isNew method ([104f3c25](http://github.com/angular-platanus/restmod/commit/104f3c25ea32ee1444c2f79f2736804f3ee382a6))
  * makes $decode throw if encoded value is null or not an object. ([28636f69](http://github.com/angular-platanus/restmod/commit/28636f69783724a1ea5f50aad07029f0281ab21c))
* **Serializer:**
  * adds dynamic mask support ([51905cb5](http://github.com/angular-platanus/restmod/commit/51905cb5c8ebd226d15c323fc2961590810cb7de))
  * mask now is passed to decoder/encoder as the second argument ([9db02baf](http://github.com/angular-platanus/restmod/commit/9db02bafc68a89c0f5d7a9e294875301b3ce01ce))


<a name="1.1.9"></a>
### 1.1.9 (2015-05-07)


#### Bug Fixes

* **CommonApi:** makes canceled request promises resolve to error ([0b8f21c5](http://github.com/angular-platanus/restmod/commit/0b8f21c51adfc101485498c65822311b7384583a), closes [#288](http://github.com/angular-platanus/restmod/issues/288))
* **DefaultPacker:** fixes plural name not being infered from name. ([ddad7e44](http://github.com/angular-platanus/restmod/commit/ddad7e4491433e35dae59757ba5776ead1668a03), closes [#224](http://github.com/angular-platanus/restmod/issues/224))

#### Features

* **CommonApi:** adds $off method to unregister callbacks ([59fd3b84](http://github.com/angular-platanus/restmod/commit/59fd3b84bafd2bce159a4a254c24592cb799af3a), closes [#257](http://github.com/angular-platanus/restmod/issues/257))
* **ModelApi:** makes identity do the pluralizing if plural is not defined ([d2f0c0c3](http://github.com/angular-platanus/restmod/commit/d2f0c0c3174743cd66a87382957396329be1859c))


<a name="1.1.8"></a>
### 1.1.8 (2015-02-18)

<a name="1.1.7"></a>
### 1.1.7 (2015-01-06)


#### Bug Fixes

* **record:** Adds support for array properties on patch mask ([61665fa4](http://github.com/angular-platanus/restmod/commit/61665fa42a470651f3b6d006c2987b3e0d303813), closes [#217](http://github.com/angular-platanus/restmod/issues/217))


<a name="1.1.6"></a>
### 1.1.6 (2015-01-06)


#### Bug Fixes

* adds package.json to release task ([f7875766](http://github.com/angular-platanus/restmod/commit/f78757663c5b64136886f67069f7d694669607a1))
* **factory:** fixes typo in call to canonicalUrlFor. ([5bfa439a](http://github.com/angular-platanus/restmod/commit/5bfa439a1cfe853d322403516ea70e12d51389fa), closes [#227](http://github.com/angular-platanus/restmod/issues/227))
* **fastq:** adds missing 'catch' method to promises ([1fea426a](http://github.com/angular-platanus/restmod/commit/1fea426a1c6607ec3cc323d560f205a7e615be9f), closes [#183](http://github.com/angular-platanus/restmod/issues/183))


#### Features

* **nesteddirty:** adds NestedDirtyModel plugin ([04b6178f](http://github.com/angular-platanus/restmod/commit/04b6178fcd99cd06e08845676313443f290c059e))
* **plugin.nested_dirty:**
  * specifies how changing a nested object property to another type affects changed  ([2a295779](http://github.com/angular-platanus/restmod/commit/2a295779d77e94300e7aea6a4072c638179fc888))
  * adds support for properties ([94bf9375](http://github.com/angular-platanus/restmod/commit/94bf937592136425bad514f618532af248a13936))
* **service:** adds support for custom relation url name transformation. ([5a080925](http://github.com/angular-platanus/restmod/commit/5a08092513b8d1713b7431ea243ecc66564c238d), closes [#159](http://github.com/angular-platanus/restmod/issues/159))


<a name="1.1.5"></a>
### 1.1.5 (2014-12-10)


#### Bug Fixes

* **guides.integration:** fixes deprecated notation references ([7bdb2569](http://github.com/angular-platanus/restmod/commit/7bdb256972786ba5c007b84c6bf122fe5b093d65), closes [#215](http://github.com/angular-platanus/restmod/issues/215))
* **service:** fixes wrong warning message refering to `$mix` instead of `mix` ([09b1f352](http://github.com/angular-platanus/restmod/commit/09b1f352357aa3fe34e4c86f60b57d8af63eb589), closes [#178](http://github.com/angular-platanus/restmod/issues/178))


#### Features

* adds the List type and namespace. ([7ee7b9ce](http://github.com/angular-platanus/restmod/commit/7ee7b9cee197c235eeba2b28fbbd9cf6be4f57ca), closes [#169](http://github.com/angular-platanus/restmod/issues/169))
* improves PATCH logic, now refering to an object containing property will automatically include it's subproperties.


<a name="1.1.4"></a>
### 1.1.4 (2014-11-26)


#### Bug Fixes

* **record_api:** Improves url building and adds support for falsy `$pk`s ([db4e63b4](http://github.com/angular-platanus/restmod/commit/db4e63b4fc4d98c121481fc5a54c688149ad528e), closes [#205](http://github.com/angular-platanus/restmod/issues/205))


#### Features

* **common_api:** Adds the posibility to override the cannonical url for nested resources. ([db47f98c](http://github.com/angular-platanus/restmod/commit/db47f98c7137cab5ffccacc3ba4e08de84debfcc))
* **computed:** Adds compute properties. ([9a015311](http://github.com/angular-platanus/restmod/commit/9a015311ee93615b7b29d83d84080e0a0206f8b9))
* **relations:** adds hasMany and hasOne hooks. ([fc2a8059](http://github.com/angular-platanus/restmod/commit/fc2a8059089725853025acf6804d6ed675ed7488), closes [#35](http://github.com/angular-platanus/restmod/issues/35), [#28](http://github.com/angular-platanus/restmod/issues/28))


<a name="1.1.3"></a>
### 1.1.3 (2014-09-25)


#### Bug Fixes

* **common:** fixes $send not properly handling the $promise property. ([d5542f05](http://github.com/angular-platanus/restmod/commit/d5542f056298e9fdf8f5d6773626bd7bbcd95309), closes [#154](http://github.com/angular-platanus/restmod/issues/154))


<a name="1.1.2"></a>
### 1.1.2 (2014-09-24)

#### Features

* **default_packer:** adds support for explicitly setting links and metadata properties to extract. ([dcfd37be](http://github.com/angular-platanus/restmod/commit/dcfd37be0fb8d5e3c5cb7e2c6a728ab96ee408fe), closes [#153](http://github.com/angular-platanus/restmod/issues/153))
* **find_many:** adds posibility to include additional parameters in populate request ([bf05802b](http://github.com/angular-platanus/restmod/commit/bf05802b7d996c8e7a799f2d003fd2566a60419f))
* **preload:** adds support for query parameters. ([62f1dcb1](http://github.com/angular-platanus/restmod/commit/62f1dcb136652bfb3e413749c67d1b4443958d07), closes [#152](http://github.com/angular-platanus/restmod/issues/152))


<a name="1.1.1"></a>
### 1.1.1 (2014-09-23)


#### Bug Fixes

* **styles:** Fixes AMS style definition, adds a ams-spec. ([92b5cb90](http://github.com/angular-platanus/restmod/commit/92b5cb90c4c7f2bef29f46be0f87e21e401760ce), closes [#151](http://github.com/angular-platanus/restmod/issues/151))


<a name="1.1.0"></a>
## 1.1.0 (2014-09-23)


#### Bug Fixes

* **test:** fixes the preload plugin spec ([502358d4](http://github.com/angular-platanus/restmod/commit/502358d4023aa3fcc2e62690ad8d9b8a17054cf6))


#### Features

* **common:**
  * adds the $action method that allows creation of cancelable actions. ([8808e119](http://github.com/angular-platanus/restmod/commit/8808e11961cdbc8b4617a6672aa4c916362e7b9a))
  * prevents $then to wait for a digest cycle when last promise is resolved. ([faafeb80](http://github.com/angular-platanus/restmod/commit/faafeb80a2bd8f3fd39497b1a6906a1fd8bede54))
* **docs:** adds section about $resolve ([036f9f7d](http://github.com/angular-platanus/restmod/commit/036f9f7da12df4a803035acf162134e174354b97))
* **model:** adds the dummy method to generate dummy resources. ([a072ad32](http://github.com/angular-platanus/restmod/commit/a072ad3238637badc762ef15029512d74b76952d))
* **plugins:**
  * Adds the Preload plugin. ([58c9cb09](http://github.com/angular-platanus/restmod/commit/58c9cb096dc3e6b184341e75fd5beeffffd9711e), closes [#75](http://github.com/angular-platanus/restmod/issues/75))
  * Adds the FindMany plugin. ([c5f37dc1](http://github.com/angular-platanus/restmod/commit/c5f37dc133401a0bc69df7acc671a8f38e9f9aa2))
* **plugins.dirty:** makes $restore use $action ([c704f425](http://github.com/angular-platanus/restmod/commit/c704f42530cb802736dd4fd7aef4bd4bc186b1a3))
* **plugins.shared:** Adds the SharedModel plugin ([a09888af](http://github.com/angular-platanus/restmod/commit/a09888afe74f16ee77c57afcc1f2237f64aa527e), closes [#124](http://github.com/angular-platanus/restmod/issues/124))
* **record:**
  * makes destroy immediately remove revealed item from owner collection if not save ([e8408381](http://github.com/angular-platanus/restmod/commit/e8408381af161037c10896f6fd85c6317fa19995), closes [#146](http://github.com/angular-platanus/restmod/issues/146))
  * makes $extend execute in the promise chain. ([c7a692cf](http://github.com/angular-platanus/restmod/commit/c7a692cf305d11f0422d89cc7f9053d6e1b62672))
  * enables PATCH operations on $save ([b8370417](http://github.com/angular-platanus/restmod/commit/b8370417dcbfc6c5f824b81ebf143d417c9a1d08), closes [#98](http://github.com/angular-platanus/restmod/issues/98))
* **serializer:**
  * adds volatile attributes ([35f5c0aa](http://github.com/angular-platanus/restmod/commit/35f5c0aa3a10fe85e60b8123a6602d3466b7b070), closes [#77](http://github.com/angular-platanus/restmod/issues/77))
  * allows to pass a method as mask ([3ae2edb2](http://github.com/angular-platanus/restmod/commit/3ae2edb24689e6bb8b433929971473de26acb096))


#### Breaking Changes

* Actions will now be chained and may not execute inmediatelly if called after an async action.

Affected actions:
* Record.$fetch
* Record.$extend
* Record.$save
* Record.$destroy
* Collection.$fetch
* Collection.$add
* Collection.$remove
* Record/Collection.$resolve
* Record/Collection.$reset
 ([e5942d0e](http://github.com/angular-platanus/restmod/commit/e5942d0e682bcd4bb1a38b052667b05c67dd9b37))


<a name="1.0.3"></a>
### 1.0.3 (2014-09-16)


#### Bug Fixes

* **common:** fixes $send registering callback only to previous promise success. ([4a4c6bc1](http://github.com/angular-platanus/restmod/commit/4a4c6bc196a1885efedc2ddfbf0d284cf4f03937), closes [#135](http://github.com/angular-platanus/restmod/issues/135))


<a name="1.0.2"></a>
### 1.0.2 (2014-09-12)

#### Bug fixes

* **ams:** fixes call to setPacker.

<a name="1.0.1"></a>
### 1.0.1 (2014-09-11)


#### Bug Fixes

* **gruntfile:** fixes non bundled library distributable ([2ca6bfb6](http://github.com/angular-platanus/restmod/commit/2ca6bfb6a222ff65fba05f28f6ee175dc8671530), closes [#125](http://github.com/angular-platanus/restmod/issues/125))


<a name="1.0.0"></a>
## 1.0.0 (2014-09-10)


#### Bug Fixes

* **common:** removes promise clearing in `$cancel` ([7cb4ad5b](http://github.com/angular-platanus/restmod/commit/7cb4ad5b0156ec9188d1f7913411c378a69e8867))
* **tests:** changes old notation ([8c4c9d48](http://github.com/angular-platanus/restmod/commit/8c4c9d48fe07817f87179c77159d660505024ddd), closes [#33](http://github.com/angular-platanus/restmod/issues/33))


#### Features

* creates the extended api module that is included in collections and records. ([c05a7b3c](http://github.com/angular-platanus/restmod/commit/c05a7b3c50d764ef57338f3c96d056ac0f354ce7), closes [#78](http://github.com/angular-platanus/restmod/issues/78), [#115](http://github.com/angular-platanus/restmod/issues/115))
* **builder:**
  * define accepts individual implementations for record/collection/type. ([2966a46d](http://github.com/angular-platanus/restmod/commit/2966a46dfdd97555d5dba63f3c68d2d53a087df0))
  * changes the way property renaming is configured, adds the setRenamer method. ([91ab4a33](http://github.com/angular-platanus/restmod/commit/91ab4a339ee7f2c360177bf2cb46d1362d7e37e0), closes [#111](http://github.com/angular-platanus/restmod/issues/111))
* **common:**
  * improves promise chaining using the `$then` method. ([aab2e309](http://github.com/angular-platanus/restmod/commit/aab2e30940553cf49c427dae85126d4547aaabbc))
  * adds the $asPromise method ([3e0dc98d](http://github.com/angular-platanus/restmod/commit/3e0dc98d1dee4e7f7d5e2c7e11a66359738c61aa))
* **model:**
  * adds $mix method to extend a model after being created ([8fce2ec9](http://github.com/angular-platanus/restmod/commit/8fce2ec9399daaf38bb5a719c071ce28d0553deb))
  * makes $inferKey public so it can be overriden. ([22900b4d](http://github.com/angular-platanus/restmod/commit/22900b4dd177c6df6bce32261dcc855bc8ef56c5), closes [#113](http://github.com/angular-platanus/restmod/issues/113))
* **plugins.debounced:** changes use of classDefine variables by configuration variables ([14f76cff](http://github.com/angular-platanus/restmod/commit/14f76cff1d8b3853138589c8116e2c398f7f8fe1))
* **plugins.paged:** changes use of classDefine variables by configuration variables ([5ddc1904](http://github.com/angular-platanus/restmod/commit/5ddc1904a4be7de4c9fcbc55de7980ee99eebff9))
* **utils:**
  * overhaul extendOverriden to be used in factory ([7b309652](http://github.com/angular-platanus/restmod/commit/7b3096523ca5e5418bcb89c308e61edb76bca175))
  * adds assertion method and integrates it ([badc381a](http://github.com/angular-platanus/restmod/commit/badc381a4ccfa1465a1c5d42bbe38f9099af856e))


#### Breaking Changes

* `$then` and `$asPromise` callbacks arguments have changed, `$promise` as public property is deprecated.

$then and $asPromise callbacks will now always receive the related resource as first parameter. Last promise result/rejection reason
will be located in the `$last` property of the resource.

Replace references to `$promise` by calls to `$asPromise()`.
 ([aab2e309](http://github.com/angular-platanus/restmod/commit/aab2e30940553cf49c427dae85126d4547aaabbc))
* CommonApi methods are no longer available at static (class) level
 ([52b2591f](http://github.com/angular-platanus/restmod/commit/52b2591f9bba0084defa6f07f28def3975bff760))
* define and classDefine no longer accept types other than functions.

Replace calls to `define({ /* various methods */ })` by various calls to `define`, same for classDefine.

Replace usage of `classDefine` for type level config variables by proper configuration variables set
using `setProperty`.
 ([2966a46d](http://github.com/angular-platanus/restmod/commit/2966a46dfdd97555d5dba63f3c68d2d53a087df0))
* Renaming has been disabled by default, removed setNameEncoder/setNameDecoder/disableRenaming methods

You must provide a custom renamer if you need renaming now, the idea is use a **style**.

Replace setNameEncoder/setNameDecoder/disableRenaming methods usage setRenamer method.

Closes #111
 ([91ab4a33](http://github.com/angular-platanus/restmod/commit/91ab4a339ee7f2c360177bf2cb46d1362d7e37e0))


<a name="0.18.2"></a>
### 0.18.2 (2014-08-30)


#### Bug Fixes

* **utils:** fixes iframe array type hijack for IE9-IE10 ([ce553426](http://github.com/angular-platanus/restmod/commit/ce55342604c8816600690a66994a5b067378f869))


<a name="0.18.1"></a>
### 0.18.1 (2014-08-30)

#### Features

* **tests:** adds separate karma configuration for sauce ([32d8f815](http://github.com/angular-platanus/restmod/commit/32d8f815271335ad195f443e8d453af934996ea6))
* **utils:** improves array type creation, prefers prototype replacement strategy before ifra ([0b35aa04](http://github.com/angular-platanus/restmod/commit/0b35aa046c95116034a2277c38991214a18f948d), closes [#89](http://github.com/angular-platanus/restmod/issues/89))


<a name="0.18.0"></a>
## 0.18.0 (2014-08-26)


#### Features

* removes trailing slashes from generated urls ([188a7f75](http://github.com/angular-platanus/restmod/commit/188a7f754f345f772be8b4b9a1427972631fb4b6))
* **collection:** unifies interface with record api. ([7fa0b64c](http://github.com/angular-platanus/restmod/commit/7fa0b64ce939ce2f3c9184207e75cbf529bbe690), closes [#63](http://github.com/angular-platanus/restmod/issues/63))


#### Breaking Changes

* collection.$feed is called collection.$decode now.

Closes #63
 ([7fa0b64c](http://github.com/angular-platanus/restmod/commit/7fa0b64ce939ce2f3c9184207e75cbf529bbe690))


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
