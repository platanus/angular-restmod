
Model building in restmod is done via the `$restmod` service.

The service provides two methods: `model` is used to build new models and `mixin` to build mixins. More on **mixins** later.


## Simple model building

Basic model building looks like this

```javascript
var Model = $restmod.model('/model-base-url');
```

The first and only required parameter is the base url for the model, if null is given then the model is considered unbound.

Unbound models can only be fetched/created/updated when bound to other models (via a relation).

Refer to Model usage for information about how to use the generated model.


## Advanced model building

Restmod offers two ways of customizing a model's behaviour, both are used by passing the required parameters to the `model` function after the base url parameter.

### The builder DSL

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

For more information about available builder functions check the ModelBuilder class documentation.

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


## The mixin chain

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

### The global mixin chain

It is also posible to define a common mixin chain for all models in the application, this is done using the `pushModelBase` method available at the $restmodProvider provider in the configuration stage.


## Extending the DSL

DSL extension is done using the mixin mechanism and the `extend` builder method.

For example, building a simple extension will look like this:

The using the extension is only a matter of putting the extension's mixin in a model's mixin chain (before it is used).


