<!-- load: restmod -->
<!-- provide: $provide -->
<!-- inject: $httpBackend -->
<!-- inject: $injector -->
<!-- inject: restmod -->

<!-- before:
	$httpBackend.when('GET', '/bikes/1').respond({ model: 'Slash', brand: 'Trek' })
	$httpBackend.when('GET', '/bikes/1?includeParts=true').respond({ model: 'Slash', brand: 'Trek', parts: [] })
	$httpBackend.when('GET', '/bikes?brand=trek').respond([ { model: 'Slash' }, { model: 'Remedy' } ])
	$httpBackend.when('GET', '/bikes?category=enduro').respond([ { model: 'Slash' }, { model: 'Remedy' } ])

	module = $provide;
-->

Angular Restmod
===============

Angular Restmod is open source software kindly sponsored by:

![Supporter](http://placehold.it/350x150)

(We need a sponsor for this library, please write to contact@platan.us if you want to help.)


[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/platanus/angular-restmod?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://api.travis-ci.org/platanus/angular-restmod.svg)](https://travis-ci.org/platanus/angular-restmod) [![Code Climate](https://codeclimate.com/github/platanus/angular-restmod/badges/gpa.svg)](https://codeclimate.com/github/platanus/angular-restmod) [![Stories in Ready](https://badge.waffle.io/platanus/angular-restmod.png?label=ready&title=Ready)](https://waffle.io/platanus/angular-restmod) [![Bower version](https://badge.fury.io/bo/angular-restmod.svg)](http://badge.fury.io/bo/angular-restmod)


Restmod creates objects that you can use from within Angular to interact with your RESTful API.

Saving bikes on your serverside database would be as easy as:

<!-- section: main example -->

```javascript
var newBike = Bike.$build({ brand: 'Trek' });
newBike.model = '5200';
newBike.$save(); // bike is persisted sending a POST to /bikes
```

<!-- end -->

It also supports collections, relations, lifecycle hooks, attribute renaming, side data loading and much more.
Continue reading for a quick start, check this [presentation](http://www.slideshare.net/MarcinGajda/angular-restmod-46881968) for an overview or check the API Reference for more: http://platanus.github.io/angular-restmod

If you are working with Ruby on Rails, we recommend [active_model_serializers](https://github.com/rails-api/active_model_serializers) for seamless integration.

## Why Restmod?

Restmod brings Rails ActiveRecord's ease of use to the Angular Framework. It succesfuly combines Angular's encapsulated design with Active Record's opinionated style. There are other alternatives available though:

* **$resource:** Might be enough for small projects, included as an Angular opt-in. It only provides a basic model type layer, with limited features.
* **Restangular:** very complete library, but does not propose a model layer and does not support linked resource responses as seen on jsonapi.org.
* **angular-activerecord:** Nice alternative to $resource, still very limited in its functionality.
* **ModelCore:** Inspired in angular-activerecord, provides a more complete set of features but lacks testing.

**Restmod its thoroughly tested against the same platforms as AngularJS using [SauceLabs awesome OpenSauce service!](https://saucelabs.com/opensauce)**

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

or if you prefer, a npm package is also available

```
npm install angular-restmod -d
```

#### 2. Include it on your project

Make sure the restmod source is required in your code.

```html
<script type="text/javascript" src="js/angular-restmod-bundle.min.js"></script>
```

Next, include angular module as one of your app's dependencies

<!-- before: module = $provide; -->
<!-- ignore -->

```javascript
module = angular.module('MyApp', ['restmod'])
```

<!-- end -->

# REST API Integration

Restmod comes bundled with various (well, just one for now) predefined API-style-mixins to choose from depending on your backend configuration.

Check out the [Style listing](https://github.com/platanus/angular-restmod/blob/master/docs/guides/styles.md) for more information. **We are looking for contributors on this!!**

If you dont set a base style a `'No API style base was included'` warning will be generated, see the link above for more information.

If you still need to change some behaviour or if you want to create your own api style, the following configurations are available:

* Common url prefix configuration
* Primary key name configuration
* Json root property configuration
* Json metadata extraction
* Json side data resolving for jsonapi.org style APIs (for apis using 'links')
* Request customization
* Url formatting options

Make sure you read the [Api Integration FAQ](https://github.com/platanus/angular-restmod/blob/master/docs/guides/integration.md) before starting your API integration!

# Basic usage

You begin by creating a new model using the `restmod.model` method. We recommend you to put each model on a separate factory. The first argument for `model` is the resource URL.

```javascript
module.factory('Bike', function(restmod) {
	return restmod.model('/bikes');
});
```

<!-- before: Bike = $injector.get('Bike') -->
<!-- it: expect(Bike).not.toBeNull() -->

The generated model type provides basic CRUD operations to interact with the API:

<!-- section: $find -->

To retrieve an object by ID use `$find`, the returned object will be filled with the response data when the server response is received.

Let's say you have a REST API that responds JSON to a GET REQUEST on /bikes/1

```json
{
	"id": 1,
	"brand": "Trek",
	"created_at": "2014-05-23"
}
```

Then, on your code you would call

```javascript
bike = Bike.$find(1);
```

<!-- section: $then -->

Right after this line executes, the bike object is an empty object. The bike object will be populated as soon as the API returns some data. This works great with Angular's way. Nevertheless, you can use `$then` to do something when data becomes available.

```javascript
bike.$then(function() {
	expect(bike.brand).toBeDefined();
});
```

<!-- it: $httpBackend.flush() -->
<!-- end -->

If you need to pass additional parameters to `$find`, you can use the second function argument.

```javascript
bike = Bike.$find(1, { includeParts: true });
```

<!-- it: $httpBackend.flush(); expect(bike.model).toEqual('Slash') -->
<!-- end -->

<!-- section: $fetch -->

To reload an object use `$fetch`. **WARNING:** This will overwrite modified properties.

<!-- before: bike = Bike.$new(1) -->

```javascript
bike.$fetch();
```

If you only want to retrieve an object data if it hasn't been retrieved yet, use `$resolve` instead of `$fetch`:

```javascript
bike.$resolve();
```

To mark an object as unresolved call `$reset`. You can hook to the `before-resolve` event to add some expiration logic
for resolved objects, just call `$reset` inside the hook to force the object to be retrieved.

Remember to use `$resolve().$asPromise()` if you are returning inside a resolve function.

<!-- it: $httpBackend.flush(); expect(bike.model).toEqual('Slash') -->
<!-- end -->

<!-- section: $collection and $search -->

To retrieve an object collection `$collection` or `$search` can be used.

```javascript
bikes = Bike.$search({ category: 'enduro' });
// same as
bikes = Bike.$collection({ category: 'enduro' }); // server request not yet sent
bikes.$refresh();
```

<!-- it: $httpBackend.flush(); expect(bikes.length).toEqual(2) -->
<!-- end -->

<!-- section: scoped -->

<!-- before: bikes = Bike.$collection({ category: 'enduro' }); -->

<!-- section: $refresh -->

To reload a collection use `$refresh`. To append more results use `$fetch`.

<!-- before:
	$httpBackend.when('GET', '/bikes?category=enduro&page=1').respond([{ model: 'Slash', brand: 'Trek' }]);
	$httpBackend.when('GET', '/bikes?category=enduro&page=2').respond([{ model: 'Meta', brand: 'Commencal' }]);
	$httpBackend.when('GET', '/bikes?category=enduro&page=3').respond([{ model: 'Mach 6', brand: 'Pivot' }]);
-->

```javascript
bikes = Bike.$collection({ category: 'enduro' });
bikes.$refresh({ page: 1 }); // clear collection and load page 1
bikes.$fetch({ page: 2 }); // page 2 is appended to page 1, usefull for infinite scrolls...
bikes.$refresh({ page: 3 }); // collection is reset, page 3 is loaded on response
```

<!-- it: $httpBackend.flush(); expect(bikes.length).toEqual(1) -->
<!-- end -->

<!-- section: $save -->

To update an object, just modify the properties and call `$save`.

```javascript
bike = Bike.$find(1);
bike.brand = 'Trek';
bike.$save();
```

<!-- it: $httpBackend.expectPUT('/bikes/1').respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $save -->

To create a new object use `$build` and then call `$save`. This will send a POST request to the server.

```javascript
var newBike = Bike.$build({ brand: 'Comencal' });
newBike.model = 'Meta';
newBike.$save(); // bike is persisted
```

<!-- it: $httpBackend.expectPOST('/bikes').respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $save patch -->

To patch an object, just modify the properties and call `$save` passing an array of properties to be patched as first argument.

```javascript
bike = Bike.$find(1);
bike.brand = 'Trek';
bike.model = 'Slash';
bike.dim = { width: 10.0, height: 10.0 };
bike.$save(['brand', 'dim']); // will only send brand and dim (every sub property)
```

<!-- it: $httpBackend.expectPATCH('/bikes/1', { brand: 'Trek', dim: { width: 10.0, height: 10.0 } }).respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $save patch nested -->

To specify a single subproperty to be sent in patch, use dot notation:

```javascript
bike = Bike.$find(1);
bike.brand = 'Trek';
bike.model = 'Slash';
bike.dim = { width: 10.0, height: 10.0 };
bike.$save(['dim.height']); // will only send dim.height
```

<!-- it: $httpBackend.expectPATCH('/bikes/1', { dim: { height: 10.0 } }).respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $create on type -->

Or use `$create`

```javascript
var newBike = Bike.$create({ brand: 'Comencal', model: 'Meta' });
```

<!-- it: $httpBackend.expectPOST('/bikes').respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $create on collection -->

If called on a collection, `$build` and `$create` will return a collection-bound object that will be added when saved successfully.

```javascript
newBike = bikes.$create({ brand: 'Comencal', model: 'Meta' });
// after server returns, the 'bikes' collection will contain 'newBike'.
```

<!-- it:
	expect(bikes.length).toEqual(0);
	$httpBackend.expectPOST('/bikes').respond(200, '{}');
	$httpBackend.flush();
	expect(bikes.length).toEqual(1);
-->
<!-- end -->

<!-- section: $reveal -->

To show a non saved object on the bound collection use `$reveal`

```javascript
var newBike = bikes.$create({ brand: 'Comencal', model: 'Meta' }).$reveal();
// 'newBike' is inmediatelly available at 'bikes'
```

<!-- it: expect(bikes.length).toEqual(1); -->
<!-- end -->

<!-- section: $destroy -->

Finally, to destroy an object just call `$destroy`.

```javascript
bike.$destroy();
```
<!-- $httpBackend.expectDELETE('/bikes').respond(200, '{}'); $httpBackend.flush(); -->
<!-- end -->

<!-- section: $destroy on collection -->

As with $create, calling `$destroy` on a record bound to a collection will also remove it from the collection on server response.

<!-- end -->

All REST operations described above use `$q` promises that are fulfilled when the operation succeeds or fails. Take a look at the [promises guide](https://github.com/platanus/angular-restmod/blob/master/docs/guides/promises.md) for more details on this.

<!-- end -->


# Customizing model behaviour

When defining a model, you can pass a **definition object**

```javascript
Bike = restmod.model('api/bikes').mix(
// This is the definition object:
{
	createdAt: { encode: 'date' },
	owner: { belongsTo: 'User' }
}
);
```

<!-- it:
	expect(Bike.$new().owner).toBeDefined();
	expect(typeof Bike.$build({ createdAt: new Date() }).$encode().createdAt).toEqual('string');
-->

The **definition object** allows you to:
* Define **relations** between models
* Customize an attribute's **serialization** and **default values**
* Set model configuration variables.
* Add **custom methods**
* Add lifecycle **hooks**


## Relations

Relations are defined like this:

<!-- before:
	module.factory('User', function() { return restmod.model(); });
	module.factory('Part', function() { return restmod.model(); });
	$httpBackend.when('GET', '/bikes/1/parts').respond([ { id: 1, brand: 'Shimano' }, { id: 2, brand: 'SRAM' } ]);
	$httpBackend.when('GET', '/parts/1').respond({ brand: 'Shimano', category: 'brakes' });
-->

```javascript
Bike = restmod.model('/bikes').mix({
	parts: { hasMany: 'Part' },
	owner: { belongsTo: 'User' }
});
```

<!-- it:
	expect(Bike.$new().owner).toBeDefined();
	expect(Bike.$new().parts).toBeDefined();
-->

There are four types of relations:

#### HasMany

Let's say you have the following 'Part' model:

```javascript
module.factory('Part', function() {
	return restmod.model('/parts');
});
```

The HasMany relation allows you to access parts of a specific bike directly from a bike object. In other words, HasMany is a hierarchical relation between a model instance (bike) and a model collection (parts).

```javascript
Bike = restmod.model('/bikes').mix({
	parts: { hasMany: 'Part' }
});

bike = Bike.$new(1); 			// no request are made to the server yet.
parts = bike.parts.$fetch(); 	// sends a GET to /bikes/1/parts
```

<!-- it:
	$httpBackend.expectGET('/bikes/1/parts');
	$httpBackend.flush();
	expect(parts.length).toEqual(2);
-->

<!-- section: $fetch -->

> Note: this is not necessarily great modeling ... for instance, if you destroy a bike's part `bike.parts[0].$destroy();`, you will be sending a DELETE to the resource in /parts/:id. If this is not what you want, you should consider working with a resource that represents the *relation* between a bike and a Part.

Later on, after 'parts' has already been resolved,

<!-- before: $httpBackend.flush() -->

```javascript
parts[0].$fetch(); // updates the part at index 0. This will do a GET /parts/:id
```

<!-- it:
	$httpBackend.expectGET('/parts/1');
	$httpBackend.flush();
	expect(parts[0].category).toEqual('brakes');
-->
<!-- end -->

<!-- section: $create -->

Calling `$create` on the collection will POST to the collection nested url.

```javascript
var part = bike.parts.$create({ serialNo: 'XX123', category: 'wheels' }); // sends POST /bikes/1/parts
```

<!-- it:
	$httpBackend.expectPOST('/bikes/1/parts').respond(200, {});
	$httpBackend.flush();
-->
<!-- end -->

<!-- section: nested -->

If the child collection model is nested then all CRUD routes for the collection items are bound to the parent.

So if 'Part' was defined like:

```javascript
restmod.model();
```

<!-- section: $fetch -->

The example above would behave like this:

<!-- before:
	bike = restmod.model('/bikes').mix({ parts: { hasMany: restmod.model() } }).$new(1);
	bike.parts.$decode([{ id: 1 }]);
-->

```javascript
console.log(bike.parts[0].$url())
bike.parts[0].$fetch();
```

Will send GET to /bikes/1/parts/:id instead of /parts/:id

<!-- it:
	$httpBackend.expectGET('/bikes/1/parts/1').respond(200, {});
	$httpBackend.flush();
-->

<!-- end -->

##### HasMany Options

The has many relation provides the following options for you to customize its behaviour:

* `path`: will change the relative path used to fetch/create the records. Ex: `{ hasMany: 'Part', path: 'pieces' }`
* `inverseOf`: adds a property on the child object that points to the parent. Ex: `{ hasMany: 'Part', inverseOf: 'bike' }`.
* `params`: optional query string parameters to be used when fetching collection. Ex: `{ hasMany: 'Part', params: { foo: 'bar' } }`.
* `hooks`: you can also define `hasMany` relation hooks. Check the [hooks advanced documentation](https://github.com/platanus/angular-restmod/blob/master/docs/guides/hooks.md) for more information.

<!-- end -->

#### HasOne

This is a hierarchical relation between one model's instance and another model's instance.
The child instance url is bound to the parent url.
The child instance is created **at the same time** as the parent, so its available even if the parent is not resolved.

Let's say you have the following 'User' model:

```javascript
module.factory('User', function() {
	return restmod.model('/users');
});
```

That relates to a 'Bike' through a *hasOne* relation:

```javascript
Bike = restmod.model('/bikes').mix({
	owner: { hasOne: 'User' }
});
```

<!-- section: not nested -->

Then a bike's owner data can then be retrieved just by knowing the bike primary key (id):

```javascript
owner = Bike.$new(1).owner.$fetch();
```

> will send GET /bikes/1/owner

<!-- it:
	$httpBackend.expectGET('/bikes/1/owner').respond(200, {});
	$httpBackend.flush();
-->

<!-- end -->

<!-- section: not nested -->

Since the user resource has its own resource url defined:

<!-- before: owner = Bike.$new(1).owner.$decode({ id: 1 }); -->

```javascript
owner.name = 'User';
owner.$save();
```

<!-- it:
	$httpBackend.expectPUT('/users/1').respond(200, {});
	$httpBackend.flush();
-->

> will send PUT /user/X.

<!-- end -->

<!-- section: nested -->

If 'User' was to be defined like a nested resource:

```javascript
module.factory('User', function() {
	return restmod.model();
});
```

<!-- before:
	owner = restmod.model('/bikes').mix({ owner: { hasOne: 'User' } }).$new(1).owner;
-->

Then calling:

```javascript
owner.name = 'User';
owner.$save();
```

<!-- it:
	$httpBackend.expectPUT('/bikes/1/owner').respond(200, {});
	$httpBackend.flush();
-->

> will send a PUT to /bikes/1/owner

<!-- end -->

##### HasOne Options

The has many relation provides the following options for you to customize its behaviour:

* `path`: will change the relative path used to fetch/create the records. Ex: `{ hasOne: 'Part', path: 'pieces' }`
* `inverseOf`: adds a property on the child object that points to the parent. Ex: `{ hasOne: 'Part', inverseOf: 'bike' }`.
* `hooks`: you can also define `hasOne` relation hooks. Check the [hooks advanced documentation](https://github.com/platanus/angular-restmod/blob/master/docs/guides/hooks.md) for more information.

<!-- ignore -->

#### BelongsTo

This relation should be used in the following scenarios:

1. The api resource references another resource by id:

```javascript
{
	name: '...',
	brand: '...',
	owner_id: 20
}
```

2. The api resource contanis another resource as an inline property and does not provide the same object as a nested url:

```javascript
{
	name: '...',
	brand: '...',
	owner: {
		id: 20,
		user: 'extreme_rider_99'
	}
}
```

When applied, the referenced instance is not bound to the host's scope and is **generated after** server responds to a parent's `$fetch`.

Let's say you have the same 'User' model as before:

```javascript
module.factory('User', function() {
	return restmod.model('/users');
});
```

That relates to a 'Bike' through a *belongsTo* relation this time:

```javascript
Bike = restmod.model('/bikes').mix({
	owner: { belongsTo: 'User', key: 'last_owner_id' } // default key would be 'owner_id'
});
```

Also you have the following bike resource:

```
GET /bikes/1

{
	id: 1,
	brand: 'Transition',
	last_owner_id: 2
}
```

Then retrieving the resource:

```javascript
bike = Bike.$find(1);
```

Will produce a `bike` object with its owner property initialized to a user with id=2, the owner property will only be available **AFTER** server response arrives.

Then calling

```javascript
bike.owner.$fetch();
```

Will send a GET to /users/2 and populate the owner property with the user data.

This relation also support the child object data to come inlined in the parent object data.
The inline property name can be optionally selected using the `map` attribute.

Lets redefine the `Bike` model as:

```javascript
var Bike = restmod.model('/bikes').mix({
	owner: { belongsTo: 'User', map: 'last_owner' } // map would default to *owner*
});
```

And suppose that the last bike resource looks like:

```
GET /bikes/1

{
	id: 1,
	brand: 'Transition',
	last_owner: {
		id: 2
		name: 'Juanito'
	}
}
```

Then retrieving the bike resource:

```javascript
var bike = Bike.$find(1);
```

Will produce a `bike` object with its owner property initialized to a user with id=2 and name=Juanito. As before, the owner property will only be available **AFTER** server response arrives.

Whenever the host object is saved, the reference primary key will be sent in the request using the selected foreign key.

So given the previous model definition, doing:

```javascript
var bike = Bike.$create({ last_owner: User.$find(20) });
```

Will generate the following request:

```
POST /bikes

{
	owner_id: 20
}
```

#### BelongsToMany

This relation should be used in the following scenarios:

1. The api resource references another resource by id:

```javascript
{
	name: '...',
	brand: '...',
	parts_ids: [1,2]
}
```

2. The api resource contains another resource as an inline property and does not provide the same object as a nested url:

```javascript
{
	name: '...',
	brand: '...',
	parts: [
		{ id: 1, user: 'handlebar' },
		{ id: 2, user: 'wheel' }
	]
}
```

When retrieved, the referenced instances will not be bound to the host's scope.

Let's say you have the following 'Part' definition:

```javascript
module.factory('Part', function() {
	return restmod.model('/parts');
});
```

That relates to a 'Bike' through a *belongsToMany* relation this time:

```javascript
Bike = restmod.model('/bikes').mix({
	parts: { belongsToMany: 'Part', keys: 'part_keys' } // default key would be 'parts_ids'
});
```

Also you have the following bike resource:

```
GET /bikes/1

{
	id: 1,
	brand: 'Transition',
	parts_keys: [1, 2]
}
```

Then retrieving the resource:

```javascript
bike = Bike.$find(1);
```

Will produce a `bike` object with the `parts` property containing two **Part** objects with $pks set to 1 and 2 (but empty).


This relation also support the childs object data to come inlined in the hosts object data.
The inline property name can be optionally selected using the `map` attribute.

Given the same **Bike** model as before, lets suppose now that the bike API resource looks like this:

And suppose that the last bike resource looks like:

```
GET /bikes/1

{
	id: 1,
	brand: 'Transition',
	parts: [
		{ id: 1, user: 'handlebar' },
		{ id: 2, user: 'wheel' }
	]
}
```

Then retrieving the bike resource:

```javascript
var bike = Bike.$find(1);
```

Will produce a `bike` object with the `parts` property containing two populated **Part** objects with $pks set to 1 and 2.

Whenever the host object is saved, the references primary keys will be sent in the request using the selected key.

So given the previous model definition, doing:

```javascript
var bike = Bike.$create({ parts: [Part.$find(1), Part.$find(2)] });
```

Will generate the following request:

```
POST /bikes

{
	parts_keys: [1, 2] // remember we changed the keys property name before!
}
```

<!-- ignore -->

## Serialization, masking and default values.

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
var Bike = restmod.model('/bikes').mix({
	createdAt: {decode: 'date_parse' }
});
```

### Encode

 To specify a way of encoding an attribute before you send it back to the server:
Just as with the previous example (decode), you use an Angular Filter. In this example we use the built in 'date' filter.

```javascript
var Bike = restmod.model('/bikes').mix({
	createdAt: {encode:'date', param:'yyyy-MM-dd'}
});
```

On both **encode** and **decode** you can use an inline function instead of the filter's name. It is also possible to bundle an encoder and decoder together using a Serializer object, check the [API Reference](http://platanus.github.io/angular-restmod) for more.

### Attribute masking

Following the Angular conventions, attributes that start with a '$' symbol are considered private and never sent to the server. Furthermore, you can define a mask that allows you to specify a more advanced behaviour for other attributes:

```javascript
var Bike = restmod.model('/bikes').mix({
	createdAt: { ignore: 'CU' }, // won't send on Create or Update
	viewCount: { ignore: 'R' }, // won't load on Read (fetch)
	opened: { ignore: true }, // will ignore in every request and response
});
```

### Default value

You can define default values for your attributes, both static and dynamic. Dynamic defaults are defined using a function that will be called on record creation.

```javascript
var Bike = restmod.model('/bikes').mix({
	wheels: { init: 2 }, // every new bike will have 2 wheels by default
	createdAt: { init: function() {
	 return new Date();
	}}
});
```

### Explicit attribute mapping

You can explicitly tell restmod to map a given server attribute to one of the model's attributes:

```javascript
var Bike = restmod.model('/bikes').mix({
	created: { map: 'stats.created_at' }
});
```

### Volatile attributes

You can define volatile attributes, volatile attributes will be deleted from record instance after being sent to server, this is usefull for things like passwords.

```javascript
var User = restmod.model('/users').mix({
	password: { volatile: true } // make password volatile
});
```

### Nested properties

Sometimes you will need to specify behaviour for nested properties, this is done the same ways as with regular properties using the `.` symbol.

Given the following json response:

```json
{
	"id": 1,
	"serialNo": {
		"issued": "2014-05-05"
	}
}
```

You can add a date decoder for the `issued` property using:

```javascript
var Bike = restmod.model('/bikes').mix({
	'serialNo.issued': { decode: 'date_parse' }
});
```

If the nested property is inside an array, you can reffer to it using the `[]` symbols.

So if the json response looks like this:

```json
{
	"id": 1,
	"tags": [
		{ "name": "endurow", "weight": 20 },
		{ "name": "offroad", "weight": 5 }
	]
}
```

You can add a mapping for the `weight` property to the `size` property using:

```javascript
var Bike = restmod.model('/bikes').mix({
	'tags[].size': { map: 'weight' }
});
```

## Custom methods

A restmod object is composed of three main APIs, the Model static API, the record API and the collection API.

Each one of these APis can be extended using the `$extend` block in the object definition:

For example, the following will add the `pedal` method to every record.

```javascript
var Bike = restmod.model('/bikes').mix({
	$extend: {
		Record: {
			pedal: function() {
			 	this.strokes += 1;
			}
		}
	}
});
```

Even though the `$extend` block is the preferred method to extend a model, for small models it is also possible to
directly define the method in the definition object:

```javascript
var Bike = restmod.model('/bikes').mix({
	'Record.pedal': function() {
	 	this.strokes += 1;
	}
});
```

In the last example the 'Record.' prefix could be omitted because by default methods are added to the record api.

The following API's are available for extension:
* Model: the static api.
* Record: model instances api.
* Collection: model collection instance api.
* Scope: Same as extending Model and Collection
* Resource: Same as extending Record and+ Collection
* List: special api implemented by any record list, including collections

So, to add a static method we would use:

```javascript
var Bike = restmod.model('/bikes').mix({
	$extend: {
		Model: {
			$searchByTeam: function(_team) {
			 	return this.$search({ team: _team });
			}
		}
	}
});
```

It is also posible to override an existing method, to refer to the overriden function use `this.$super`:

```javascript
var Bike = restmod.model('/bikes').mix({
	$extend: {
		Scope: {
			$search: function(_params) {
			 	return this.$super(angular.extend({ time: SomeService.currentTime() }, _params);
			}
		}
	}
});
```

### Custom methods and Lists

A `List` namespace is provided for collections and lists, this enables the creation of chainable list methods.

For example, lets say you need to be able to filter a collection of records and then do something with the resulting list:

```javascript
var Part = restmod.model('/parts').mix({
	$extend: {
		List: {
			filterByCategory: function(_category) {
				return this.$asList(function(_parts) {
					return _.filter(_parts, function(_part) {
						return _part.category == _category;
					});
				});
			},
			filterByBrand: function(_brand) {
				return this.$asList(function(_parts) {
					return _.filter(_parts, function(_part) {
						return _part.brand == _brand;
					});
				});
			},
			getTotalWeight: function(_category) {
				return _.reduce(this, function(sum, _part) {
					return sum + _part.weight;
				};
			}
		}
	}
});
```

Now, since `List` methods are shared by both collections and lists, you can do:

```javascript
Part.$search().filterByCategory('wheels').filterByBrand('SRAM').$then(function() {
	// use $then because the $asList method will honor promises.
	scope.weight = this.getTotalWeight();
});
```

## Hooks (callbacks)

Just like you do with ActiveRecord, you can add hooks on certain steps of the object lifecycle, hooks are added in the `$hooks` block of the object definition.

```javascript
var Bike = restmod.model('/bikes').mix({
	$hooks: {
		'before-save': function() {
			this.partCount = this.parts.length;
		}
	}
});

```
Note that a hook can be defined for a type, a collection or a record. Also, hooks can also be defined for a given execution context using $decorate. Check the [hooks advanced documentation](https://github.com/platanus/angular-restmod/blob/master/docs/guides/hooks.md).

# Mixins

To ease up the definition of models, and keep things DRY, Restmod provides you with mixin capabilities. For example, say you already defined a Vehicle model as a factory:

```javascript
Angular.factory('Vehicle', function() {
	return restmod.model('/vehicle').mix({
		createdAt: {encode:'date', param:'yyyy-MM-dd'}
	});
})
```

You can then define your Bike model that inherits from the Vehicle model, and also sets additional functionality.

```javascript
var Bike = restmod.model('/bikes').mix('Vehicle', {
	pedal: function (){
		alert('pedaling')
	}
});

```

<!-- end -->

Some links:

REST api designs guidelines: https://github.com/interagent/http-api-design
REST json api standard: http://jsonapi.org

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Check [CONTRIBUTORS](https://github.com/platanus/angular-restmod/blob/master/CONTRIBUTE.md) for more details

## Credits

Thank you [contributors](https://github.com/platanus/angular-restmod/graphs/contributors)!

<img src="http://platan.us/gravatar_with_text.png" alt="Platanus" width="250"/>

angular-restmod is maintained by [platanus](http://platan.us).

## License

Angular Restmod is © 2015 platanus, spa. It is free software and may be redistributed under the terms specified in the LICENSE file.
