"use strict";

const fs = require('fs');
const path = require('path');
const async = require('async');
require('dotenv').config();
const fastifyIO = require('fastify-socket.io');

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
     * @param {Function} cb
     */
    init: (cb) => {
        const configPath = process.env.APP_CONFIG;
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

        /**
         * create 2 servers: main - maintenance using fastify framework
         */
        let mainOptions = {};
        mainOptions.logger = logger.get();
        const serverMain = require('fastify')(mainOptions);
        serverMain.logger = logger.get();

        let maintenanceOptions = {};
        maintenanceOptions.logger = logger.get();
        maintenanceOptions.ignoreTrailingSlash = true;
        const serverMaintenance = require('fastify')(maintenanceOptions);
        serverMaintenance.logger = logger.get();

        //register static routes if configured
        if(config.public){
            serverMain.register(require('@fastify/static'), {
                root: config.public.path,
                prefix: config.public.prefix
            });
        }

        /**
         * Registering libraries, modules as Plugins
         */
        serverLogger.trace("Attaching Local Configuration Files ....");
        //register the global application config
        serverMain.register(require('./libraries/Config/index'), config);
        serverMaintenance.register(require('./libraries/Config/index'), config);

        serverLogger.trace("Attaching Cryptr Library ....");
        //register the encrypt/decyrpt module
        serverMain.register(require('./libraries/Cryptr/index'));
        serverMaintenance.register(require('./libraries/Cryptr/index'));

        serverLogger.trace("Attaching File Cache Library ....");
        //register the file cache module
        serverMain.register(require('./libraries/Cache/index'), config.cache);
        serverMaintenance.register(require('./libraries/Cache/index'), config.cache);

        serverLogger.trace('Attaching Cookies Plugin ...');
        serverMain.register(require('@fastify/cookie'));

        serverLogger.trace('Attaching form-body Plugin ...');
        serverMain.register(require('@fastify/formbody'));
        serverMaintenance.register(require('@fastify/formbody'));

        serverLogger.trace('Attaching multipart Plugin ...');
        serverMain.register(require('@fastify/multipart'), {addToBody: true, limits: { fileSize: config.uploadLimit }});
        serverMaintenance.register(require('@fastify/multipart'), {addToBody: true, limits: { fileSize: config.uploadLimit }});

        serverLogger.trace("Attaching Request Library ....");
        //register the request enhancer
        serverMain.register(require('./libraries/Request/index'));
        serverMaintenance.register(require('./libraries/Request/index'));

        serverLogger.trace("Attaching Params Helper Library ....");
        //register the request enhancer
        serverMain.register(require('./libraries/ParamsHelper/index'));
        serverMaintenance.register(require('./libraries/ParamsHelper/index'));

        serverLogger.trace("Attaching Response Library ....");
        //register the response enhancer
        serverMain.register(require('./libraries/Response/index'));
        serverMaintenance.register(require('./libraries/Response/index'));

        serverLogger.trace("Attaching CORS Plugin ....");
        //register the cors plugin to the framework
        serverMain.register(require('./libraries/Cors/index'), config.cors);
        serverMaintenance.register(require('./libraries/Cors/index'), config.cors);

        serverLogger.trace("Attaching Express Middleware ....");
        serverMain.register(require('@fastify/express'));
        serverMaintenance.register(require('@fastify/express'));

        if (config.apis && config.apis.main) {
            serverLogger.trace("Attaching Metrics Plugin ....");
            serverMain.register(require("./libraries/Stats/index"), {
                ip: config.apis.main.ip,
                name: config.name,
                swagger: config.apis.main.swagger
            });
        }

        /**
         * register the models based on the configuration
         */
        async.auto({
            "registerDatabaseDrivers": (aCb) => {
                const dbDrivers = {};
                if (!config.databases || !config.databases.folder || Object.keys(config.databases.list).length === 0) {
                    return aCb(null, true);
                }
                const dbDriverFolder = config.databases.folder;
                const dbDriverLoader = require(dbDriverFolder);
                async.forEachOf(config.databases.list, (dbDriverConfig, dbDriverName, mCb) => {
                    dbDriverLoader.load(dbDriverConfig.driver, dbDriverConfig.config, (error, dbDriverInstance) => {
                        if (error) {
                            return mCb(error);
                        } else {
                            dbDrivers[`db_${dbDriverName}`] = dbDriverInstance;
                            serverMain.register(dbDriverLoader.getPlugin(dbDriverName, dbDriverInstance));
                            serverMaintenance.register(dbDriverLoader.getPlugin(dbDriverName, dbDriverInstance));
                            serverLogger.trace(`Registered Database Drivers : ${dbDriverName} ...`);
                            return mCb(null, true);
                        }
                    });
                }, (error) => {
                    return aCb(error, dbDrivers);
                });
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
                        fastify: serverMain
                    }, true, (error, driverInstance) => {
                        if (error) {
                            return mCb(error);
                        }

                        serverMain.register(driverLoader.getPlugin(driverName, driverInstance));
                        serverMaintenance.register(driverLoader.getPlugin(driverName, driverInstance));
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
                        fastify: serverMain
                    }, true, (error, modelInstance) => {
                        if (error) {
                            return mCb(error);
                        }

                        serverMain.register(modelLoader.getPlugin(modelName, modelInstance));
                        serverMaintenance.register(modelLoader.getPlugin(modelName, modelInstance));
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
                    serverMain.register(require(path.join(modulesFolder, moduleName)), moduleConfig);
                    serverMaintenance.register(require(path.join(modulesFolder, moduleName)), moduleConfig);
                    serverLogger.trace(`Registered Module: ${moduleName} ...`);
                    return mCb(null, true);
                }, aCb);
            },

            "register Main APIs": (aCb) => {
                if (!config.apis || !config.apis.folder || !config.apis.main) {
                    return aCb(null, true);
                }

                /**
                 * Registering all data routes to the main server
                 */
                const apisFolder = config.apis.folder;

                //register the swagger plugin with main
                serverMain.register(require("./libraries/Swagger/index"), config.apis.main.swagger);

                async.each(config.apis.main.apis, (oneAPI, apiCb) => {
                    serverMain.register(require(path.join(apisFolder, oneAPI.api)), {
                        method: oneAPI.method,
                        url: oneAPI.url,
                        logLevel: oneAPI.logLevel,
                        private: oneAPI.private,
                        roles: oneAPI.roles,
                        schema: oneAPI.schema
                    });
                    serverLogger.trace(`Registered Data Route : ${oneAPI.api} ...`);
                    return apiCb(null, true);
                }, aCb);
            },

            "register Maintenance APIs": (aCb) => {
                if (!config.apis || !config.apis.folder || !config.apis.maintenance) {
                    return aCb(null, true);
                }
                /**
                 * Registering all maintenance routes to the maintenance server
                 */
                const apisFolder = config.apis.folder;

                //register the swagger plugin with maintenance
                serverMaintenance.register(require("./libraries/Swagger/index"), config.apis.maintenance.swagger);

                async.each(config.apis.maintenance.apis, (oneAPI, apiCb) => {
                    serverMaintenance.register(require(path.join(apisFolder, oneAPI.api)), {
                        method: oneAPI.method,
                        url: oneAPI.url,
                        logLevel: oneAPI.logLevel,
                        private: oneAPI.private,
                        roles: oneAPI.roles,
                        schema: oneAPI.schema
                    });
                    serverLogger.trace(`Registered Maintenance Route : ${oneAPI.api} ...`);
                    return apiCb(null, true);
                }, aCb);
            },

            //this step needs the first step in this async to complete before it begins as it relies on its drivers
            "register PubSub Subscribers": ["registerDatabaseDrivers", (info, aCb) => {
                let registeredDBDrivers = info["registerDatabaseDrivers"];

                //load the pubsub module and create a new instance of it
                //this special library offers an instance and a plugin
                //the plugin decorates the instance and attaches it to the fastify server
                //the instance is then used to register all pub/sub entries
                const PubSubInstance = require("./libraries/PubSub/index")(serverMain, config.pubsub.config);
                serverMain.register(PubSubInstance.Plugin);

                async.auto({
                    "register publishers": (pubSubCB) => {
                        if (config.pubsub.publishers && config.pubsub.publishers.length > 0) {
                            async.each(config.pubsub.publishers, (onePubSubProvider, pubCB) => {
                                let driver = registeredDBDrivers[onePubSubProvider.driver];
                                PubSubInstance.Instance.register('publisher', onePubSubProvider.name, driver);
                                serverLogger.trace(`Registered PubSub Provider : ${onePubSubProvider.name} ...`);
                                return pubCB(null, true);
                            }, pubSubCB);
                        } else return pubSubCB(null, true);
                    },
                    "register subscribers": (pubSubCB) => {
                        if (config.pubsub.subscribers && config.pubsub.subscribers.length > 0) {
                            async.each(config.pubsub.subscribers, (onePubSubSubscriber, subCB) => {
                                let driver = registeredDBDrivers[onePubSubSubscriber.driver];
                                let handler = onePubSubSubscriber.handler;
                                PubSubInstance.Instance.register('subscriber', onePubSubSubscriber.name, driver, handler);
                                serverLogger.trace(`Registered PubSub Subscriber : ${onePubSubSubscriber.name} ...`);
                                return subCB(null, true);
                            }, pubSubCB);
                        } else return pubSubCB(null, true);
                    },
                }, aCb);
            }],

            "attach Socket Support": ["register PubSub Subscribers", (info, aCb) => {

                if(config?.socket?.handler?.driver){
                    //register the socket support to the framework
                    serverMain.register(fastifyIO, {cors: config.cors});
                    const socketInstance = require("./libraries/Socket/index")(serverMain, config.socket.config);
                    serverMain.register(socketInstance.Plugin);

                    serverMain.ready().then(() => {
                        serverMain.io.use((socket, next) => {
                            return socketInstance.Instance.registerAuthHandler(socket, config.socket.auth, next);
                        });
                        serverMain.io.on('connection', (socket) => {
                            socketInstance.Instance.registerSocketHandler(socket, config.socket.handler);
                            serverLogger.trace(`Registered Socket handler : ${config.socket.handler.type}_${config.socket.handler.name} ...`);
                        });
                    });
                }
                return aCb(null, true);
            }]

        }, (error) => {
            if (error) {
                return cb(error);
            }
            return cb(null, {'main': serverMain, 'maintenance': serverMaintenance});
        });
    },

    /**
     * This method starts both the main and maintenance servers each on a port.
     * @param {Object} fastify
     * @param {Function} cb
     */
    start: (fastify, cb) => {
        async.auto({

            /**
             * Start the main server instance.
             * @param {Function} aCb
             */
            "start Main": (aCb) => {
                serverLogger.info(`starting main process on ${config.apis.main.ip}:${config.apis.main.port}`);
                fastify.main.listen({port: config.apis.main.port, host: config.apis.main.ip}, aCb);
            },

            /**
             * Start the maintenance server instance.
             * @param {Function} aCb
             */
            "start Maintenance": (aCb) => {
                serverLogger.info(`starting maintenance process on ${config.apis.maintenance.ip}:${config.apis.maintenance.port}`);
                fastify.maintenance.listen({port: config.apis.maintenance.port, host: config.apis.maintenance.ip}, aCb);
            },

            /**
             * Wait for the main server to start and start all registered pub/sub subscribers
             */
            "register subscribers": ["start Main", (info, aCb) => {
                let pubSubSubscribers = fastify.main['pubsub'].list('subscriber');
                if (!pubSubSubscribers || Object.keys(pubSubSubscribers).length === 0) {
                    return aCb(null, true);
                }

                /**
                 * Initiate and launch all pubsub subscribers ....
                 */
                async.forEachOf(pubSubSubscribers, (oneSubscriber, oneSubscriberName, pCb) => {
                    oneSubscriber.driver.subscribe(oneSubscriberName, async (message, channel) => {
                        if (oneSubscriber.handler) {
                            try {
                                //if the subscriber has a handler of type [module, model, driver] then invoke that handler
                                //otherwise just log the message
                                switch (oneSubscriber.handler.type) {
                                    case 'module':
                                    case 'model':
                                    case 'driver':
                                        await fastify.main[`${oneSubscriber.handler.type}_${oneSubscriber.handler.name}`][oneSubscriber.handler.method]({
                                            channel: channel,
                                            message: message,
                                            params: oneSubscriber.handler.params
                                        });
                                        break;
                                    default:
                                        fastify.main.logger.trace('Received published message from channel: ' + channel, message);
                                        break;
                                }
                            } catch (error) {
                                fastify.main.logger.error(error);
                            }
                        } else {
                            fastify.main.logger.trace('Received published message from channel: ' + channel, message);
                        }
                    });
                    fastify.main.logger.trace(`PubSub subscriber ${oneSubscriberName} is now listening to message ...`);
                    return pCb(null, true);
                }, aCb);
            }]
        }, cb);
    },

    /**
     * This method stops both the main and maintenance servers.
     * @param {Object} fastify
     * @param {Function} cb
     */
    stop: (fastify, cb) => {
        async.series({

            "stop Main": (aCb) => {
                serverLogger.info(`stopping main process on ${config.apis.main.ip}:${config.apis.main.port}`);
                fastify.main.close();
                process.nextTick(() => {
                    return aCb(null, true);
                });
            },

            "stop Maintenance": (aCb) => {
                serverLogger.info(`stopping maintenance process on ${config.apis.main.ip}:${config.apis.main.port}`);
                fastify.maintenance.close();
                process.nextTick(() => {
                    return aCb(null, true);
                });
            }
        }, cb);
    }
};

module.exports = Application;
