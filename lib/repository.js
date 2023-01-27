const { randomUUID } = require( 'node:crypto');

class ContainerRepository extends Map {
    id = randomUUID()

    constructor(...args) {
        super(...args)
    }

}

module.exports = { ContainerRepository }
