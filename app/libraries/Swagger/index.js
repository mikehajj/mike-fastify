"use strict";
const fastifyPlugin = require('fastify-plugin');

/**
 * Register the Fastify Swagger Documentation Plugin
 * @param fastify
 * @param swaggerConfig
 * @returns {Promise<void>}
 * @constructor
 */
const Swagger = async (fastify, swaggerConfig) =>{
    fastify.register(require('@fastify/swagger'), swaggerConfig.swagger);
    fastify.register(require('@fastify/swagger-ui'), swaggerConfig.ui);
};

module.exports = fastifyPlugin(Swagger);