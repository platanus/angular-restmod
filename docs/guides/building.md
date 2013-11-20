
Model building in restmod is done via the `$restmod` service.

The service provides two methods: `model` is used to build new models and `mixin` to build mixins. More on **mixins** later.

## Simple model building

Basic model building looks like this

```javascript
angular.module('test').factory('MyModel', function($restmod) {
	return $restmod.model('/model-base-url');
});
```

It's recommended to put models inside factories, this is usefull later when defining relations and inheritance, since the angular $injector is used by these features. It's also the angular way of doing things. This guide will skip the factory code in examples for simplicity sake.

The first and only required parameter is the base url for the model, if null is given then the model is considered unbound.

Unbound models can only be fetched/created/updated when bound to other models (via a relation).

Refer to {@tutorial model} for information about how to use the generated model.

## Advanced model building

Restmod offers two ways of customizing a model's behaviour, **definition blocks** and **definition objects**, both are used by passing the required parameters to the `model` function after the base url parameter.

### Model definition blocks

If a function is given to `model`, then the function is called in the builder context (`this` points to the builder).

```javascript
$restmod.model('/model-base-url', function() {
	this.attrMask('createdBy', SyncMask.DECODE) // Set an attribute mask
		.attrDefault('createdBy', 'This is read only') // Set an attribute default value
		.beforeSave(function() { // Set a model hook
			alert('model will be saved!')
		});
});
```

Even though the preferred way of customizing a model is using the definition object, some builder methods like `beforeCreate`can only be accesed through the builder context.

For more information about available builder functions check *The Builder DSL* section below and the ModelBuilder class documentation.

### The model definition object

It is also posible to provide an plain object to the `model` method. This object will be treated as a model definition.

A model assigns one or more modifiers to model instance properties.

```javascript
$restmod.model('api/bikes', {
	created_at: { serialize: 'RailsDate' }, // set a serializer
	createdBy: { init: 'This is readonly', mask: SyncMask.DECODE }, // set a default value and a mask
	parts: { hasMany: 'Part' } // set a relation with another model built by a factory called 'Part'
});
```

Property modifiers map directly to builder DSL functions, so using

```javascript
$restmod.model('', {
  prop: { init: 20 }
});
```

Is equivalent to

```javascript
$restmod.model('', function() {
  this.attrDefault('prop', 20);
}
```

For more information about available property modifiers check the {@link ModelBuilder} class documentation.

Some plugins also add additional modifiers.

Property modifiers map directly to builder DSL methods, but not every builder method is available as a property behavior modifier. The model definition object only provides a subset of the available builder DSL methods.

### The mixin chain

You are not restricted to use only one building method, multiple object and function blocks can be passed to the `model` function and are processed sequentially by the model builder. This is called the mixin chain.

In addition to definition objects and functions, the mixin chain also allows for model or mixin names, if a name is given, the model/mixin is looked up using the injector and its mixin chain is injected in the current chain.

```javascript
// Example using multiple mixins
$restmod.model('api/bikes',
'Vehicle', // inject Vehicle mixin chain first
// Then a model definition object
{
	brakes: { serialize: 'Brakes' },
},
// Finally a model definition block
function() {
	this.beforeCreate(function() {

	});
})
```

#### The global mixin chain

It is also posible to define a common mixin chain for all models in the application, this is done using the `pushModelBase` method available at the $restmodProvider provider in the configuration stage.

## The builder DSL

### Defaults

