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
