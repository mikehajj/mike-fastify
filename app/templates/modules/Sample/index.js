"use strict";

const fastifyPlugin = require('fastify-plugin');
const Module = require("./module");

/**
 * Fastify decorating plugin wrapper that wraps a module instance into the fastify framework
 * The instance can then be accessed by invoking fastify['module_%modulename%']
 * Ex:
 * The below create a new instance of SampleModule located at ['./module.js']
 * This instance is then decorated and using fastify you can call it like:
 * >>> fastify['module_sample'].%function_name%(%parameters%)
 */
module.exports = fastifyPlugin(async (fastify, options) => {
    const Instance = new Module(fastify, options);
    fastify.decorate('module_sample', Instance);
})