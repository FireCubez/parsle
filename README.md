# parsle
A parser toolkit for JavaScript based off of RegExps

# Installation
```sh
$ npm install parsle
```

# Getting Started

Parsle is a [Req](https://npmjs.org/package/@firecubez/req) module, which means you can use Req to require it:

```js
Req.module("myModule",
  $$ => $$.depend("parsle", "a parsing toolkit"),
  $$ => {

  const Parsle = $$.get("parsle", {});

  // ...
})
```

Or, if you prefer, you can require it normally like so:

```js
const Parsle = require("parsle")();

// ...
```
# Usage

To create a parser, use the `Parsle` constructor:

```js
var parser = new Parsle($ => {
	// ...
});
```

In the above code, `$` is a `Matcher` - a class which performs matching operations on text.

## Matcher API

### `Matcher.MATCH(regex, transform, gate)`

The `Matcher.MATCH` function matches a regex against the current string. It takes the regex to match, a transform function, and a gate.

The regex must match at the first character (i.e. as if it had `^` prepended to it). If this behavior is not desired then use `Matcher.MATCH_AHEAD`.

The transform function takes an info object with keys:
- `pos`: The 0-based index of the character the match started at.
- `line`, `col`: The 1-based line and column of the character the match started at.
- `match`: The result of calling `string.match(regex)` where `string` is the current string
...and returns an object to be added to the results. Think of it as a post-proccesor function. The default behavior is to return the `match` property of the info object

The gate function takes an info object as described above, and if it returns `false`, the match is discarded and a parse error is thrown.

After the match is successful, the matched string is removed from the current string.

### `Matcher.MATCH_AHEAD(regex, transform, gate)`

Does the same as above, but does not require the match to be on the first character and instead removes all the way up to the part of the string actually matched.

### `Matcher.PUSHSTATE()`

Saves the state of the matcher on the stack to be loaded later with `Matcher.POPSTATE()` (or accessed with the `Matcher.states` property)

### `Matcher.POPSTATE()`

Pops a state from the stack and loads it.

### `Matcher.OPTIONAL(fn)`

Runs `fn`. If a parse error occurs, set `this.error` to the error, go back to before `fn` was called and return `false`. Otherwise, return `true`.

### `Matcher.TRY(fn)`

Returns whether `fn` would throw a parse error when run.

### `Matcher.GROUP(fn, transform)`

Runs `fn`, but instead of pushing the results to the `Matcher.result` array, it passes an array of results to the transform function and the return value of that is pushed instead.

### `Matcher.OR(fnArray)`

Try to match each function in `fnArray` one at a time, in order. If none work, throw a parse error.

## Using the parser

When you create your parser, call its `parse(input)` method to parse text. The result of parsing is stored in `this.result` as well as returned.

# License

MIT