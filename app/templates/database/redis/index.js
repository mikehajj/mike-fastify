"use strict";

const hash = require("object-hash");
const redisConnectionCache = {};

const Redis = require('redis');
const localConfig = require("./config");

const generateError = function (code) {
    const error = new Error();
    error.code = code;
    error.message = localConfig.errors[code];
    return error;
};

/**
 * Wrapper around native redis driver
 * takes db connection configuration as a parameter and exposes easier to use methods.
 * @param dbConfig
 * @constructor
 */
const RedisDriver = function (dbConfig) {
    this.config = dbConfig;
    this.duplicate = dbConfig.duplicate || false;
    this.client = null;
    this.db = null;
    this.redis = Redis;
};

/**
 * Attempts to establish a connection to redis server
 * @param cb
 */
RedisDriver.prototype.connect = function (cb) {
    connect(this, cb);
};

/**
 * Closes Redis connection
 */
RedisDriver.prototype.closeDb = function () {
    const self = this;
    if (self.client) {
        self.client.disconnect();
        self.flushDb();
    }
};

/**
 * resets the db property of this driver to null
 */
RedisDriver.prototype.flushDb = function () {
    const self = this;
    self.db = null;
    self.client = null;
    let testKey = hash(self.config);
    delete redisConnectionCache[testKey];
};

/**
 * PRIVATE HELPER FUNCTIONS
 */

/**
 * Ensure a connection to Redis without any race condition problem
 *
 * @param {Object} obj
 * @param {Function} cb
 * @returns {*}
 */
function connect(obj, cb) {

    const redisClientConfig = checkClusterConfiguration(obj.config);
    if (!redisClientConfig) {
        return cb(generateError(190));
    }

    let testKey = hash(obj.config);
    if (Object.hasOwnProperty.call(redisConnectionCache, testKey)) {
        obj.db = redisConnectionCache[testKey];
        return cb();
    }

    let url = createRedisConnectionURL(redisClientConfig);
    if (!url) {
        return cb(generateError(191));
    }

    try {
        obj.client = obj.redis.createClient({url: url});
        if(obj.duplicate){
            obj.client = obj.client.duplicate();
        }
        obj.client.connect();
        obj.db = obj.client;
        redisConnectionCache[testKey] = obj.db;
        return cb();
    } catch (error) {
        return cb(error);
    }

    function createRedisConnectionURL(clusterConfiguration) {
        let url = null;

        if (clusterConfiguration.host) {
            url = clusterConfiguration.host;
        }

        if (clusterConfiguration.port) {
            url += ':' + clusterConfiguration.port;
        }

        if (clusterConfiguration.user) {
            let user = clusterConfiguration.user;
            if (clusterConfiguration.password) {
                user += ":" + clusterConfiguration.password;
            }

            url = 'redis://' + user + "@" + url;

        } else {
            url = 'redis://' + url;
        }

        return url;
    }

    function checkClusterConfiguration(clusterConfiguration) {
        if (!clusterConfiguration.host || clusterConfiguration.host.trim() === '') {
            return null;
        }

        if (!clusterConfiguration.port || clusterConfiguration.port.toString().trim() === '') {
            return null;
        }

        return clusterConfiguration;
    }
}

module.exports = RedisDriver;