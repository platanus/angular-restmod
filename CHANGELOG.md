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
