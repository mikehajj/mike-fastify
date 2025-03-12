"use strict";

const fs = require('fs');
const path = require('path');
const async = require('async');
const {getopt} = require('stdio');
require('dotenv').config();

let config = null;
let serverLogger = null;


/**
 * workflow:
 * - register all required plugins
 * - parse and build main apis
 * - parse and build maintenance apis
 * - launch main app & maintenance app
 */
const Application = {

    /**
     * This method initializes all the steps required prior to creating the servers.
     * then it creates the main and maintenance servers instances and defines their routes.
     * @param {Object} commandInputConfiguration
     * @param {Function} cb
     */
    init: (commandInputConfiguration, cb) => {
        let options = null;
        if(commandInputConfiguration){
            options = getopt(commandInputConfiguration);
        }

        const configPath = options.profile || process.env.APP_CONFIG;
        //load the global application config
        if (!fs.existsSync(configPath)) {
            return cb(new Error("Project not set up correctly, missing configuration file!"));
        }
        delete require.cache[require.resolve(configPath)];
        config = require(configPath);
        process.env.TZ = config.timezone;

        //create new logger using bunyan and the logger config from registry
        let loggerConfiguration = config.logger ? {'logger': config.logger} : null;
        const logger = require("./libraries/Logger/")(loggerConfiguration);
        serverLogger = logger.get();

        const cliContext = {
            _inputs: options,
            logger: serverLogger
        };

        /**
         * Registering libraries, modules as Plugins
         */
        serverLogger.trace("Attaching Local Configuration Files ....");

        //register the global application config
        cliContext['config'] = config;

        //register the encrypt/decyrpt module
        serverLogger.trace("Attaching Cryptr Library ....");
        cliContext['cryptr'] = require('./libraries/Cryptr/module')

        //register the cache module
        serverLogger.trace("Attaching File Cache Library ....");
        let CacheModule = require('./libraries/Cache/module');
        cliContext['cache'] = new CacheModule(config.cache);

        /**
         * register the models based on the configuration
         */
        async.auto({
            "registerDatabaseDrivers": (aCb) => {
                if (!config.databases || !config.databases.folder || Object.keys(config.databases.list).length === 0) {
                    return aCb(null, true);
                }
                const dbDriverFolder = config.databases.folder;
                const dbDriverLoader = require(dbDriverFolder);
                async.forEachOf(config.databases.list, (dbDriverConfig, dbDriverName, mCb) => {
                    dbDriverLoader.load(dbDriverConfig.driver, dbDriverConfig.config, (error, dbDriverInstance) => {
                        if (error) {
                            return mCb(error);
                        }

                        cliContext['db_' + dbDriverName] = dbDriverInstance;
                        serverLogger.trace(`Registered Database Drivers : ${dbDriverName} ...`);
                        return mCb(null, true);
                    });
                }, aCb);
            },

            "registeringCustomDrivers": (aCb) => {
                if (!config.drivers || !config.drivers.folder || Object.keys(config.drivers.list).length === 0) {
                    return aCb(null, true);
                }

                const driverFolder = config.drivers.folder;
                const driverLoader = require(driverFolder);
                async.forEachOf(config.drivers.list, (driverConfig, driverName, mCb) => {
                    driverLoader.load({
                        name: driverName,
                        config: driverConfig,
                        logger: serverLogger,
                        fastify: cliContext
                    }, true, (error, driverInstance) => {
                        if (error) {
                            return mCb(error);
                        }

                        cliContext[`driver_${driverName}`] = driverInstance;
                        serverLogger.trace(`Registered Drivers : ${driverName} ...`);
                        return mCb(null, true);
                    });
                }, aCb);
            },

            "registeringCustomModels": (aCb) => {
                if (!config.models || !config.models.folder || Object.keys(config.models.list).length === 0) {
                    return aCb(null, true);
                }

                const modelFolder = config.models.folder;
                const modelLoader = require(modelFolder);
                async.forEachOf(config.models.list, (modelConfig, modelName, mCb) => {
                    modelLoader.load({
                        name: modelName,
                        config: modelConfig,
                        logger: serverLogger,
                        fastify: cliContext
                    }, true, (error, modelInstance) => {
                        if (error) {
                            return mCb(error);
                        }

                        cliContext[`model_${modelName}`] = modelInstance;
                        serverLogger.trace(`Registered Model: ${modelName} ...`);
                        return mCb(null, true);
                    });
                }, aCb);
            },

            "registeringCustomModules": (aCb) => {
                if (!config.modules || !config.modules.folder || Object.keys(config.modules.list).length === 0) {
                    return aCb(null, true);
                }

                const modulesFolder = config.modules.folder;
                async.forEachOf(config.modules.list, (moduleConfig, moduleName, mCb) => {
                    const CustomModule = require(path.join(modulesFolder, moduleName, "module"));
                    const moduleInstance = new CustomModule(cliContext, moduleConfig);
                    cliContext[`module_${moduleName.toLowerCase()}`] = moduleInstance;
                    serverLogger.trace(`Registered Module: ${moduleName} ...`);
                    return mCb(null, true);
                }, aCb);
            },

            //this step needs the first step in this async to complete before it begins as it relies on its drivers
            "register PubSub Subscribers": ["registerDatabaseDrivers", (info, aCb) => {
                //load the pubsub module and create a new instance of it
                //this special library offers an instance and a plugin
                //the plugin decorates the instance and attaches it to the fastify server
                //the instance is then used to register all pub/sub entries
                const PubSubInstance = new (require("./libraries/PubSub/module"))(cliContext, config.pubsub.config);
                cliContext['pubsub'] = PubSubInstance;

                if (config.pubsub.publishers && config.pubsub.publishers.length > 0) {
                    async.each(config.pubsub.publishers, (onePubSubProvider, pubCB) => {
                        const driver = cliContext[onePubSubProvider.driver];
                        PubSubInstance.register('publisher', onePubSubProvider.name, driver);
                        serverLogger.trace(`Registered PubSub Provider : ${onePubSubProvider.name} ...`);
                        return pubCB(null, true);
                    }, aCb);
                } else return aCb(null, true);
            }]

        }, (error) => {
            if (error) {
                return cb(error);
            }
            return cb(null, cliContext);
        });
    }
};

module.exports = Application;