"use strict";
const os = require( 'os' );

module.exports = {
	name: 'swagger_stats',
	hostname: os.hostname(),
	ip: '127.0.0.1`',
	uriPath: '/stats',
	metricsPrefix: '',
	authentication: false
}