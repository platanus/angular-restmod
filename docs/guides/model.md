
**IMPORTANT**: This guide is deprecated!!

$restmod provides two levels of model interaction, through collections and instances.

The model type is considered the base collection and is limited to certain collection methods.

This guide will use the following model definition in examples.

```javascript
Bike = $restmod.model('/bikes');
```

## General Considerations

### Asyncronic operations

All asynchronic server operations return inmeditelly:

* If the operation is expected to return an object (as in {@link ModelCollection#$create} or {@link ModelCollection#$find}) it will return an unresolved object that will be filled with data when the server responds.
* If the operation is expected to update the object data (as in {@link Model#$fetch}) it will update the object properties when the server responds.
* If the operations returns a collection (as in {@link ModelCollection#$search}) it will return an empty collection that will be filled when the server responds.

There are several properties that can be queried to track an object request status:

* It is posible to query the resolve status of an object using the `$pending` property, it is set to true when a request starts and back to false when it ends.
* Its also posible to access the last request response object through the `$response` property.
* If the last response was an error then the `$error` property will be true.

Special care shoult be taken when using these properties since they apply only to the last request. To track more than one request is better to use promises.

### Promises

The `$promise` property of an object (model instance or collection) contains the promise made by that object's last request, it can be accessed directly or using the shorthand methods {@link Model#$then} and {@link Model#$finally}. The aforementioned methods both change the last promise property and return the object instance so they can be chained.

```javascript
Bike.$find(1).$then(function(_bike) {
	alert('success');
}).$finally(function(_bike) {
	alert('always');
});
```

## CRUD Operations

Building a new model instance is done using the {@link ModelCollection#$build} method, the build method will not generate any request.

```javascript
var bike = Bike.$build({ brand: 'Giant', model: 'Anthem' });
```

**IMPORTANT** do not use the default type constructor directly unless you have read the {@link Model} documentation.

Creating a model instance can be done using the {@link ModelCollection#$create} method, it is called using the collection's base url. If using the type directly then the model's base url is used.

```javascript
var bike = Bike.$create({ brand: 'Giant', model: 'Anthem' }); // will send a POST to /bikes
```

It is also posible to save an already built object:

```javascript
var bike = Bike.$build({ brand: 'Giant', model: 'Anthem' });
bike.$save(); // will send POST to /bikes
```

Retrieving an objects is done using the {@link ModelCollection#$find} method.

```javascript
var bike = Bike.$find(22); // will send a GET to /bikes
```

To update an object just modify the required properties and call {@link ModelCollection#$save}, if object is bound (has an id) it will be updated, if not it will be created.

```javascript
var bike = Bike.$find(22); // will send GET to /bikes
console.log(bike.id); // should print out 22
bike.brand = 'Trek';
bike.$save(); // will send a PUT to /bikes/22
```

## Collections

TODO

## Relations

TODO
