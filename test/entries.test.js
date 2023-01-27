const assert = require("node:assert");
const { test } = require('node:test');
const { AsyncLocalStorage } = require( 'node:async_hooks');
const { ContainerRepository } = require("../lib/repository.js");
const { 
    ContainerEntry, 
    ContainerSingletonEntry, 
    ContainerScopeEntry, 
    ContainerScopeEntryTypeError, 
    ContainerScopeEntryScopeError,
    ContainerSingletonEntryTypeError 
} = require("../lib/entries.js");

class Test {

    constructor(...params) {
        this.data = params
    }

    method(arg) {
        return this.data = arg
    }

}

class ContainerMock {
    scope
    repository

    constructor(entries) {
        this.scope = new AsyncLocalStorage()
        this.repository = new ContainerRepository(entries)
    }

    has(key) {
        return this.repository.has(key)
    }

    make(key) {
        if(!this.repository.has(key)) throw new Error()
        const theEntry = this.repository.get(key)
        return theEntry.load(this)
    }

    getScope() {
        return this.scope.getStore()
    }

    createScope(cb, ...params) {
        return this.scope.run(new ContainerRepository(), cb, ...params)
    }

}

const key = Symbol("key")
const theTestValue = Symbol("test")

// Transient entry test

test(`Resolving entry with single param test`, function() {
    const params = [Test]
    const expected = [new Test(theTestValue)]
    const theEntry = new ContainerEntry(key, (...param) => new Test(...param), params)
    const theContainerMock = new ContainerMock([
        [Test, new ContainerEntry(key, () => new Test(theTestValue))]
    ])
    const theDependency = theEntry.load(theContainerMock)
    assert.deepStrictEqual(theDependency.data, expected, "Entry should contain expected values")
})

test(`Resolving entry with multiple params test`, function() {
    const params = ["first", "second"]
    const expected = [new Test(theTestValue), new Test(theTestValue)]
    const theEntry = new ContainerEntry(key, (...param) => new Test(...param), params)
    const theContainerMock = new ContainerMock([
        ["first", new ContainerEntry(key, () => new Test(theTestValue))],
        ["second", new ContainerEntry(key, () => new Test(theTestValue))]
    ])
    const theDependency = theEntry.load(theContainerMock)
    assert.deepStrictEqual(theDependency.data, expected, "Entry should contain expected values")
})

test(`Resolving entry with promise param test`, async function() {
    const params = [Test]
    const expected = [new Test(theTestValue)]
    const theEntry = new ContainerEntry(key, (...param) => new Test(...param), params)
    const theContainerMock = new ContainerMock([
        [Test, new ContainerEntry(key, () => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100)))]
    ])
    const theDependency = await theEntry.load(theContainerMock)
    assert.deepStrictEqual(theDependency.data, expected, "Entry should contain expected values")
})

test(`Resolving entry multiple parameters and promise test`, async function() {
    const params = ["second", "third"]
    const expected = [new Test(theTestValue), new Test(new Test(theTestValue))]
    const theEntry = new ContainerEntry(key, (...param) => new Test(...param), params)
    const theContainerMock = new ContainerMock([
        ["second", new ContainerEntry(
            key, _ => new Test(theTestValue))
        ],
        ["third", new ContainerEntry(
            key, (param) => new Promise(resolve => setTimeout(_ => resolve(new Test(param)), 100)), ["four"])
        ],
        ["four", new ContainerEntry(
            key, _ => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100)))
        ]
    ])
    const theDependency = await theEntry.load(theContainerMock)
    assert.deepStrictEqual(theDependency.data, expected, "Injected dependencies should be euqal to expected")
})

// Singleton entry test

test(`Resolving singleton entry test`, function() {
    const theEntry = new ContainerSingletonEntry(key, Test)
    const theDependency = theEntry.load()
    assert.ok(theDependency instanceof Test, "result should be theDependency of Test constructor")
    assert.strictEqual(theDependency, theEntry.load(), "entry should keep object theDependency")
})

