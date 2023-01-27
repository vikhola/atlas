declare module '@vikhola/atlas' {

    type Options = {
        lazy: boolean
    }

    export class Container {
        /**
         * @param config Container config which will be able with container. 
         */
        constructor(config?: any)
        /**
         * Method returns a boolean indicating whether an dependency with the specified key exists or not.
         * @param key specified key to search. 
         */
        has(key: any): boolean
        /**
         * Method which register the dependency in context scope.
         * @param key Specified key to bind which could be any type.
         * @param value Implementation contructor or callback function which will return instance of dependency.
         * @param parameters Dependency which should be resolved and passed as arguments.
         * @param options Implementation options.
         */
        addScoped(            
            key: any, 
            value: ((...args: any) => any) | (new (...args: any) => any), 
            parameters: Array<any>, 
            options: Options): this
        /**
         * Method which register the dependency in singleton scope.
         * @param key Specified key to bind. **NOTE**: Key could be any type, but recomended use Symbols or implementation constructor by itself 
         * @param value Implementation contructor or callback function which will return instance of implementation.
         * @param parameters Dependency which should be resolved and passed as arguments.
         * @param options Implementation options.
         */
        addSingleton(
            key: any, 
            value: ((...args: any) => any) | (new (...args: any) => any), 
            parameters: Array<any>, 
            options: Options
        ): this
        /**
         * Method which register the dependency in transient scope.
         * @param key Specified key to bind which could be any type.
         * @param value Implementation contructor or callback function.
         * @param parameters Dependency which should be resolved and passed as arguments
         * @param options Implementation options
         */
        addTransient(
            key: any, 
            value: ((...args: any) => any) | (new (...args: any) => any), 
            parameters: Array<any>, 
            options: Options
        ): this
        /**
         * Method which resolve a class instance from the container.
         * @param key Specified key binded to implementation.
         */
        make<T>(key: any): T
        /**
         * Method which remove dependency from the container.
         * @param key Specified key which binded to the implementation.
         */
        remove(key: any): void
        /**
         * Method which creates a new scope and execute passed function to it.
         * @param cb The function to call in the execution context.
         */
        createContext(cb: Function, ...args: any): any
    }
    
}