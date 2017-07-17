function before (handler) {
    return (store) => (next) => (action) => {
        const nextAction = handler(store, action)
        if (nextAction !== undefined) { return next(nextAction) }
    }
}

function after (handler) {
    return (store) => (next) => (action) => handler(store, next(action))
}

function around (handler) {
    return (store) => (next) => (action) => handler(store, next, action)
}

function match (matcher, handler) {
    const matches = createMatches(matcher)
    return (store) => (next) => {
        const boundHandler = handler(store)(next)
        return (action) => {
            if (matches(action)) {
                return boundHandler(action)
            } else {
                return next(action)
            }
        }
    }
}

function not (matcher) {
    const matches = createMatches(matcher)
    return (action) => !matches(action)
}

function createMatches (matcher) {
    if (typeof matcher === "string") {
        return (action) => action.type && action.type === matcher
    }

    if (Array.isArray(matcher)) {
        return (action) => action.type && matcher.indexOf(action.type) > -1
    }

    return matcher
}

function withMatching (middlewareDecorator) {
    return (first, second) => {
        if (second) {
            return match(first, middlewareDecorator(second))
        } else {
            return middlewareDecorator(first)
        }
    }
}

module.exports = {
    before: withMatching(before),
    after: withMatching(after),
    around: withMatching(around),
    match: match,
    not: not
}
