"use strict";
const bFormat = require('bunyan-format');
let defaultConfig = require("./config");

/**
 * Builds the Logger configuration and creates a new custom logger instance that attaches to the fastify server instance.
 * The argument provided is similar to the default config of this library 'config.js' and can be used to override the
 * default logger configuration
 * @param {Object} config
 */
const Logger = function (config) {
    this.config = {};
    if (!config || !config.logger) {
        config = defaultConfig;
    }

    if(!config.logger.name) {
        config.logger.name = 'logger';
    }

    let loggerConfig = JSON.parse(JSON.stringify(config.logger));

    if (loggerConfig.format) {
        loggerConfig.stream = bFormat(loggerConfig.format);

        //format the streams and re-inject them
        delete loggerConfig.streams;
        delete loggerConfig.format;
    }

    if (loggerConfig.streams) {
        loggerConfig.streams.forEach((oneStream) => {
            if (oneStream.stream === 'process.stdout') {
                oneStream.stream = process.stdout;
            }
        });
    }
    
    if(loggerConfig.serializers && Object.keys(loggerConfig.serializers).length > 0){
        let serializers = {};
        for(let prop in loggerConfig.serializers){
            if(loggerConfig.serializers[prop].trim() !== ''){
                serializers[prop] = new Function("return " + loggerConfig.serializers[prop])();
            }
        }
        loggerConfig.serializers = serializers;
        
    }
    this.config = loggerConfig;
};

/**
 * Creates and returns a new instance of the bunyan logger with the configuration provided.
 * @returns {*}
 */
Logger.prototype.get = function () {
    return new require('bunyan')(this.config);
};

/**
 * Creates and returns a new instance of the logger to use.
 * @param opts
 */
module.exports = function(opts){
    return new Logger(opts);
};
