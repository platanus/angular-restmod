
Model building in restmod is done via the `restmod` service.

The service provides two methods: `model` is used to build new models and `mixin` to build mixins. More on **mixins** later.

## Simple model building

Basic model building looks like this

```javascript
angular.module('test').factory('MyModel', function(restmod) {
	return restmod.model('/model-base-url');
});
```

It's recommended to put models inside factories, this is usefull later when defining relations and inheritance, since the angular $injector is used by these features. It's also the angular way of doing things. This guide will skip the factory code in examples for simplicity sake.

The first and only required parameter is the base url for the model, if null is given then the model is considered nested.

Nested models can only be fetched/created/updated when bound to other models (using a relation).

Refer to {@tutorial model} for information about how to use the generated model.

## Advanced model building

Restmod offers two ways of customizing a model's behaviour, **definition blocks** and **definition objects**, both are used by passing the required parameters to the `Model.mix` static method.

### Model definition blocks

If a function is given to `model`, then the function is called in the builder context (`this` points to the builder).

```javascript
restmod.model('/model-base-url').mix(function() {
	this.attrMask('createdBy', 'R') // Set an attribute mask
		.attrDefault('createdBy', 'This is read only') // Set an attribute default value
		.on('before-save', function() { // Set a model hook
			alert('model will be saved!')
		});
});
```

Even though the preferred way of customizing a model is using the definition object, some builder methods like `extend`can only be accesed through the builder context.

For more information about available builder functions check the ModelBuilder class documentation.

### The model definition object

It is also posible to provide an plain object to the `model` method. This object will be treated as a model definition.

A model assigns one or more modifiers to model instance properties.

```javascript
restmod.model('api/bikes').mix({
	created_at: { serialize: 'RailsDate' }, // set a serializer
	createdBy: { init: 'This is readonly', mask: 'R' }, // set a default value and a mask
	parts: { hasMany: 'Part' } // set a relation with another model built by a factory called 'Part'
});
```

Property modifiers map directly to builder DSL functions, so using

```javascript
restmod.model('').mix({
  prop: { init: 20 }
});
```

Is equivalent to

```javascript
restmod.model('').mix(function() {
  this.attrDefault('prop', 20);
}
```

For more information about available property modifiers check the {@link BuilderApi} documentation.

Some plugins also add additional modifiers.

Property modifiers map directly to builder DSL methods, but not every builder method is available as a property behavior modifier. The model definition object only provides a subset of the available builder DSL methods.

### The mixin chain

You are not restricted to use only one building method, multiple object and function blocks can be passed to the `mix` function and are processed sequentially by the builder. This is called the mixin chain.

In addition to definition objects and functions, the mixin chain also allows for model or mixin names, if a name is given, the model/mixin is looked up using the injector and its mixin chain is injected in the current chain.

```javascript
// Example using multiple mixins
restmod.model('api/bikes').mix('Vehicle', // inject Vehicle mixin chain first
// Then a model definition object
{
	brakes: { serialize: 'Brakes' },
},
// Finally a model definition block
function() {
	this.on('before-create', function() {

	});
})
```

#### The global mixin chain

It is also posible to define a common mixin chain for all models in the application, this is done using the `rebase` method available at the restmodProvider provider in the configuration stage.

### Extending the DSL

**UNDER CONSTRUCTION**

DSL extension is done using the mixin mechanism and the `extend` builder method.

For example, building a simple extension will look like this:

The using the extension is only a matter of putting the extension's mixin in a model's mixin chain (before it is used).

**UNDER CONSTRUCTION**


