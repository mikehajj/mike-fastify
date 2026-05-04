"use strict";

/**
 * Minimal API route template. Replace the handler with your logic and extend schema as needed.
 */
async function routes(fastify, options) {
    const currentRoute = {
        method: options.method.toUpperCase(),
        url: options.url,
        schema: options.schema,
        bodyLimit: options.bodyLimit || 1048576,
        logLevel: options.logLevel || "debug",
        config: options,
    };

    currentRoute.handler = async (request, reply) => {
        return reply.response(null, { ok: true });
    };

    fastify.route(currentRoute);
}

module.exports = routes;
