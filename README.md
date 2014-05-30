<!-- load: plRestmod -->
<!-- provide: $provide -->
<!-- inject: $httpBackend -->
<!-- inject: $injector -->

<!-- before:
	$httpBackend.when('GET', '/bikes/1').respond({ model: 'Slash' })
	$httpBackend.when('GET', '/bikes?brand=trek').respond([ { model: 'Slash' }, { model: 'Remedy' } ])

	module = $provide;
-->
Angular Restmod  [![Build Status](https://api.travis-ci.org/platanus/angular-restmod.png)](https://travis-ci.org/angular-platanus/restmod)
===============
Restmod creates objects that you can use from within Angular to interact with your RESTful API.

Saving Bikes on your serverside database would be as easy as:

```javascript
var Bike = $restmod.model('/bikes');
var newBike = Bike.$build({ brand: 'Trek' });
newBike.model = '5200';
newBike.$save(); // bike is persisted
```
It also supports collections, relations, lifecycle hooks, attribute renaming and much more.
Continue reading for a quick start or check the API Reference for more: http://platanus.github.io/angular-restmod

## Why Restmod?
Restmod brings Rails ActiveRecord's ease of use to the Angular Framework. It succesfuly combines Angular's encapsulated design with Active Record's opionated style. There are other alternatives available though:

**$resource:** Might be enough for small projects, included as an Angular opt-in. It only provides a basic model type layer, with limited features.

**Restangular:** very complete library, but does not propose a model layer.

**angular-activerecord:** Nice alternative to $resource, still very limited in its functionality.

**ModelCore:** Inspired in angular-activerecord, provides a more complete set of features but lacks testing.

## Getting Started

#### 1. Get the code

You can get it straight from the repository

```
git clone git@github.com:platanus/angular-restmod.git
```

but we recommend you to use bower to retrieve the Restmod package

```
bower install angular-restmod --save
```


#### 2. Include it on your project

Make sure the source file (dist/angular-restmod.min.js) is required in your code.

Include angular module

```js
module = angular.module('MyApp', ['plRestmod'])
```

## Basic usage

A new model type can be created using the `$restmod.model` method. We recommend you to put each model on a separate factory. The first argument for `model` is the resource URL, if not given the resource is considered anonymous, more on this later.

```javascripts
module.factory('Bike', function($restmod) {
	return $restmod.model('/bikes');
});
```

<!-- before: Bike = $injector.get('Bike') -->
<!-- it: expect(Bike).not.toBeNull() -->

The generated model type provides basic CRUD operations to interact with the API:

<!-- section: $find -->

To retrieve an object by ID use `$find`, the returned object will be filled with the response data when the server response is received.

```javascripts
bike = Bike.$find(1);
```

<!-- it: $httpBackend.flush(); expect(bike.model).toEqual('Slash') -->
<!-- end -->


<!-- section: $fetch -->
<!-- before: bike = Bike.$new(1) -->

To reload an object use `$fetch`. **WARNING:** This will overwrite modified properties.

```javascripts
bike.$fetch();
```

<!-- it: $httpBackend.flush(); expect(bike.model).toEqual('Slash') -->
<!-- end -->


<!-- section: $collection and $search -->

To retrieve an object collection `$collection` or `$search` can be used.

```javascript
bikes = Bike.$search({ keyword: 'enduro' });
// same as
bikes = Bike.$collection({ keyword: 'enduro' }); // server request not yet sent
bikes.$refresh();
```

<!-- end -->

To reload a collection use `$refresh`. To append more results use `$fetch`.

```javascript
bikes.$refresh({ page: 1 }); // clear collection and load page 1
bikes.$fetch({ page: 2 }); // page 2 is appended to page 1, usefull for infinite scrolls...
bikes.$refresh({ page: 3 }); // collection is reset, page 3 is loaded on response
```

To update an object, just modify the properties and call `$save`.

```javascript
bike.brand = 'Trek';
bike.$save();
```

To create a new object use `$build` and then call `$save` to send a POST request to the server.

```javascript
var newBike = Bike.$build({ brand: 'Comencal' });
newBike.model = 'Meta';
newBike.$save(); // bike is persisted
```

Or use `$create`

```javascript
var newBike = Bike.$create({ brand: 'Comencal', model: 'Meta' });
```

If called on a collection, `$build` and `$create` will return a collection-bound object that will be added when saved successfully.

```javascript
var newBike = bikes.$create({ brand: 'Comencal', model: 'Meta' });
// after server returns 'bikes' will contain 'newBike'.
```

To show a non saved object on the bound collection use `$reveal`

```javascript
var newBike = bikes.$create({ brand: 'Comencal', model: 'Meta' }).$reveal();
// 'newBike' is inmediatelly available at 'bikes'
```

Finally, to destroy an object just call `$destroy`. Destroying an object bound to a collection will remove it from the collection.

```javascript
bike.$destroy();
```

All operations described above will set the `$promise` property. This property is a regular `$q` promise that is resolved when operation succeds or fail. It can be used directly or using the `$then` method.

```javascript
bike.$fetch().$then(function(_bike) {
	doSomething(_bike.brand);
});
// or
bike.$fetch().$promise.then(function(_bike) {
	doSomething(_bike.brand);
});
```

## Relations

Relations are defined in $restmod using the **definition object**. The `$restmod.model` method can take as argument an arbitrary number of definition objects, models and builder functions after the url (first argument), more on this later.


```javascript
var Bike = $restmod.model('api/bikes', {
	// This is the definition object
	parts: { hasMany: 'Part' },
	owner: { belongsTo: 'User' },
	createdAt: { serialize: 'Date' }
});
```

There are three types of relations:

#### HasMany

This is a hirearchical relation between a model instance and another model collection. The child collection url is bound to the parent url. The child collection is created **at the same time** as the parent, so it is available even is the parent is not resolved.

```javascript
var Part = $restmod.model('api/parts');
var Bike = $restmod.model('api/bikes', {
	parts: { hasMany: Part } // use 'Part' string if using factories.
});

var bike = Bike.$new(1); // no request are made to the server here.
var parts = bike.parts.$fetch(); // sends GET /api/bikes/1/parts
// later on, after parts is resolved.
parts[0].$fetch(); // updates part at index 0 context, this will GET /api/parts/X
```
Calling `$create` on the collection will POST to the collection nested url.

```javascript
var part = bike.parts.$create({ serialNo: 'XX123', category: 'wheels' }); // sends POST /api/bikes/1/parts
```

If the child collection model is anonymous (no url given to `model`) then all CRUD routes for the collection items are bound to the parent. The example above would behave like this:

```javascript
// So if parts were to be defined like
var Part = $restmod.model(null); // Anonymous model
// then
bike.parts[0].$fetch(); // sends GET /api/bikes/1/parts/X instead of /api/parts/X
```

#### HasOne

This is a hirearchical relation between a model instance and another model instance. The child instance url is bound to the parent url. The child instance is created **at the same time** as the parent, so its available even if the parent is not resolved.

```javascript
var Owner = $restmod.model('api/users');
var Bike = $restmod.model('api/bikes', {
	owner: { hasOne: User } // use 'User' string if using factories.
});

var owner = Bike.$build(1).owner.$fetch(); // will send GET /api/bikes/1/owner

// ... server answers with { "name": "Steve", "id": 20 } ...

alert(owner.name); // Echoes 'Steve'
owner.name = 'Stevie';
owner.$save(); // will send PUT /api/users/20 with { "name": "Stevie" }
```

If the child object model is anonymous (no url given to `model`) then all CRUD routes are bound to the parent (same as hasMany).

#### belongsTo

This is a reference relation between a model instance and another model instance. The child instance is not bound to the parent and is **generated after** server response to a parent's `$fetch` is received. A key is used by default to bind child to parent. The key property name can be optionally selected using the `key` attribute.

```javascript
var Owner = $restmod.model('api/users');
var Bike = $restmod.model('api/bikes', {
	owner: { belongsTo: User, key: 'userId' } // key would default to *ownerId*
});

var bike = Bike.$find(1); // sends GET to /api/bikes/1
// ... server answers with { "user_id": 20 } ...
alert(bike.owner.$pk); // echoes '20'
alert(bike.owner.name); // echoes 'undefined' since user information has not been fetched.
bike.owner.$fetch(); // sends GET to /api/users/20
// ... server answers with { "name": "Peat" } ...
alert(bike.owner.name); // echoes 'Peat'
```

This relation can be optionally defined as `inline`, this means that it is expected that the child object data comes inlined in the parent object server data. The inline property name can be optionally selected using the `source` attribute.

```javascript
var Owner = $restmod.model('api/users');
var Bike = $restmod.model('api/bikes', {
	owner: { belongsTo: User, inline: true, source: 'user' } // source would default to *owner*
});

var bike = Bike.$find(1);
// ... server answers with { "user": { "name": "Peat" } } ...
alert(bike.owner.name); // echoes 'Peat'
```

# Serialization, Encoding and Decoding

When you communicate with an API, some attribute types require special treatment (like a date, for instance)

### Decode
 You can specify a way of decoding an attribute when it arrives from the server.

Let's say you have defined a filter like this:

```javascript
Angular.factory('DateParseFilter', function() {
	return function(_value) {
		date = new Date();
		date.setTime(Date.parse(_value));
		return date;
	}
})
```

then you use it as a standard decoder like this:

```javascript
var Bike = $restmod.model('/bikes', {
	createdAt: {decode:'date_parse'}
});
```
### Encode
 To specify a way of encoding an attribute before you send it back to the server:
Just as with the previous example (decode), you use an Angular Filter. In this example we use the built in 'date' filter.

```javascript
var Bike = $restmod.model('/bikes', {
	createdAt: {encode:'date', param:'yyyy-MM-dd'}
});
```

On both **encode** and **decode** you can use an inline function instead of the filter's name. It is also possible to bundle an encoder and decoder together using a Serializer object, check the [API Reference](http://platanus.github.io/angular-restmod) for more.

# Attribute masking

Following the Angular conventions, attributes that start with a '$' symbol are considered private and never sent to the server. Furthermore, you can define a mask that allows you to specify a more advanced behaviour for other attributes:

```javascript
var Bike = $restmod.model('/bikes', {
	createdAt: {mask:'CU'}, // won't send this attribute on Create or Update
	viewCount: {mask:'R'}, // won't load this attribute on Read (fetch)
	opened: {mask:true}, // will ignore this attribute in relation to the API
});
```

# Hooks (callbacks)

Just like you do with ActiveRecord, you can add triggers on certain steps of the object lifecycle

```javascript
var Bike = $restmod.model('/bikes', {
	'~beforeSave': function() {
		this.partCount = this.parts.length;
	}
});

```
Note that a hook can be defined for a type, a collection or a record. Also, hooks can also be defined for a given execution context using $decorate. Check Restmod advanced documentation here.

# Mixins

To ease up the definition of models, and keep thing DRY, Restmod provides you with mixin capabilities. For example, say you already defined a Vehicle model as a factory:

```javascript
Angular.factory('Vehicle', function() {
	return $restmod.model('/vehicle', {
	createdAt: {encode:'date', param:'yyyy-MM-dd'}
	});
})
```

You can then define your Bike model that inherits from the Vehicle model, and also sets additional functionality.

```javascript
var Bike = $restmod.model('/bikes', 'Vehicle', {
	pedal: function (){
		alert('pedaling')
	}
});

```

API Reference: http://platanus.github.io/angular-restmod
