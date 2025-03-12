"use strict";
const PubSubModule = require("./module");
const fastifyPlugin = require('fastify-plugin');

module.exports = function (fastify, options) {

    const _runner = {};
    _runner["Instance"] = new PubSubModule(fastify, options);
    _runner["Plugin"] = fastifyPlugin(async (fastify) => {
        fastify.decorate('pubsub', _runner.Instance);
    });

    return _runner;
};
