
# Atlas

## About
The Atlas is lightweight inversion of control container for both JavaScript and TypeScript Node.js apps. 

## Installation
```
npm install @vikhola/atlas
```

## Usage
Container could be required as ES6 module or commonJS module.
```js
import { Container } from "@vikhola/atlas"
// or 
const { Container } = require("@vikhola/atlas")
```

## Introduction
A dependency is an object that another object depends on. Commonly the dependencies is hard-coded which leads to the problematic with testing, module relation understand and code-base changes providing. In the following the OrderService creates and directly depends on the NotifyService. 
```js
class NotifyService {
	
	send(message) {}
	
}

class OrderService {
	_notifier = new NotifyService()

	create(order) {
		// some logic
		this._notifier.send("order created")
	}
}
``` 
The inversion of control container tries to resolve this problems by take on the responsibility of creating an instance of the dependency and disposing of it when it's no longer needed. In this example services registers in `transient` lifetime and creates each time they're requested from the container.
```js
const container = new Container()
container.addTransient(NotifyService, NotifyService)
container.addTransient(OrderService, OrderService, [NotifyService])
``` 
This allows to reduce the amount of hard code, reduce the dependence on the actual implementation of objects and improve testing in application. After using the container the OrderService could take the following form:
```js
class OrderService {
	_notifier

	constructor(notifier) {
		this._notifier = notifier
	}

	create(order) {
		// some logic
		this._notifier.send("order created")
	}
}
``` 
Because the container take on the responsibility of creating an instance of the object, initialization of the OrderService is done by a simple request to the container, where container resolves all target dependencies and return result.
```js
const theOrderService = container.make(OrderService)
``` 

## The basics

### Key
Dependency registration in the container is done by binding a dependency to the special key and by which it could be resolved. The key can be of any type depending on the situation.
```js
const symbolKey = Symbol("notify_service")
container.addTransient(symbolKey, NotifyService)
container.addTransient(NotifyService, NotifyService)
container.addTransient("notify_service", NotifyService)
```

### Dependency
During container dependency registration dependency could be, as already shown, class constructor.
```js
container.addTransient(NotifyService, NotifyService)
```
Or the function expression.
```js
container.addTransient(NotifyService, () => {
	// do some staff
	return new NotifyService()
})
```
With functional expression creation of dependency become more flexible.

### Parameters
Additional to key and dependency, container also accept array filed with dependencies keys which should be created and passed as arguments to target. 
```js
container.addTransient(NotifyService, NotifyService)
container.addTransient(OrderService, OrderService, [NotifyService])
```
In case with functional expression parameters  will be resolved and then passed as arguments to it.
```js
container.addTransient(NotifyService, NotifyService)
container.addTransient(OrderService, (notifier) => {
	// some operations
	return new OrderService(notifier)
}, [NotifyService])
```

### Lifetimes
Dependencies can be registered with one of the following lifetimes: 

#### Transient 
Transient lifetime dependencies are created each time they're requested from the container. Register transient dependencies is done using `addTransient` method:
```js
container.addTransient(NotifyService, NotifyService)
``` 

#### Scoped
Scoped lifetime dependencies are unique and only available to the scope they belong to. Register scoped dependencies is done using `addScoped` method:
```js
container.addScoped(NotifyService, NotifyService)
```

#### Singleton
Singleton lifetime dependencies are created one time they're requested from the container and every request to container uses the same instance. Register singleton dependencies is done using `addSingleton` method:

```js
container.addSingleton(NotifyService, NotifyService)
```

### Scopes
The container scope is the current context of execution in which  scoped dependencies are available and can be requested. Creating a scope is done using the `createScope` container method and passed to it a callback function.
```js
const theNotifyService = container.make(NotifyService) // will throw Error

container.createScope((...args) => {
	// instance of container now have access to local scope
	const theNotifyService = container.make(NotifyService)
}, ...args)
```
Scoped lifetime dependencies are unique and only available to the scope they belong to. 
```js
container.createScope((...args) => {
	const instance = container.make(NotifyService)
	container.createScope((...args) => {
		const firstRequest = container.make(NotifyService)
		const secondRequest = container.make(NotifyService)
		console.log(firstRequest === secondRequest) // print `true`
		console.log(instance === firstRequest) // print `false`
	}, ...args)
}, ...args)
```

