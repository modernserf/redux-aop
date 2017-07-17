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
    console.log(`${action.type}: ${new Date().toTimeString().split(' ')[0]}`)
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
