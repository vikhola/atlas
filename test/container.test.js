const assert = require("node:assert");
const { test } = require('node:test');
const { Container } = require("../lib/container.js")

class Test {

    constructor(...params) {
        this.data = params
    }

    method(arg) {
        return this.data = arg
    }

}

const theTestValue = Symbol("test")

test("Container has test", async function() {
    const key = "dependency"
    const theContainer = new Container()
    theContainer.addTransient(key, _ => new Test())
    assert.ok(theContainer.has(key), "container should contain defined key")
})

test("Container make test", async function() {
    const key = "dependency"
    const instance = new Test()
    const theContainer = new Container()
    theContainer.addTransient(key, instance)
    assert.equal(theContainer.make(key), instance, "container should return passed class instance")
})


test("Container addTransient test", async function() {
    const params = ["injected"]
    const expected = [new Test(theTestValue)]
    const theContainer = new Container()
    theContainer.addTransient("dependency", (...param) => new Test(...param), params, {lazy: true})
    theContainer.addTransient("injected", _ => 
        new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100))
    )
    const theDependency = await theContainer.make("dependency")
    assert.deepStrictEqual(theDependency.data, expected, "Dependency should have both resolved dependencies and passed values")
})

test("Container addScope test", async function() {
    let scoped
    const params = ["injected"]
    const expected = [new Test(theTestValue)]
    const theContainer = new Container()
    theContainer.addScoped("dependency", (...param) => new Test(...param), params, {lazy: true})
    theContainer.addTransient("injected", 
        _ => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100))
    )
    await theContainer.createScope(async _ => {
        const theDependency = await theContainer.make("dependency")
        assert.equal(theDependency, await theContainer.make("dependency"), "dependency should keep object theDependency in context")
        assert.deepEqual(theDependency.data, expected, "Dependency should have both resolved dependencies and passed values")
        scoped = theDependency
        await theContainer.createScope(async _ => {
            const theDependency = await theContainer.make("dependency")
            assert.equal(theDependency, await theContainer.make("dependency"), "dependency should keep object theDependency in context")
            assert.notEqual(theDependency, scoped, "dependency shoud be unique for each context")
        })
    })
    await theContainer.createScope(async _ => {
        const theDependency = await theContainer.make("dependency")
        assert.equal(theDependency, await theContainer.make("dependency"), "dependency should keep object theDependency in context")
        assert.notEqual(theDependency, scoped, "dependency shoud be unique for each context")
    })
})

test("Container addSingleton test", async function() {
    const params = ["injected"]
    const expected = [new Test(theTestValue)]
    const theContainer = new Container()
    theContainer.addSingleton("dependency", (...param) => new Test(...param), params, {lazy: true})
    theContainer.addTransient("injected", 
        _ => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100))
    )
    const theDependency = await theContainer.make("dependency")
    assert.deepEqual(theDependency.data, expected, "Dependency should have both resolved dependencies and passed values")
    assert.equal(await theContainer.make("dependency"), await theContainer.make("dependency"), "Dependency shoud be same object")
})
