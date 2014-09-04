# Restmod Style listing

This is a list of all api style adaptors provided by restmod (just one for now)

The idea is to have adaptors that make sensible assumptions about the API given
the undelying backend, so for example, since rails is usually programmed in snake case,
the active_model_serializer style will enable the property renaming to convert every
property to camelcase on arrival.

**Api styles contributions are welcomed!!, some ideas:**
* django style APIs
* .NET style APIs

To use a style first make sure style script file is being loaded:

```html
<script type="text/javascript" src="js/angular-restmod/dist/styles/my-style.min.js"></script>
```

Then to set the style for every model:

```javascript
module.config(function(restmodProvider) {
	restmodProvider.rebase('MyStyleApi'); // given the mixin is called MyStyleApi
});

You can also use the style in a single model:

```javascript
restmod.model('MyStyleApi', {
	// rest of definition.
})
```

These are the api styles currently bundled with restmod:

### Active Model Serializer

File: `styles/ams.js`
Mixin Name: `AMSApi`

* Automatic snakecase to camelcase renaming
* Json root enabled
* Json metadata expected in 'meta' property
* Json links expected in 'links' property
* Default primary key: id
