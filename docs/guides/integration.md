# API Integration FAQ

Make sure you read all of the following Q&A before you start integrating your API:

* [How can I change the property used for the primary key](#q1)
* [How do I handle a wrapped response object? (json root object)](#q2)
* [How can I extract response metadata from the root object?](#q3)
* [Does restmod supports linked elements side loaded in the response wrapper?](#q4)
* [My resource properties are being automatically renamed, is this normal?](#q5)
* [Are there any other conventions related to naming I should be aware of?](#q6)
* [How can I set a common url prefix for every resource?](#q7)
* [How can I add a trailing slash or extension to the url sent to server?](#q8)
* [How can I add Ia custom header or parameter to every request?](#q9)
* [I'm getting a 'No API style base was included' warning, what does it mean?](#q10)

### <a name="q1"></a> How can I change the property used for the primary key

The primary key is just a model configuration property and by default is set to 'id'.

To change it for a particular model use the configuration property:

```javascript
restmod.model('/bikes', {
	PRIMARY_KEY: '_id'
});
```

Or for every model, just set a base model definition using `rebase`:


```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		PRIMARY_KEY: '_id'
	});
});
```

### <a name="q2"></a> How do I handle a wrapped response object? (json root object)

In restmod response wrapping is handled by the configured **packer**, by default no packer is configured so records and collections are expected at response root level.

Restmod comes with a default packer that should handle most situations, to enable the default packer set the `PACKER` configuration property:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		PACKER: 'default'
	});
});
```

This will enable json root wrapping and by default it will use the resource's name for single records and the resource's plural name for collections.

So doing:

```javascript
restmod.model('/api/bikes').$search();
```

Will expect:

```json
{
	"bikes": [{ "id": 1, "brand": "Trek" }]
}
```

And doing:


```javascript
restmod.model('/api/bikes').$find(1);
```

Will expect:

```json
{
	"bike": { "id": 1, "brand": "Trek" }
}
```

The resoure's name is extracted from the resource url, if no url is given (anonymous resource) or if url does not match the resource's name, then you can change it's name and plural name by setting the `NAME` and `PLURAL` configuration variables:

```javascript
restmod.model(null, function() {
	NAME: 'mouse', // if you only set NAME, then plural is infered from it using the inflector.
	PLURAL: 'mice'
});
```

It's also posible to change the root property name without changing the resource name by setting the `JSON_ROOT_SINGLE`, `JSON_ROOT_MANY` or the `JSON_ROOT` (both single and many) configuration properties. This should only be used when the properties are fixed or not named after the resource.

### <a name="q3"></a> How can I extract response metadata from the root object?

Take a look at the [previous question](#q2) first and set up the default packer.

By default, the default packer extracts metadata from the `meta` root property and stores it in the record's (or collection's) `$metadata` property.

So, the following response to a collection's `$fetch`:

```json
{
	"bikes": [{
		"user_id": 1,
		"part_ids": [1, 2, 3]
	}],
	"meta": {
		"page": 1
	}
}
```

Will put `{ page: 1 }` in the collection's `$metadata` property.

To change the property from where the packer extracts the metadata set the `JSON_META` configuration property. Set it to '.' to extract metadata from root, so given:


```json
{
	"bikes": [{
		"user_id": 1,
		"part_ids": [1, 2, 3]
	}],
	"page": 1
}
```

```javascript
var Bike = restmod.model('/api/bikes', {
	PACKER: 'default',
	JSON_META: '.'
});

Bike.$search().$then(function(_colection) {
	_colection.$meta; // = { page: 1 } it will ignore response's bikes property.
})
```

### <a name="q4"></a> Does restmod supports linked elements side loaded in the response wrapper?

Yes it does, at least if its formated similar to what active_model_serializer generates.

Take a look at the [wrapped response question](#q2) first and set up the default packer.

By default, the default packer will expect inlined resources to come in a property named `linked` (jsonapi.org standard).

The following example shows a simple use case scenario:

Given the following api response for the resource `/api/bikes/:id`

```json
{
	"bike": {
		"user_id": 1,
		"part_ids": [1, 2, 3]
	},
	"linked": {
		"users": [
			{ "id": 1, "name": "Joe", "role": "admin" }
		],
		"parts": [
			{ "id": 1, "name": "handlebar" },
			{ "id": 2, "name": "lever" },
			{ "id": 3, "name": "wheel" }
		]
	}
}
```

The following model definition should correctly load every resource:

```javacript
var Base = restmod.mixin({
	PACKER: 'default' // remember to enable the default packer.
});

var User = restmod.model('/api/users', Base);
var Part = restmod.model('/api/parts', Base);

var Bike = restmod.model('/api/bikes', Base, {
	user: { belongsTo: User },
	parts: { belongsToMany: Part }
})

// Then calling
bike = Bike.$find(1).$then(function() {
	bike.user.name; // = Joe
});
```

To change the property where the inlined resources are located set the JSON_LINKS configuration property or set it to '.' to extract links from root.

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase(function() {
		this.setProperty('jsonLinks', 'links'); // or set JSON_LINKS: 'links' in a definition object.
	});
});
```

Take a look at the default naming stardards, inlined resources are expected to use the **pluralized** names for their respective model names. See. By default the name is extracted from the url, you can change a model's name and plural name by setting the `NAME` and `PLURAL` configuration variables:

```javascript
restmod.model(null, function() {
	NAME: 'mouse', // if you only set NAME, then plural is infered from it.
	PLURAL: 'mice'
});
```

### <a name="q5"></a> My resource properties are being automatically renamed, is this normal?

That is probably because the api style you selected has registered a property renamer.

You can disable renaming or change the renamer by using the following builder methods:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase(function() {
		this.setRenamer(false); // remove the current renamer
		this.setRenamer({  // set another renamer
			decode: function(_name) { return _newName; },
			encode: function(_name) { return _newName; }
		});
	});
});
```

### <a name="q6"></a> Are there any other conventions related to naming I should be aware of?

One last one!

By design, restmod will ignore response properties that start with '$' and won't send in requests local properties that start with '$'. This cannot be disabled.

To handle API's that require '$' prefixed properies you have two posibilities:

1. Change the name decoder so it renames properties that start with '$' and gives them another prefix and then change the name encoder to detect the special prefix and change it back to '$':

	```javascript
	module.config(function(restmodProvider) {
		restmodProvider.rebase(function() {
			this.setNameDecoder(function(_name) {
				// change prefix to '_'
				return _name.charAt(0) == '$' ? '_' + inflector.camelize(_name.substr(1), true) : inflector.camelize(_name);
			});

			this.setNameEncoder(function(_name) {
				// change prefix back to '$'
				return _name.charAt(0) == '_' ? '$' + inflector.parameterize(_name.substr(1), '_') : inflector.parameterize(_name, '_');
			});
		});
	});
	```

2. if there are only a couple of properties you need to let through, assign a special mapping to those properties:

	```javascript
	restmod.model(null {
		myType: { map: '$type' },
		myName: { map: '$name' }
	})
	```

### <a name="q7"></a> How can I set a common url prefix for every resource?

You can user the `URL_PREFIX` configuration property, like this:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		URL_PREFIX: '/api/v1' // or use setProperty('urlPrefix', '/api/v1') in a definition function
	});
});
```

### <a name="q8"></a> How can I add a trailing slash or extension to the url sent to server?

You can hook to the `before-request` event and modify the url before is sent, restmod will remove trailing slashes from generated urls before this hook is called, so slashes appended here will be sent.

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		'~before-request': function(_req) {
			// _req is just a $http configuration object.
			_req.url += '.json';
		}
	});
});
```

You can read more about hooks and object lifecycle in the [Hooks Guide](https://github.com/platanus/angular-restmod/blob/master/docs/guides/hooks.md).

### <a name="q9"></a> How can I add a custom header or parameter to every request?

Same as before, you can hook to the `before-request` event:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		'~before-request': function(_req) {
			_req.headers = angular.extend(_req.headers, { 'X-My-Header': 'imateapot!' });
		}
	});
});
```

### <a name="q10"></a> I'm getting a 'No API style base was included' warning, what does it mean?

Restmod expect you to use a base API style for your models, you should include one of the included styles or create a new one:

For example to use the active_model_serializer style you should include the `/dist/styles/ams.min.js` file in your project and then:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase('AMSApi');
});
```

or to define your own style do:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase({
		STYLE: 'MyDjangoStyle', // By setting the STYLE variable the warning is disabled.
		PRIMARY_KEY: '_id'
		/* other style related configuration */
	});
});
```

To see available styles checkout the [Style listing](https://github.com/platanus/angular-restmod/blob/master/docs/guides/styles.md).


