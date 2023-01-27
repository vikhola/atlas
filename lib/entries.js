const util = require("node:util")
const { ContainerResolver } = require("./resolver.js")

const params = Symbol("params")
const resolver = Symbol("resolver")
const instance = Symbol("instance")

class ContainerEntryTypeError extends Error {
    constructor(key) {
        super(`Container ${util.format(key)} dependency can be only type of object or function`)
    }
}

class ContainerScopeEntryTypeError extends Error {
    constructor(key) {
        super(`Container ${util.format(key)} scope dependency cannot be resolved with non object type`)
    }
}

class ContainerScopeEntryScopeError extends Error {
    constructor(key) {
        super(`Container ${util.format(key)} scope dependency cannot be resolved without container scope`)
    }
}

class ContainerSingletonEntryTypeError extends Error {
    constructor(key) {
        super(`Container ${util.format(key)} singleton dependency cannot be resolved with non object type`)
    }
}

class ContainerEntry {

    constructor(key, entry, parameters, options = {}) {
        this.key = key
        const type = typeof entry
        if(type !== "object" && type !== "function") throw new ContainerEntryTypeError(key)
        if(parameters && !Array.isArray(parameters)) {
            options = parameters; parameters = [];
        }
        this[params] = parameters || []
        this[resolver] = new ContainerResolver(entry, options.lazy)
    }

    load(container) {
        const theDependency = this._resolve(container)
        return theDependency instanceof Promise ? 
            Promise.resolve(theDependency).then((resolved) => this._validate(resolved)) : 
            this._validate(theDependency) 
        
    }

    _resolve(container) {
        const theResolver = this[resolver]
        const parameters = this[params].map(param => container.make(param))
        if(parameters.every((param) => !(param instanceof Promise))) return theResolver.load(parameters)
        else return Promise.all(parameters).then((params) => theResolver.load(params))
    }

    

    _validate(dependency) {
        return dependency
    }

}

class ContainerSingletonEntry extends ContainerEntry  {

    constructor(key, entry, params, options) {
        super(key, entry, params, options)
    }

    load(container) {
        if(this[instance]) return this[instance]
        this[instance] = super.load(container)
        return this[instance]
    }

    _validate(dependency) {
        if(typeof dependency !== "object") throw new ContainerSingletonEntryTypeError(this.key)
        else return dependency
    }

}
        
class ContainerScopeEntry extends ContainerEntry  {

    constructor(key, entry, params, options) {
        super(key, entry, params, options)
    }

    load(container) {
        const theScope = container.getScope()
        if(!theScope) throw new ContainerScopeEntryScopeError(this.key)
        if(theScope.has(this.key)) return theScope.get(this.key)
        const theEntry = super.load(container)
        theScope.set(this.key, theEntry)
        return theEntry
    }

    _validate(dependency) {
        if(typeof dependency !== "object") throw new ContainerScopeEntryTypeError(this.key)
        else return dependency
    }

}

module.exports = { 
    ContainerEntry, 
    ContainerScopeEntry, 
    ContainerSingletonEntry, 
    ContainerScopeEntryTypeError,
    ContainerScopeEntryScopeError,
    ContainerSingletonEntryTypeError,  
}
        