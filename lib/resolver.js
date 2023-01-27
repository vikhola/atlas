const builder = Symbol("builder")
const instance = Symbol("instance")

class ResolverProxy {}

class ContainerLazyResolverTypeError extends Error {
    constructor() {
        super(`Container lazy load entry shouldn\`t be instance of Promise`)
    }
}

class ContainerLazyResolver {
    
    constructor(construct, params) {
        const handlers = Object.getOwnPropertyDescriptors(Reflect)
        for(const handler in handlers) this[handler] = (...args) => {
            if(!this[instance]) {
                const theResolver = construct(params)
                if(theResolver instanceof Promise) throw new ContainerLazyResolverTypeError
                else this[instance] = theResolver    
            }
            return Reflect[handler](...Object.assign(args, {0: this[instance]}))  
        }
        return new Proxy(new ResolverProxy, this)
    }

}

class ContainerResolver {

    constructor(entry, lazy) {
        this[builder] = lazy ? this._lazy(this._normalize(entry)) : this._normalize(entry)
    }

    load(params = []) {
        return this[builder](params)
    }

    _lazy(resolver) {
        return (params) => new ContainerLazyResolver(resolver, params)
    }

    _normalize(entry) {
        switch(typeof entry) {
            case("object") : return () => entry
            case("function") : return /^\s*class\s+/.test(entry.toString()) ?
                (params) => new entry(...params) : (params) => entry(...params) 
        }
    }

}
        
module.exports = { ResolverProxy, ContainerResolver }