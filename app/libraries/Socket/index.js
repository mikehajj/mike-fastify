"use strict";
const SocketModule = require("./module");
const fastifyPlugin = require('fastify-plugin');

module.exports = function (fastify, options) {

    const _runner = {};
    _runner["Instance"] = new SocketModule(fastify, options);
    _runner["Plugin"] = fastifyPlugin(async (fastify) => {
        fastify.decorate('socket', _runner.Instance);
    });

    return _runner;
};
