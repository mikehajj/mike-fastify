"use strict";
const fs = require( 'fs' );
const path = require( "path" );

const fastifyPlugin = require('fastify-plugin');

const models = {
	/**
	 * load custom drivers from the adjacent drivers folder and cache them
	 * @param {Object} driver
	 * @param {Boolean} force
	 * @param {Function} cb
	 * @returns {*}
	 */
	load: function ( driver, force = false, cb ) {
		if ( !driver.name ) {
			return cb( new Error("No Driver Name was provided!") );
		}
		
		let driverPath = path.join( __dirname, 'drivers', `${ driver.name }`, `index.js` );
		fs.exists( driverPath, ( exists ) => {
			if ( !exists ) {
				return cb( new Error( "Driver was not found!" ) );
			}
			
			if ( force ) {
				//force delete from cache
				delete require.cache[ require.resolve( driverPath ) ];
			}
			
			const myDriver = require( driverPath );
			
			if ( !myDriver ) {
				return cb( new Error( 'Failed to load Driver!' ) );
			}
			
			const driverInstance = new myDriver( driver.config, driver.logger, driver.fastify );
			if ( Object.keys( driverInstance ).length === 0 ) {
				return cb( new Error( 'Driver file found and loaded, but it appears to be invalid!' ) );
			}

			return cb( null, driverInstance );
		} );
	},

	/**
	 * Returns the driver instance as a decorated fastify plugin
	 * @param driverName
	 * @param driverInstance
	 * @returns {FastifyPluginCallback<Record<never, never>, RawServerDefault, FastifyTypeProviderDefault, FastifyBaseLogger> | *}
	 */
	getPlugin: (driverName, driverInstance)=>{
		return fastifyPlugin(async (fastify) => {
			fastify.decorate(`driver_${driverName}`, driverInstance);
		});
	}
};

module.exports = models;