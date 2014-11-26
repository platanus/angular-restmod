# Hooks

Just like ActiveRecord in Rails, RestMod lets you modify a model's behavior using a wide range of hooks. The hooks are placed on the model's lifecycle key points.

##### 1. Hooks that apply to every record and collection of a given Model
This is the most ActiveRecord'ish approach
```javascript
var Bike = $restmod.model('/bikes', {
  $hooks: {
	  'before-save': function() {
	    this.partCount = this.parts.length;
	  }
	}
});
```
##### 2. Hooks that apply only to a particular record

It's also possible to modify only a single record's (model instance) behavior.

```javascript
var bike = Bike.$new();
bike.$on('before-save', function() {
  this.partCount = this.parts.length;
});
```

##### 3. Hooks that apply only to a certain collection and its records

You can catch collection related events by attaching hooks directly to a collection:

```javascript
var bikes = Bike.$collection();
bikes.$on('after-fetch-many', function() {
  this.redBikesCount = this.countBikes({color:'red'});
});
bikes.$fetch(); // this call will trigger the hook defined above
```

Note that Hooks that are defined at the collection level will also catch the contained record's events.

```javascript
var bikes = Bike.$collection();
bikes.$on('before-save', function() {
  this.partCount = this.parts.length;
});
bike = bikes.$new();
bike.$save(); // this call will trigger the hook defined above
```

##### 4. Hooks that apply to a relation object

The `hasMany` and `hasOne` relations support hooks, these can be defined in the relation definition or in the type config block

In the relation definition:

```javascript
var Bike = $restmod.model('/bikes'.$mix({
	parts: {
		hasMany: 'Part',
		hooks: {
			'after-fetch-many': function() { /* do something with the new parts */ }
		}
	}
});
```

or in the configuration block (applies to every relation where the extended class is the **NESTED** resource):

```javascript
Var Part = $restmod.model().$mix({
	$config {
		hasMany: {
			hooks: {
				'after-has-many-init': function() {
					// Here we are using the init hook to override every hasMany Part relation scope.
					// This can be useful if a custom url scheme is needed for relations.
					this.$scope = customScope(this.$scope);
				}
			}
		}
	}
})
```

To access the owner object inside a relation hook, use the child object's `$owner` property:

```javascript
var Bike = $restmod.model('/bikes').$mix({
	parts: {
		hasMany: 'Part',
		hooks: {
			'after-fetch-many': function() {
				this.$owner.partsCount = this.length; // update the owner partCount every time the relation is fetched!
			}
		}
	}
});
```

Both `hasOne` and `hasMany` trigger an special event after hooks are added to the child resource, this enables you to specify some
logic to be run after relation resource is initialized (since hooks are added AFTER `after-init` and `after-collection-init` are triggered).
* `hasMany` triggers `after-has-many-init` after `after-collection-init`.
* `hasOne` triggers `after-has-one-init` after `after-init`.


##### 5. Hooks that apply only to a certain execution context using `$decorate`, used mainly to modify a method behaviour

```javascript
var Bike = $restmod.model('/bikes', {
	// Modify $fetch so it uses POST instead of GET:
	$fetchWithPost: function(_params) {
		return this.$decorate({
		  'before-request': function(_req) {
        _req.method = 'POST';
        _req.data = _params;
			}
		}, function() {
			// every method from same context called inside this function will be decorated.
			return this.$fetch();
		});
	}
});
```

#### Object lifecycle

When calling `$new` to generate a new record:

| Event's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| after-init            |                 | record           |

For `$fetch` on a record:

| Event's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| before-fetch          | http-request    | record           |
| before-request        | http-request    | record           |
| after-request[-error] | http-response   | record           |
| after-feed            | raw record data | record           | (only called if no errors)
| after-fetch[-error]   |   http-response | record           |

For `$fetch` on a collection:

| Event's name                | parameters          | 'this' refers to | notes
| -------------------------- | ------------------- | ---------------- | ---
| before-fetch-many          | http-request        | collection       |
| before-request             | http-request        | collection       |
| after-request[-error]      | http-response       | collection       |
| after-feed                 | raw collection data | collection       | (only called if no errors)
| after-fetch-many[-error]   | http-response       | collection       |

For `$save` when record is new (creating):

| Event's name           | parameters        | 'this' refers to | notes
| --------------------- | ----------------- | ---------------- | ---
| before-render         | serialized record | record           | allows modifiying serialized record data before is sent to server
| before-save           | http-request      | record           |
| before-create         | http-request      | record           |
| before-request        | http-request      | record           | only called if no errors
| after-request[-error] | http-response     | record           |
| after-feed            | serialized record | record           | only called if no errors and if server returned data
| after-add             | record            | collection       | only called if record belongs to a collection and has not been revealed yet
| after-create[-error]  | http-response     | record           |
| after-save[-error]    | http-response     | record           |

For `$save` when record is not new (updating):

| Event's name           | parameters        | 'this' refers to | notes
| --------------------- | ----------------- | ---------------- | ---
| before-render         | serialized record | record           | allows modifiying serialized record data before is sent to server
| before-save           | http-request      | record           |
| before-update         | http-request      | record           |
| before-request        | http-request      | record           | only called if no errors
| after-request[-error] | http-response     | record           |
| after-feed            | serialized record | record           | only called if no errors and if server returned data
| after-update[-error]  | http-response     | record           |
| after-save[-error]    | http-response     | record           |

For `$destroy`:

| Event's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| before-destroy        | http-request    | record           |
| before-request        | http-request    | record           |
| after-request[-error] | http-response   | record           |
| after-remove          | record          | collection       | only called if record belongs to a collection
| after-destroy[-error] |   http-response | record           |

Notes:
* The **before-request** hooks can be used to modify the request before is sent.
* The **after-request[-error]** hooks can be used to modify the request before processed by model.


### Defining custom events
Additional events can be triggered by user defined methods using the `$dispatch` method
