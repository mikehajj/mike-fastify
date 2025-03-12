"use strict";
const paramsHelper = require("./module");
const fastifyPlugin = require('fastify-plugin');

module.exports = fastifyPlugin(async (fastify) => {

    fastify.decorate('params_helper', paramsHelper);
});
