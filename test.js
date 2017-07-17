const test = require("tape")
const { createStore, applyMiddleware } = require("redux")
const { before, after, around, not } = require("./index")

test("before middleware runs before reducer", (t) => {
    const callOrder = []

    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push("middleware"); return action }

    // createStore dispatches an init action, but only to the reducer
    const store = createStore(reducer, applyMiddleware(before(middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "middleware", "reducer"])

    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "middleware", "reducer", "middleware", "reducer"])

    t.end()
})

test("after middleware runs after reducer", (t) => {
    const callOrder = []

    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push("middleware"); return action }

    const store = createStore(reducer, applyMiddleware(after(middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "reducer", "middleware"])

    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "reducer", "middleware", "reducer", "middleware"])

    t.end()
})

test("before middlewares run in order, after middlewares run in reverse order", (t) => {
    const callOrder = []

    const reducer = () => { callOrder.push("reducer"); return {} }
    const firstBefore = (store, action) => { callOrder.push("firstBefore"); return action }
    const secondBefore = (store, action) => { callOrder.push("secondBefore"); return action }
    const firstAfter = (store, action) => { callOrder.push("firstAfter"); return action }
    const secondAfter = (store, action) => { callOrder.push("secondAfter"); return action }

    const store = createStore(reducer, applyMiddleware(
        before(firstBefore),
        before(secondBefore),
        after(firstAfter),
        after(secondAfter)
    ))
    t.deepEquals(callOrder, ["reducer"])
    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "firstBefore", "secondBefore", "reducer", "secondAfter", "firstAfter"])

    // empty call order array
    callOrder.splice(0, 100)

    const anotherStore = createStore(reducer, applyMiddleware(
        after(firstAfter),
        after(secondAfter),
        before(firstBefore),
        before(secondBefore)
    ))
    t.deepEquals(callOrder, ["reducer"])

    anotherStore.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "firstBefore", "secondBefore", "reducer", "secondAfter", "firstAfter"])

    t.end()
})

test("around is just regular middleware with a less ponderous function signature", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, next, action) => {
        callOrder.push("middleware before")
        const nextAction = next(action)
        callOrder.push("middleware after")
        return nextAction
    }

    const store = createStore(reducer, applyMiddleware(around("foo", middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "middleware before", "reducer", "middleware after"])
    t.end()
})

test("matcher as string matches action.type", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push("middleware"); return action }

    const store = createStore(reducer, applyMiddleware(before("foo", middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "reducer", "middleware", "reducer"])

    t.end()
})

test("matcher as array matches multiple action types", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push(`middleware: ${action.type}`); return action }

    const store = createStore(reducer, applyMiddleware(before(["foo", "bar"], middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "middleware: foo", "reducer"])

    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "middleware: foo", "reducer", "middleware: bar", "reducer"])

    store.dispatch({ type: "quux" })
    t.deepEquals(callOrder, ["reducer", "middleware: foo", "reducer", "middleware: bar", "reducer", "reducer"])

    t.end()
})

test("matcher as function", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push(`middleware: ${action.type}`); return action }

    const store = createStore(reducer, applyMiddleware(
        before((action) => action && /^foo_/.test(action.type), middleware)
    ))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo_x" })
    t.deepEquals(callOrder, ["reducer", "middleware: foo_x", "reducer"])
    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "middleware: foo_x", "reducer", "reducer"])

    t.end()
})

test("not(matcher) inverts match function", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const middleware = (store, action) => { callOrder.push("middleware"); return action }

    const store = createStore(reducer, applyMiddleware(before(not("foo"), middleware)))
    t.deepEquals(callOrder, ["reducer"])

    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder, ["reducer", "reducer"])

    store.dispatch({ type: "bar" })
    t.deepEquals(callOrder, ["reducer", "reducer", "middleware", "reducer"])

    t.end()
})

test("middleware returning undefined ends dispatch", (t) => {
    const callOrder = []
    const reducer = () => { callOrder.push("reducer"); return {} }
    const firstMiddleware = (store, action) => { callOrder.push("firstMiddleware"); return action }
    const dropMiddleware = (store, action) => { callOrder.push("dropMiddleware"); return undefined }
    const lastMiddleware = (store, action) => { callOrder.push("lastMiddleware"); return action }

    const store = createStore(reducer, applyMiddleware(
        before(firstMiddleware),
        before("dropped", dropMiddleware),
        before(lastMiddleware)
    ))

    t.deepEquals(callOrder, ["reducer"])
    store.dispatch({ type: "foo" })
    t.deepEquals(callOrder,
        ["reducer", "firstMiddleware", "lastMiddleware", "reducer"])

    store.dispatch({ type: "dropped" })
    t.deepEquals(callOrder,
        ["reducer", "firstMiddleware", "lastMiddleware", "reducer", "firstMiddleware", "dropMiddleware"])

    t.end()
})
