

All REST operations ($save, $fetch, $create, etc) generate `$q` promises that are fulfilled when the operation succeeds or fails. To access these promises for something like a **resolve handler in ui-router** you can use the `$asPromise` method. It's also posible to use the `$then` method to chain additional logic to the last operation.

```javascript
bike.$fetch().$asPromise().then(function(_bike) {
  doSomethingAsync();
});
// similar to:
bike.$fetch().$then(function(_bike) {
  // if this function returns a promise, then other calls to $then (or REST operations) will wait until returned promise is resolved.
  doSomethingAsync();
});
```
As stated above, there's a slight difference between these two ways of adding a callback after a promise is fullfilled. This difference becomes relevant when your callback also returns a promise.

When we use Restmod's function `$then`, we are actually chaining a new promise to the internal promise queue. This means that other calls to `$then` and REST operations will wait until the logic on our callback finishes before running.

Using `$asPromise()`, we **get** the last promise of the current queue and using 'then' (without $) we attach a callback to be executed after this particular promise gets fulfilled.
