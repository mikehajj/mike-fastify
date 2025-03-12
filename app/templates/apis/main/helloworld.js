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

    currentRoute.onRequest = (request, reply, done) => {
        console.log("called when the request passes validation ...");
        done();
    };

    currentRoute.preHandler = (request, reply, done) => {
        console.log("called before the handler and after on request ...");
        done();
    };

    currentRoute.handler = (request, reply) => {
        console.log('main handler ...');
        //access the global config file

        // access the global configuration file
        // console.log('config', fastify.config);

        // access the cache library
        // console.log('cache', fastify.cache);

        // access the cryptr
        // console.log('cryptr', fastify.cryptr);

        // access the logger
        // console.log('logger', fastify.logger);

        // access the defined driver under config/drivers/index.js
        // fastify['driver_%driver_name%'];

        // access the defined models under config/models/index.js
        // fastify['model_%model_name%'];

        // access the defined modules under config/modules/index.js
        // fastify['module_%module_name%'];

        // access the defined db drivers under config/database/index.js
        // fastify['db_%db_driver_name%'];
        //
        // the framework has 4 ready to use db drivers already hooked up
        // examples:
        // console.log('nosql_db_driver', fastify['db_nosql']);
        // console.log('sql_db_driver', fastify['db_sql']);
        // console.log('redis_driver', fastify['db_redis']);
        // console.log('es_driver', fastify['db_es']);

        return reply.response(null, request.raw.context.user || "hello world");
    };

    currentRoute.onSend = (request, reply, reponse, done) => {
        console.log("called before sending the response ...");
        done();
    };

    currentRoute.onResponse = (request, reply, done) => {
        console.log("called after the response is sent ...");
        done();
    };

    fastify.route(currentRoute);
}

module.exports = routes;