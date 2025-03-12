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
            let ip = fastify.config.apis.main.ip;
            let protocol = fastify.config.protocol || 'http';

            //read the mode from params or use default value ux
            let mode = request.params.mode || 'ux';

            //redirect to the swagger stats plugin main page
            reply.redirect(`${protocol}://${ip}:${fastify.config.apis.main.port}${fastify.config.stats.uriPath}/${mode}`);
        });
    };

    fastify.route(currentRoute);
}

module.exports = routes;
