"use strict";

const cors = require('@fastify/cors');
const fastifyPlugin = require('fastify-plugin');

const ServerCORS = async (fastify, configuration) => {
    let updatedConfiguration = {
        origin: configuration.origin,
        methods: configuration.methods,
        allowedHeaders: configuration.headers,
        credentials: configuration.credentials,
        maxAge: configuration.maxAge
    };

    fastify.register(cors, updatedConfiguration);
};

module.exports = fastifyPlugin(ServerCORS);
