"use strict";
const fs = require( 'fs' );
const path = require( "path" );

const fastifyPlugin = require('fastify-plugin');

const models = {
	/**
	 * load models from the adjacent drivers folder and cache them
	 * @param {Object} model
	 * @param {Boolean} force
	 * @param {Function} cb
	 * @returns {*}
	 */
	load: function ( model, force = false, cb ) {
		if ( !model.name ) {
			return cb( new Error("No Model Name was provided!") );
		}
		
		let ModelPath = path.join( __dirname, 'drivers', `${ model.name }`, `index.js` );
		fs.exists( ModelPath, ( exists ) => {
			if ( !exists ) {
				return cb( new Error( "Model was not found!" ) );
			}
			
			if ( force ) {
				//force delete from cache
				delete require.cache[ require.resolve( ModelPath ) ];
			}
			
			const myModel = require( ModelPath );
			
			if ( !myModel ) {
				return cb( new Error( 'Failed to load Model!' ) );
			}
			
			const modelDriver = new myModel( model.config, model.logger, model.fastify );
			if ( Object.keys( modelDriver ).length === 0 ) {
				return cb( new Error( 'Model file found and loaded, but it appears to be invalid!' ) );
			}
			
			return cb( null, modelDriver );
		} );
	},

	/**
	 * Returns the model instance as a decorated fastify plugin
	 * @param modelName
	 * @param modelInstance
	 * @returns {FastifyPluginCallback<Record<never, never>, RawServerDefault, FastifyTypeProviderDefault, FastifyBaseLogger> | *}
	 */
	getPlugin: (modelName, modelInstance)=>{
		return fastifyPlugin(async (fastify) => {
			fastify.decorate(`model_${modelName}`, modelInstance);
		});
	}
};

module.exports = models;