test(`Resolving singleton entry with promise parameter test`, async function() {
    const params = [Test]
    const expected = [new Test(theTestValue)]
    const theEntry = new ContainerSingletonEntry(key, Test, params)
    const theContainerMock = new ContainerMock([
        [Test, new ContainerEntry(
            key, _ => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100)))
        ],
    ])
    const theDependency = await theEntry.load(theContainerMock)
    assert.deepStrictEqual(theDependency.data, expected, "Injected dependencies should be euqal to expected")
    assert.equal(await theEntry.load(theContainerMock), theDependency, "entry should keep object theDependency")
})

test(`Resolving singleton entry with non object test`, function() {
    const theEntry = new ContainerSingletonEntry(key, _ => _ => new Test())
    assert.throws(() => theEntry.load(), new ContainerSingletonEntryTypeError(key))
})

test(`Resolving singleton with non object promise test`, async function() {
    const theEntry = new ContainerSingletonEntry(
        key, new Promise(resolve => setTimeout(_ => resolve(_ => new Test(theTestValue)), 100))
    )
    await assert.rejects(() => theEntry.load(), new ContainerSingletonEntryTypeError(key))
})

// Scope entry test

test(`Resolving scope entry test`, function() {
    let entry;
    const theEntry = new ContainerScopeEntry(key, Test)
    const theContainerMock = new ContainerMock()
    theContainerMock.createScope(_ => {
        const theDependency = theEntry.load(theContainerMock)
        assert.ok(theDependency instanceof Test, "result should be theDependency of Test constructor")
        assert.equal(theDependency, theEntry.load(theContainerMock), "entry should keep object theDependency in context")
        entry = theDependency
    })
    theContainerMock.createScope(_ => {
        assert.notEqual(theEntry.load(theContainerMock), entry, "entry shoud be unique for each context")
    })
})

test(`Resolving scope entry with promise test`, async function() {
    const params = [Test]
    const expected = [new Test(theTestValue)]
    const theEntry = new ContainerScopeEntry(key, Test, params)
    const theContext = new AsyncLocalStorage()
    const theContainerMock = new ContainerMock([
        [Test, new ContainerEntry(
            key, _ => new Promise(resolve => setTimeout(_ => resolve(new Test(theTestValue)), 100)))
        ],
    ])
    await theContainerMock.createScope(async _ => {
        const theDependency = await theEntry.load(theContainerMock)
        assert.deepStrictEqual(theDependency.data, expected, "Injected dependencies should be euqal to expected")
        assert.equal(theDependency, await theEntry.load(theContainerMock, theContext), "entry should keep object theDependency")
    })
})

test(`Resolving scope entry in non scope environment test`, function() {
    const theEntry = new ContainerScopeEntry(key, _ => new Test())
    const theContainerMock = new ContainerMock()
    assert.throws(() => theEntry.load(theContainerMock), new ContainerScopeEntryScopeError(key))
})

test(`Resolving scope entry with non object test`, function() {
    const theEntry = new ContainerScopeEntry(key, _ => _ => new Test())
    const theContainerMock = new ContainerMock()
    theContainerMock.createScope(_ => {
        assert.throws(() => theEntry.load(theContainerMock), new ContainerScopeEntryTypeError(key))
    })
})

test(`Resolving scope entry with non object promise test`, async function() {
    const theEntry = new ContainerScopeEntry(
        key, new Promise(resolve => setTimeout(_ => resolve(_ => new Test(theTestValue)), 100))
    )
    const theContainerMock = new ContainerMock()
    await theContainerMock.createScope(async _ => {
        await assert.rejects(() => theEntry.load(theContainerMock), new ContainerScopeEntryTypeError(key))
    })
})

// Complex

test(`Complext entry test`, async function() {
    const theContainerMock = new ContainerMock([
        ["scope", new ContainerScopeEntry(
            key, (param) => new Test(param), ["singleton"])
        ],
        ["singleton", new ContainerSingletonEntry(
            key, (param) => new Promise(resolve => setTimeout(_ => resolve(new Test(param)), 100)))
        ],
    ])
    const theEntry = new ContainerEntry(key, Test, ["scope"])
    await theContainerMock.createScope(async _ => {
        const theFirstInstance = await theEntry.load(theContainerMock) 
        const theSecondInstance = await theEntry.load(theContainerMock)
        assert.deepStrictEqual(theFirstInstance.data, theSecondInstance.data)
    })
})