A default value can be given to any model property, this is done via de `init` property modifier. Check the {@link ModelBuilder#attrDefault} docs for more information.

```javascript
var Model = $restmod.model(null, {
	owner: { init: 'anonymous' }
};
```

If a function is provided then it will be evaluated every time a model instance is created and its return value assigned to the property.

### Property transformation

It is posible to specify how a given property is serialized or deserialized using the `encode` or `decode` property modifiers respectively. This modifiers take a filter name or a function and applies it to the property value during transformation. Check the {@link ModelBuilder#attrDecoder} and {@link ModelBuilder#attrEncoder} docs for more information.

```javascript
var Model = $restmod.model(null, {
	createdAt: { encode: 'date', param: 'yyyy-MM-dd' }, // use the angular date filter to serialize
	sku: { decode: function(v) { return v.replace(/[^\d]+/,''); } } // use an inline function to deserialize
});
```

Another way of specifying how a property is serialized is using a serializer. A serializer is an object that defines al least a decode or an encode method (or both). The methods are called with the property value and are expected to return a new value. The `serialize` modifier can be used to define a Serializer, if a *string* is given then the angular injector is used to load the required serializer by appending 'Serializer' to the given string. Check the {@link ModelBuilder#attrSerializer} docs for more information.

```javascript
var Model = $restmod.model(null, {
	createdAt: { serialize: 'date' }, // will search for a 'DateSerializer' in the current injector.
	sku: {
		// use an inline serializer
		serialize: {
			encode: function(v) { return v + '!' },
			decode: function(v) { return v.replace(/[^\d]+/,''); }
		}
	}
});
```

### Masks

Masks can be used to prevent certain properties to be sent to or loaded from the server. They specify a set actions a property is masked from. Available mask values are enumerated in the {@link SyncMask} constant and can be combined using bit operations.

Masks can be specified using the `mask` or `ignore` property modifiers. Check the {@link ModelBuilder#attrMask} docs for more information.

```javascript
var Model = $restmod.model(null, {
	viewed: { mask: true }, // the property value is never sent to or loaded from the server.
	createdAt: { mask: SyncMask.ENCODE }, // this property value is never sent to the server (but it is loaded from)
	createdBy: { mask: SyncMask.ENCODE_UPDATE } // this property value is not sent to the server during an update
});
```

### Defining relations

Relations can be specified between models using the `hasMany` and `hasOne` modifiers. Check the {@link ModelBuilder#hasMany} and {@link ModelBuilder#hasOne} docs for more information.

```javascript
angular.module('test')
	.factory('Part', function($restmod) {
		return $restmod.model(null);
	})
	.factory('Bike', function($restmod) {
		return $restmode.model('/bikes', {
			parts: { hasMany: 'Part' }
		});
	});
```

More about relations in the {@tutorial model} guide.

### Hooks

A model behavior can be modified using a wide range of hooks provided by restmod. The hooks are placed on model's lifecycle key points and can be used to modify/extend the model behavior.

```javascript
var Model = $restmod.model(null, function() {
	// make a property undefined after every save.
	this.on('after-save', function() {
		delete this.sendOnce;
	});
};
```

Notes:
* The before-request hooks can be used to modify the request before is sent.
* The after-request[-error] hooks can be used to modify the request before processed by model.
* The model builder provides a set of shorthand methods to subscribe to the most common hooks

Additional hooks can be called by user defined methods using the `$callback` method

#### Object lifecycle hooks

For `$fetch`:

* before-fetch
* before-request
* after-request[-error]
* after-feed (only called if no errors)
* after-fetch[-error]

For `$fetch` on a collection:

* before-fetch-many
* before-request
* after-request[-error]
* after-feed (only called if no errors)
* after-fetch-many[-error]

For `$save` when creating:

* before-render
* before-save
* before-create
* before-request
* after-request[-error]
* after-feed (only called if no errors)
* after-create[-error]
* after-save[-error]

For `$save` when updating:

* before-render
* before-save
* before-update
* before-request
* after-request[-error]
* after-feed (only called if no errors)
* after-update[-error]
* after-save[-error]

For `$destroy`:

* before-destroy
* before-request
* after-request[-error]
* after-destroy[-error]

### Adding new methods and actions

Methods can be added or overriden both in model instances and model collections using the builder {@link ModelBuilder#define} and the {@link ModelBuilder#classDefine} respectively. Methods that override another method through these functions will have access to the this.$super property that points to the old method (prebound, so its not necessary to call this.$super.call).

```javascript
$restmod.model(null, function() {
	// add the $create method to model instances
	this.define('$create', function() {
		this.id = undefined;
		return this.$save();
	});

	// override model collection's $fetch method
	this.classDefine('$fetch', function() {
		this.$super({ forceParam: 'This parameter will be included in all fetch requests' });
	});
});
```

It is also posible to add or override a model **instance** method using a definition object

```javascript
$restmod.model(null, {
	$create: function() {
		this.id = undefined;
		return this.$save();
	}
});
```

### Extending the DSL

**UNDER CONSTRUCTION**

DSL extension is done using the mixin mechanism and the `extend` builder method.

For example, building a simple extension will look like this:

The using the extension is only a matter of putting the extension's mixin in a model's mixin chain (before it is used).

**UNDER CONSTRUCTION**


