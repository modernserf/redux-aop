# redux-aop

Aspect-Oriented Programming helpers for Redux middleware

```
npm install redux-aop
```

## What is this?

This is a collection of helper functions (or "combinators") for common patterns in redux middleware. It borrows ideas and terminology from Aspect-Oriented programming, and may remind you of `alias_method_chain` or `before_action` in Ruby on Rails.

## How do I use it?

Here's a simple logger:

```js
import { after } from "redux-aop"

const loggerMiddleware = after((store, action) => {
    console.log(`${action.type}: ${new Date().toTimeString().split(' ')[0]}`, action)
    console.log("next state:", store.getState())
    return action
})
```

redux-thunk:

```js
import { before } from "redux-aop"

const thunkMiddleware = before(
    (action) => typeof action === "function",
    (store, thunk) => { thunk(store.dispatch, store.getState) })
```

An action debouncer:

```js
import { before } from "redux-aop"

const debounce = (match, time, immediate = false) =>  {
    let timeoutHook = null
    return before(match, (store, action) => {
        clearTimeout(timeoutHook)
        setTimeout(() => {
            timeoutHook = null
            if (!immediate) { store.dispatch(action) }
        }, time)
        if (immediate && !timeout) { store.dispatch(action) }
    })
}
```

## Why does this exist?

As a low-level library, Redux is designed for maximum flexibility at the expense of convenience. This is perhaps most visible in middleware -- the `store => next => action` function signature is great for complex middleware but overkill for many cases. The relative complexity of the middleware API discourages people from using it directly, instead relying on third-party libraries, even for simple tasks like logging and error reporting.

This library is significantly smaller in size and scope than effect-management libraries like [redux-loop](https://github.com/redux-loop/redux-loop) or [redux-saga](https://github.com/redux-saga/redux-saga), but can improve the ergonomics of using the base middleware API directly such that those libraries might not be needed.

## Is it any good?

Absolutely.

# API reference

```js
import { match, before, after, around, not } from "redux-aop"
```

## match(matcher, middleware): middleware

Limit the actions handled by a middleware to those matched by a matcher. You will probably not use this function directly, but its matching is used in `before`, `after` and `around`.

### Arguments
- matcher: [String|Array|(action) => Boolean]
    + if matcher is a string, matches when `action.type === matcher`.
    + if matcher is an array of strings, matches when the array includes `action.type`.
    + if matcher is a function, matches when `matcher(action)` returns truthy.
- middleware: A plain redux middleware.

## before([matcher], (store, action) => action): middleware

Create a middleware that handles actions _before_ the reducer. A common use for this is intercepting a dispatched value, like a thunk or a promise, that the reducer cannot handle by itself. This can also be used for adding additional data to actions, like timestamps or unique IDs.

### Arguments
- matcher (Optional)
- `(store, action) => action`: If this function returns a value, that value continues through the middleware and into the reducer. If the function returns `undefined`, the dispatch cycle ends and the subsequent middleware & reducer will not receive any value.


## after([matcher], (store, action) => action): middleware

Create a middleware that handles actions _after_ the reducer. This is useful for middleware (like loggers) that need the store's state after the reducer has updated it.

**Caveats**: `after` middleware will run in the _opposite order_ they are listed in `applyMiddleware`. For example, given:

```js
createStore(reducer, applyMiddleware(before(m1), before(m2), after(m3), after(m4)))
```

These will run in the order `m1, m2, reducer, m4, m3`.

### Arguments
- matcher (Optional)
- `(store, action) => action`


## around([matcher], (store, next, action) => action)

Create a middleware that handles actions _around_ the reducer. This is less useful than `before` and `after` as this is already the normal behavior of middleware, but at least this adds matching and uncurries the function signature.

### Arguments
- matcher (Optional)
- `(store, next, action) => action`

## not(matcher): matcher

Create a matcher that matches the inverse of the given value. For example: `before("foo", fn)` runs `fn` when the action has type `foo`, while `before(not("foo"), fn)` runs `fn` on every action _except_ those with type `foo`.

### Arguments
- matcher
