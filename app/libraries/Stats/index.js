"use strict";

const defaultConfig = require( './config' );
const fastifyPlugin = require( 'fastify-plugin' );
const swStats = require( 'swagger-stats' );

/**
 * Register the Swagger Stats Plugin
 * @param fastify
 * @param config
 * @returns {Promise<void>}
 * @constructor
 */
const SwaggerStats = async ( fastify, config ) => {
	
	const statsConfig = { ...defaultConfig };
	statsConfig.ip = config.ip;
	statsConfig.name = config.name;
	config.stats = statsConfig;
	statsConfig.swaggerSpec = config.swagger;
	fastify.register( swStats.getFastifyPlugin, statsConfig );
};

module.exports = fastifyPlugin( SwaggerStats );