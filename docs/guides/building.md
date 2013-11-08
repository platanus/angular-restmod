
Model building in restmod is done via the `angular.restmod.model` and `angular.restmod.mixin` methods.

In some cases you will need to directly use the `$restmod` service to create new models.

## Simple model building

Basic model building looks like this

```javascript
// TODO
```

The first parameter to `model` is the factory name, this will be the name with which the model will be registered in the injector.

The second parameter is the base url for the model, if null is given then the model is considered unbound.

Unbound models can only be fetched/created/updated when bound to other models (via a relation).

Refer to Model usage for information about how to use the generated model.

## Advanced builder DSL

Restmod offers two ways of customizing a model's behaviour, both are used by passing the required parameters to the `model` function after the base url parameter.

### The model definition object

It is posible to provide an object that configures the way model properties behave.

```javascript
angular.restmod.model('Bike', 'api/bikes', {
	created_at: { serialize: 'RailsDate' }, // set a serializer
	views: { init: 0 }, // set a default value
	parts: { hasMany: 'Part' } // set a relation with another model
});
```

For more information about available property modifiers check the {@link ModelBuilder} class documentation.

Some plugins also add additional modifiers.

Property modifiers map directly to builder DSL methods, but not every builder method is available as a property behavior modifier. The model definition object only provides a subset of the available builder DSL methods.

### The builder DSL

If a function is given to `model` instead of an object, then the function is called in the builder context.

```javascript
// TODO
```

Even though the preferred way of customizing a model is using the definition object, some builder methods like `beforeCreate`can only be accesed through the builder context.

For more information about available builder functions check the ModelBuilder class documentation.

## The mixin chain

You are not restricted to use only one way of building, multiple object and function blocks can be passed to the `model` function and are processed sequentially by the model builder. This is called the mixin chain.

In addition to definition objects and functions, the mixin chain also allows for model or mixin names, if a name is given, the model/mixin is looked up using the injector and its mixin chain is injected in the current chain.

```javascript
// Example using multiple
angular.restmod.model('MountainBike', 'api/bikes',
'Vehicle'
{
	brakes: { serialize: 'Brakes' },
}, function() {
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


