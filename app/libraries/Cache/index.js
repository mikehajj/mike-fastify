"use strict";
const fileCacheModule = require("./module");
const fastifyPlugin = require('fastify-plugin');

module.exports = fastifyPlugin(async (fastify, options) => {
    const fileCacheInstance = new fileCacheModule(options);
    fastify.decorate('cache', fileCacheInstance);
});
