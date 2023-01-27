const { AsyncLocalStorage } = require( 'node:async_hooks');
const { ContainerRepository } = require( './repository.js');
const { ContainerEntry, ContainerScopeEntry, ContainerSingletonEntry } = require( './entries.js');

const scope = Symbol("scope");
const entries = Symbol("entries");

class ContainerUnknowKeyError extends Error {
    constructor(key) { 
        super(`Key ${key} is not bound to any container entry`) 
    }
}

class Container {
    config = {}

    constructor(config) {
        this.config = config
        this[scope] = new AsyncLocalStorage()
        this[entries] = new ContainerRepository()
    }

    has(key) {
        return this[entries].has(key)
    }

    make(key) {
        if(!this[entries].has(key)) throw new ContainerUnknowKeyError(key)
        const theEntry = this[entries].get(key)
        return theEntry.load(this)
    }

    remove(key) {
        if(!this[entries].has(key)) throw new ContainerUnknowKeyError(key)
        this[entries].unbind(key)
        return this
    }

    addTransient(key, entry, args, options) {
        const theEntry = new ContainerEntry(key, entry, args, options)
        this[entries].set(key, theEntry)
        return this
    }

    addScoped(key, entry, args, options) {
        const theEntry = new ContainerScopeEntry(key, entry, args, options)
        this[entries].set(key, theEntry)
        return this
    }

    addSingleton(key, entry, args, options) {
        const theEntry = new ContainerSingletonEntry(key, entry, args, options)
        this[entries].set(key, theEntry)
        return this
    }

    getScope() {
        return this[scope].getStore()
    }

    createScope(cb, ...params) {
        return this[scope].run(new ContainerRepository(), cb, ...params)
    }

}

module.exports = { Container }