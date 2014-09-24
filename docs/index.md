Angular Restmod
===============

Welcome to the restmod reference page!

For a quick usage reference checkout the [README](https://github.com/platanus/angular-restmod/blob/master/README.md)

## Main Components

### The **restmod** service

The main entry point for the library is the [restmod service](restmod.html). This service provides the `model` factory method that allow creation of new models via the builder DSL.

There is also a [restmod provider](restmodProvider.html) that allows some global configuration of models.

### The Model Builder API

The model builder provides a rich DSL used to describe new model types. There is also support for builder extensions!

An extensive description of the builder usage and options can be found in the [BuilderApi](BuilderApi.html) section.

### The Model Type

Every call to `restmod.model` generates a new model type.

Every instance of the model is called a record, every record has its own set of instance methods, check the [RecordApi](RecordApi.html) section for reference.

The model type has a set of static methods, these are listed in the [StaticApi](StaticApi.html) section.

### The Collection Type

For every model type there is also a collection type, the collection type holds a set of records bound to a given resource url.

The collection type also has a rich set of instance methods described in the [CollectionApi](CollectionApi.html) section.

Im also looking forward on moving the docs to docular when non-root support and client side routing are supported.

### Mixins

The restmod lib includes a couple of mixins that can be included in the project to extend the default behaviour of generated models:

* [PagedModel](PagedModel.html): basic paging support, included in **plugins/paged.js**. (very basic)
* [DirtyModel](DirtyModel.html): change tracking for record properties, included in **plugins/dirty.js**.
* [DebouncedModel](DebouncedModel.html): provides a debounced/throttled implementation of $save, included in **plugins/debounced.js**. (DEPRECATED: To be moved to a separate library!)
* [Shared](SharedModel.html): shared record instances, included in **plugins/shared.js**.
* [FindMany](FindMany.html): batch find by id using the `$populate` method, included in **plugins/find-many.js**.
* [Preload](Preload.html): reference relation eager loading via the `$preload` method, included in **plugins/preload.js**.

Check the [restmod service](restmod.html) docs for more information about mixin creation.
