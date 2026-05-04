"use strict";

async function routes(fastify, options) {
    const currentRoute = {
        method: options.method.toUpperCase(),
        url: options.url,
        schema: options.schema,
        bodyLimit: options.bodyLimit || 1048576,
        logLevel: options.logLevel || "debug",
        config: options,
    };

    currentRoute.onRequest = (request, reply, done) => {
        fastify.log.trace("onRequest after validation");
        done();
    };

    currentRoute.preHandler = (request, reply, done) => {
        fastify.log.trace("preHandler");
        done();
    };

    currentRoute.handler = (request, reply) => {
        fastify.log.trace("main handler");
        return reply.response(null, request.raw.context.user || "hello world");
    };

    currentRoute.onSend = (request, reply, reponse, done) => {
        fastify.log.trace("onSend");
        done();
    };

    currentRoute.onResponse = (request, reply, done) => {
        fastify.log.trace("onResponse");
        done();
    };

    fastify.route(currentRoute);
}

module.exports = routes;
