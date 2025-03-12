"use strict";
const fastifyPlugin = require('fastify-plugin');

module.exports = fastifyPlugin(async (fastify, options) => {
    fastify.decorate('config', options);
});
