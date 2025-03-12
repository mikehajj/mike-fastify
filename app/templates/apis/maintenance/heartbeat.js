"use strict";

async function routes(fastify, options) {
    const currentRoute = {
        method: options.method.toUpperCase(),
        url: options.url,
        schema: options.schema,
        bodyLimit: options.bodyLimit || 1048576, //1MB
        logLevel: options.logLevel || 'debug',
        config: options,
    };

    currentRoute.handler = (request, reply) => {
        return new Promise((resolve) => {
            return resolve(reply.response(null, true));
        });
    };

    fastify.route(currentRoute);
}

module.exports = routes;