"use strict";
const myCrypter = require("./module");
const fastifyPlugin = require('fastify-plugin');

module.exports = fastifyPlugin(async (fastify) => {

    fastify.decorate('cryptr', myCrypter);
});
