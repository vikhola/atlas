const util = require("node:util")
const assert = require("node:assert");
const { test } = require('node:test');
const { ContainerResolver, ResolverProxy } = require("../lib/resolver.js");

class Test {

    constructor(...args) {
        this.data = args
    }

    method(arg) {
        return this.data = arg
    }

}

test(`load method: process lazy intialize`, function() {
    const Entry = Test
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.equal(util.format(theLazyEntry), util.format(new ResolverProxy()), "result should be equal to ResolverProxy")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
})

test(`load method: process lazy object defineProperty`, function() {
    const Entry = Test
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.doesNotThrow(_ => Object.defineProperty(theLazyEntry, "data", {value: 100}))
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
    assert.equal(theLazyEntry.data, 100, "dependency 'data' prop should be equal to 100")
})

test(`load method: process lazy object deleteProperty`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    delete theLazyEntry.data
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
    assert.equal(theLazyEntry.data, undefined, "dependency 'data' prop should be equal to undefined")
})

test(`load method: process lazy object method`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.equal(theLazyEntry.method(1200), 1200, "dependency 'data' prop should be equal to 100")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
})

test(`load method: process lazy object get`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.equal(theLazyEntry.data, 100, "dependency 'data' prop should be equal to 100")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
})

test(`load method: process lazy object getOwnPropertyDescriptor`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.equal(Object.getOwnPropertyDescriptor(theLazyEntry, "data").value, 100, "dependency 'data' prop should be equal to 100")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor")
})

test(`load method: process lazy object getPrototypeOf`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor") // totaly equal to getPrototypeOf
})

test(`load method: process lazy object hasOwnProperty`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    assert.ok(theLazyEntry.hasOwnProperty("data"), "should be true")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor") // totaly equal to getPrototypeOf
})

test(`load method: process lazy object set`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    theLazyEntry.data = 100
    assert.equal(theLazyEntry.data, 100, "dependency 'data' prop should be equal to 100")
    assert.ok(theLazyEntry instanceof Test, "result should be instance of Test constructor") // totaly equal to getPrototypeOf
})

test(`load method: process lazy object setPrototypeOf`, function() {
    const Entry = _ => new Test(100)
    const theEntry = new ContainerResolver(Entry, true)
    const theLazyEntry = theEntry.load()
    Object.setPrototypeOf(theLazyEntry, new AbortController)
    assert.ok(theLazyEntry instanceof AbortController, "result should be instance of AbortController constructor") // totaly equal to getPrototypeOf
})
