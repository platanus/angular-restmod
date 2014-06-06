# Hooks

Just like ActiveRecord in Rails, RestMod lets you modify a model's behavior using a wide range of hooks. The hooks are placed on the model's lifecycle key points.

##### 1. Hooks that apply to every record and collection of a given Model
This is the most ActiveRecord'ish approach
```javascript
var Bike = $restmod.model('/bikes', {
  '~beforeSave': function() {
    this.partCount = this.parts.length;
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


#### Object lifecycle

When calling `$new` to generate a new record:

| Hook's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| after-init            |                 | record           |

For `$fetch` on a record:

| Hook's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| before-fetch          | http-request    | record           |
| before-request        | http-request    | record           |
| after-request[-error] | http-response   | record           |
| after-feed            | raw record data | record           | (only called if no errors)
| after-fetch[-error]   |   http-response | record           |

For `$fetch` on a collection:

| Hook's name                | parameters          | 'this' refers to | notes
| -------------------------- | ------------------- | ---------------- | ---
| before-fetch-many          | http-request        | collection       |
| before-request             | http-request        | collection       |
| after-request[-error]      | http-response       | collection       |
| after-feed                 | raw collection data | collection       | (only called if no errors)
| after-fetch-many[-error]   | http-response       | collection       |

For `$save` when record is new (creating):

| Hook's name           | parameters        | 'this' refers to | notes
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

| Hook's name           | parameters        | 'this' refers to | notes
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

| Hook's name           | parameters      | 'this' refers to | notes
| --------------------- | --------------- | ---------------- | ---
| before-destroy        | http-request    | record           |
| before-request        | http-request    | record           |
| after-request[-error] | http-response   | record           |
| after-remove          | record          | collection       | only called if record belongs to a collection
| after-destroy[-error] |   http-response | record           |

Notes:
* The **before-request** hooks can be used to modify the request before is sent.
* The **after-request[-error]** hooks can be used to modify the request before processed by model.


### Defining custom hooks
Additional hooks can be called by user defined methods using the `$callback` method
