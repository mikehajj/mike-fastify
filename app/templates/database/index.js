"use strict";
const fs = require("fs");
const path = require("path");

const fastifyPlugin = require('fastify-plugin');

/**
 * Database Driver loader, checks to see if the requested driver has a file and if it does, it loads it.
 * once the driver is loaded, it checks to see if there are exposed methods in it otherwise returns an error.
 * if driver is good, returns the driver instance as the second parameter in the callback.
 * @type {{load: DatabaseDriver.load}}
 */
const DatabaseDriver = {

    /**
     * Check if driver has file based on param supplied and load it.
     * @param {String} driverName
     * @param {Object} driverConfig
     * @param {Function} cb
     */
    load: (driverName, driverConfig, cb) => {

        let force = false;
        if(driverConfig && Object.hasOwnProperty.call(driverConfig, 'force')){
            force = driverConfig.force;
        }

        if (!driverName) {
            return cb(new Error("No Database Driver Name was provided!"));
        }

        driverName = driverName.toLowerCase();
        let DriverPath = path.join(__dirname, driverName, "index.js");
        fs.exists(DriverPath, (exists) => {
            if (!exists) {
                return cb(new Error(`Database Driver ${driverName} was not found!`));
            }

            //force delete from cache
            if (force) {
                delete require.cache[require.resolve(DriverPath)];
            }
            const databaseDriver = require(DriverPath);
            if (!databaseDriver) {
                return cb(new Error(`Failed to load Database Driver ${driverName}!`));
            }

            const dbDriver = new databaseDriver(driverConfig);

            if(!dbDriver.connect || typeof dbDriver.connect !== 'function'){
                return cb(new Error(`Database Driver file ${driverName} found and loaded, but it has no connect method!`));
            }

            dbDriver.connect((error) => {
                if (error) {
                    return cb(error);
                }

                //update cache
                return cb(null, dbDriver);
            });
        });
    },

    /**
     * Returns the db driver instance as a decorated fastify plugin
     * @param driverName
     * @param driverInstance
     * @returns {FastifyPluginCallback<Record<never, never>, RawServerDefault, FastifyTypeProviderDefault, FastifyBaseLogger> | *}
     */
    getPlugin: (driverName, driverInstance)=>{
        return fastifyPlugin(async (fastify) => {
            fastify.decorate(`db_${driverName}`, driverInstance);
        });
    }
};

module.exports = DatabaseDriver;