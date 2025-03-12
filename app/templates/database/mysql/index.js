"use strict";

const hash = require("object-hash");
const mysqlConnectionCache = {};

const Mysql = require('mysql2/promise');
const localConfig = require("./config");

const generateError = function (code) {
    const error = new Error();
    error.code = code;
    error.message = localConfig.errors[code];
    return error;
};

/**
 * Wrapper around native mysql driver
 * takes db connection configuration as a parameter and exposes easier to use methods.
 * @param dbConfig
 * @constructor
 */
const MySQLDriver = function (dbConfig) {
    this.config = dbConfig;
    this.client = null;
    this.db = null;
    this.mysql = Mysql;
};

/**
 * Attempts to establish a connection to MySQL database engine
 * @param {Function} cb
 */
MySQLDriver.prototype.connect = async function (cb) {
    connect(this, cb);
};

/**
 * Closes MySQL connection
 */
MySQLDriver.prototype.closeDb = function () {
    const self = this;
    if (self.client) {
        self.client.end();
        self.flushDb();
    }
};

/**
 * resets the db property of this driver to null
 */
MySQLDriver.prototype.flushDb = function () {
    const self = this;
    self.db = null;
    self.client = null;
    let testKey = hash(self.config);
    delete mysqlConnectionCache[testKey];
};

/**
 * Inserts one or multiple records in the database
 * @param {String} collectionName
 * @param {Object} docs
 * @returns {*}
 */
MySQLDriver.prototype.insert = async function (collectionName, docs) {
    const self = this;

    return new Promise(async (resolve, reject) => {
        if (!collectionName || !docs) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async (error) => {
            if (error) {
                return reject(error);
            }
            let sql = `INSERT INTO ${collectionName} VALUES ${docs}`;
            let response = await self.db.query(sql);
            return resolve(response);
        });

    });
};

/**
 * Updates documents based on the query or criteria and the fields to update
 *
 * @returns {*}
 */
MySQLDriver.prototype.update = function (collectionName, criteria, updateOptions) {
    const self = this;
    return new Promise(async (resolve, reject) => {
        if (!collectionName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async (error) => {
            if (error) {
                return reject(error);
            }

            let sql = `UPDATE ${collectionName} SET ${updateOptions} WHERE ${criteria}`;
            let response = await self.db.query(sql);
            return resolve(response);
        });
    });
};

/**
 * Removes the objects matching the criteria from the specified collection
 *
 * @param {String} collectionName
 * @param {Object} criteria
 * @param {Function} cb
 * @returns {*}
 */
MySQLDriver.prototype.remove = function (collectionName, criteria) {
    const self = this;
    if (!criteria) {
        criteria = {};
    }

    return new Promise(async (resolve, reject) => {
        if (!collectionName || !docs) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async (error) => {
            if (error) {
                return reject(error);
            }

            let sql = `DELETE FROM ${collectionName} WHERE ${criteria}`;
            let response = await self.db.query(sql);
            return resolve(response);
        });
    });
};

/**
 * Finds a single document based on the query or criteria
 *
 * @returns {*}
 */
MySQLDriver.prototype.find = function (/* collectionName, criteria, fields, callback */) {
    const args = Array.prototype.slice.call(arguments),
        collectionName = args.shift(),
        criteria = args.shift(),
        fields = args.shift(),
        self = this;

    return new Promise(async (resolve, reject) => {
        if (!collectionName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async (error) => {
            if (error) {
                return reject(error);
            }

            let sql = `SELECT ${fields} FROM ${collectionName} WHERE ${criteria}`;
            let [rows] = await self.db.query(sql);
            return resolve(rows);
        });
    });
};

/**
 * Execute abstract custom query
 *
 * @returns {*}
 */
MySQLDriver.prototype.query = function (/* sql, callback */) {
    const args = Array.prototype.slice.call(arguments),
        sql = args.shift(),
        self = this;

    return new Promise(async (resolve, reject) => {
        if (!collectionName || !docs) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async (error) => {
            if (error) {
                return reject(error);
            }

            let response = await self.db.query(sql);
            return resolve(response);
        });
    });
};

/**
 * PRIVATE HELPER FUNCTIONS
 */

/**
 * Ensure a connection to MySQL without any race condition problem
 *
 * @param {Object} obj
 * @param {Function} cb
 * @returns {*}
 */
async function connect(obj, cb) {
    if (!obj.config.database) {
        return cb(generateError(192));
    }
    const mysqlClientConfig = checkClusterConfiguration(obj.config);
    if (!mysqlClientConfig) {
        return cb(generateError(190));
    }

    let testKey = hash(obj.config);
    if (Object.hasOwnProperty.call(mysqlConnectionCache, testKey)) {
        obj.db = mysqlConnectionCache[testKey];
        return cb();
    }

    try {
        obj.client = await obj.mysql.createConnection(mysqlClientConfig);
        obj.db = obj.client;
        mysqlConnectionCache[testKey] = obj.db;
        return cb();
    } catch (error) {
        return cb(error);
    }

    function checkClusterConfiguration(clusterConfiguration) {
        if (!clusterConfiguration.database || clusterConfiguration.database.trim() === '') {
            return null;
        }

        if (!clusterConfiguration.host || clusterConfiguration.host.trim() === '') {
            return null;
        }

        if (!clusterConfiguration.port || clusterConfiguration.port.toString().trim() === '') {
            return null;
        }

        return clusterConfiguration;
    }
}

module.exports = MySQLDriver;