## Advanced

### Async
As mention before dependency could be synchronous function, but it also could be asynchronous.
```js
container.addTransient(NotifyService, () => {
	return new Promise(resolve => 
		setTimeout(() => resolve(new NotifyService()), 100)
	)
})
```
Resolving asynchronous dependency in parameters take the same form as in synchronous case.
```js
container.addTransient(NotifyService, () =>  {
	return new Promise(resolve => 
		setTimeout(() => resolve(new NotifyService()), 100)
	)
})
container.addTransient(OrderService, (notifier) => {
	// notifier already resolved and ready use
	return new OrderService(notifier)
}, [NotifyService])
```
With asynchronous dependency changes only it resolving from the container: unlike with synchronous, asynchronous resolving from container will return promise with dependency. 
```js
container.make(NotifyService).then(theNotifyService => {
	// do stuff with NotifyService
})
// Or using async/await
const theNotifyService = await container.make(NotifyService)
```
This also applies when a synchronous dependency contains an asynchronous dependency in its parameters. Synchronous dependency becomes asynchronous.
```js
container.addTransient(NotifyService, () =>  {
	return new Promise(resolve => 
		setTimeout(() => resolve(new NotifyService()), 100)
	)
})
container.addTransient(OrderService, (notifier) => {
	// notifier already resolved and ready use
	return new OrderService(notifier)
}, [NotifyService])

const theOrderService = await container.make(OrderService)
```

### Lazy
The container lazy dependencies is a special kind of dependencies which defer the creation of an object\`s exactly to the moment when they are actually used. Register lazy dependencies is done by set `lazy` option to true:
```js
container.addTransient(NotifyService, NotifyService, { lazy: true })
// Or
container.addTransient(NotifyService, () => {
	return new NotifyService
}, { lazy: true })
```
Or with parameters need to be resolved:
```js
container.addTransient(OrderService, OrderService,[NotifyService], { lazy: true })
```
Lazy dependencies almost the same as common with a few exceptions. Lazy dependency can not be asynchronous. In this case after address to the lazy object with some operation will be throw Error.
```js
container.addTransient(NotifyService, () => {
	return new Promise(resolve => 
		setTimeout(() => resolve(new NotifyService()), 100)
	)
}, { lazy: true })

const theLazyDependency = await container.make(NotifyService)
theLazyDependency.send("message") // throw Error
```
But it will not happen if dependency is synchronous but have asynchronous parameters.
```js
container.addTransient(NotifyService, () =>  {
	return new Promise(resolve => 
		setTimeout(() => resolve(new NotifyService()), 100)
	)
})
container.addTransient(OrderService, (notifier) => {
	// notifier already resolved and ready use
	return new OrderService(notifier)
}, [NotifyService], { lazy: true })
```
Lazy dependency also cannot be prevented from the future extensions by `Object.preventExtensions()` in this case will be throw Error
```js
const theLazyDependency = container.make(NotifyService)
Object.preventExtensions(theLazyDependency) // throw Error
```

### Fabrics
The container fabrics is the same as function dependency and can be synchronous and asynchronous but with few important differences: the fabrics returns functions and they can be added only with transient lifetime.
```js
container.addTransient(NotifyService, (params) => 
	(args) => {
		// do some staff
		return new NotifyService()
	}
)
```
This is could be useful in situation where exist dependency which depend on container parameters but should be resolved in other place with additional dynamic parameters.
```js
class UserActiveRecord {

	constructor(db, firstName, lastName) {
		// some logic 
	}
	
	// CRUD Methods

}
```
Or in case were another dependency is singleton and requires new instance of dependency every time. 
```js
class UserService {

	constructor(userFabric) {
		this.fabric = userFabric
	}

	getUser(firstName, lastName) {
		// some logic
		return this.fabric(firstName, lastName)	
	}

}
```
In result in takes next form: first dependency takes transient form, second any other.
```js
container.addTransient(UserActiveRecord, (db) => 
	(firstName, lastName) => {
		// do some staff
		return new UserActiveRecord(db, firstName, lastName)
	}, [DB]
)
container.addSingleton(UserService, UserService, [UserActiveRecord])
```

## License

MIT License

Copyright (c) 2022-2023 Denys Medvediev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
