"use strict";

const hash = require("object-hash");
const mongoConnectionCache = {};

//Ref: https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/
const Mongo = require("mongodb");
const localConfig = require("./config");
const generateError = function (code) {
    const error = new Error();
    error.code = code;
    error.message = localConfig.errors[code];
    return error;
};

/**
 * Wrapper around native mongodb driver
 * takes db connection configuration as a parameter and exposes easier to use methods.
 * @param dbConfig
 * @constructor
 */
const MongoDriver = function (dbConfig) {
    this.config = dbConfig;
    this.db = null;
    this.client = null;
    this.mongodb = Mongo;
    this.ObjectId = Mongo.ObjectID;
};

/**
 * create new Mongo Object Id
 * @param {string} value
 */
MongoDriver.prototype.ObjectId = function (value) {
    return this.ObjectId(value || null);
};

/**
 * Attempts to establish a connection to mongo database engine
 * @param cb
 */
MongoDriver.prototype.connect = function (cb) {
    connect(this, cb);
};

/**
 * Attempts to establish a connection to mongo database engine
 * @param cb
 */
MongoDriver.prototype.connectPromise = function () {
    const self = this;
    return new Promise((resolve, reject) => {
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
};

/**
 * Closes Mongo connection
 */
MongoDriver.prototype.closeDb = function () {
    const self = this;
    if (self.client) {
        self.client.close();
        self.flushDb();
    }
};

/**
 * resets the db property of this driver to null
 */
MongoDriver.prototype.flushDb = function () {
    const self = this;
    self.db = null;
    self.client = null;
    let testKey = hash(self.config);
    delete mongoConnectionCache[testKey];
};

/**
 * Creates an index on the specified field if the index does not already exist.
 *
 * @param {String} collectionName
 * @param {Object} keys
 * @param {Object} options
 * @returns {*}
 */
MongoDriver.prototype.createIndex = async function (collectionName, keys, options) {
    const self = this;
    // connect
    await self.connectPromise();

    return await self.db.createIndex(collectionName, keys, options);
};

/**
 * Inserts one or multiple records in the database
 * @param {String} collectionName
 * @param {Object} docs
 * @returns {*}
 */
MongoDriver.prototype.insert = async function (collectionName, docs) {
    const self = this;
    // connect
    await self.connectPromise();

    if (Array.isArray(docs)) {
        return await self.db.collection(collectionName).insertMany(docs, {'safe': true});
    } else {
        return await self.db.collection(collectionName).insertOne(docs, {'safe': true});
    }
};

/**
 * Updates a single record in the database
 * @param {String} collectionName
 * @param {Object} docs
 * @returns {*}
 */
MongoDriver.prototype.save = async function (collectionName, docs) {
    const self = this;
    // connect
    await self.connectPromise();
    
    const updatedDoc = {...docs};
    delete updatedDoc._id;
    return await self.db.collection(collectionName).replaceOne({_id: docs._id}, updatedDoc, {
        upsert: false,
        safe: true,
        multi: false
    });
};

/**
 * Updates documents based on the query or criteria and the fields to update
 *
 * @returns {*}
 */
MongoDriver.prototype.update = async function (/*collectionName, criteria, record, [options,]*/) {
    const self = this;

    let collectionName = arguments[0],
        criteria = arguments[1],
        updateOptions = arguments[2],
        extra = arguments[3];

    if (typeof (extra) === 'boolean') {
        extra = {'safe': true, 'multi': true, 'upsert': false};
    }

    // connect
    await self.connectPromise();

    const multi = (extra && Object.hasOwnProperty.call(extra, 'multi')) ? extra.multi : false;
    if (multi) {
        return await self.db.collection(collectionName).updateMany(criteria, updateOptions, extra);
    } else {
        return await self.db.collection(collectionName).updateOne(criteria, updateOptions, extra);
    }
};

/**
 * Removes the objects matching the criteria from the specified collection
 *
 * @param {String} collectionName
 * @param {Object} criteria
 * @returns {*}
 */
MongoDriver.prototype.remove = async function (collectionName, criteria) {
    const self = this;
    if (!criteria) {
        criteria = {};
    }

    // connect
    await self.connectPromise();

    return await self.db.collection(collectionName).deleteMany(criteria, {'safe': true});
};

/**
 * Counts the number of criteria matching documents in a collection
 *
 * @param {String} collectionName
 * @param {Object} criteria
 * @param {Object} options
 * @returns {*}
 */
MongoDriver.prototype.count = async function (collectionName, criteria, options = {}) {
    const self = this;
    // connect
    await self.connectPromise();

    return await self.db.collection(collectionName).count(criteria, options);
};

/**
 * Finds a single document based on the query or criteria
 *
 * @returns {*}
 */
MongoDriver.prototype.findOne = async function (/* collectionName, criteria, fields */) {
    const args = Array.prototype.slice.call(arguments),
        collectionName = args.shift(),
        self = this;
    // connect
    await self.connectPromise();

    return await self.db.collection(collectionName).findOne.apply(self.db.collection(collectionName), args);
};

/**
 * find and returns documents from the database. if stream is set to true, the response will be a stream.
 */
MongoDriver.prototype.find = async function () {
    const args = Array.prototype.slice.call(arguments),
        collectionName = args.shift(),
        self = this;

    let stream = false;
    if (typeof (args[args.length - 1]) === 'boolean') {
        stream = args[args.length - 1];
    }
    // connect
    await self.connectPromise();

    if (stream) {
        let batchSize = 0;
        if (self.config && self.config.streaming) {
            batchSize = self.config.streaming.batchSize;
            if (self.config.streaming[collectionName] && self.config.streaming[collectionName].batchSize)
                batchSize = self.config.streaming[collectionName].batchSize;
        }
        if (batchSize && batchSize > 0)
            return await self.db.collection(collectionName).find.apply(self.db.collection(collectionName), args).batchSize(batchSize).stream();
        else
            return await self.db.collection(collectionName).find.apply(self.db.collection(collectionName), args).stream();
    } else {
        return await self.db.collection(collectionName).find.apply(self.db.collection(collectionName), args).toArray();
    }
};

/**
 * Returns a list of Distinct values from a collection.
 *
 * @returns {*}
 */
MongoDriver.prototype.distinct = async function () {
    const args = Array.prototype.slice.call(arguments),
        collectionName = args.shift(),
        self = this;
    // connect
    await self.connectPromise();

    return await self.db.collection(collectionName).distinct.apply(self.db.collection(collectionName), args);
};

/**
 * Aggregates and returns aggregated results from the database. if stream is turned on, the response will be a stream.
 */
MongoDriver.prototype.aggregate = async function () {
    const args = Array.prototype.slice.call(arguments),
        collectionName = args.shift(),
        stream = (args.length -1),
        self = this;
    
    // connect
    await self.connectPromise();
    
    if (stream) {
        let batchSize = 0;
        if (self.config && self.config.streaming) {
            batchSize = self.config.streaming.batchSize;
            if (self.config.streaming[collectionName] && self.config.streaming[collectionName].batchSize)
                batchSize = self.config.streaming[collectionName].batchSize;

        }
        if (batchSize && batchSize > 0) {
            return await self.db.collection(collectionName).aggregate.apply(self.db.collection(collectionName), args).batchSize(batchSize);
        } else {
            return await self.db.collection(collectionName).aggregate.apply(self.db.collection(collectionName), args);
        }
    } else {
        return await self.db.collection(collectionName).aggregate.apply(self.db.collection(collectionName), args).toArray();
    }
};

/**
 * Public method that generates the mongo url connection from a given configuration object
 * @param {Object} configuration
 * @returns {String} URL
 */
MongoDriver.prototype.getMongoURL = function(configuration){
    let config = configuration || this.config;

    let dbName = config.name;
    if(config.prefix){
        dbName = config.prefix + dbName;
    }
    let url = constructMongoLink(config);
    return {
        url: url,
        dbName: dbName,
        config: config
    };
};

/**
 * PRIVATE HELPER FUNCTIONS
 */

/**
 * Ensure a connection to mongo without any race condition problem
 *
 * @param {Object} obj
 * @param {Function} cb
 * @returns {*}
 */
function connect(obj, cb) {
    if (!obj.config.name) {
        return cb(generateError(192));
    }

    const url = constructMongoLink(obj.config);
    if (!url) {
        return cb(generateError(190));
    }

    let testKey = hash(obj.config);
    if (Object.hasOwnProperty.call(mongoConnectionCache, testKey)) {
        obj.db = mongoConnectionCache[testKey];
        return cb();
    }

    try {
        obj.client = new obj.mongodb.MongoClient(url, obj.config.URLParam)
        obj.client.connect();

        let dbName = obj.config.name;
        if (obj.config.prefix) {
            dbName = obj.config.prefix + dbName;
        }

        obj.db = obj.client.db(dbName);
        mongoConnectionCache[testKey] = obj.db;
        return cb();
    } catch (error) {
        return cb(error);
    }

}

/**
 *constructMongoLink: is a function that takes the below param and return the URL need to by mongodb.connect
 *
 * @param {Object} params
 * @returns {String} url
 */
function constructMongoLink(params) {
    let dbName = params.name;
    let prefix = params.prefix;
    let servers = params.servers;
    let credentials = params.credentials;
    let protocol = params.protocol || "mongodb";

    if (dbName && Array.isArray(servers)) {
        let url = `${protocol}://`;
        if (credentials && Object.hasOwnProperty.call(credentials, 'username') && Object.hasOwnProperty.call(credentials, 'password')) {
            if (credentials.username !== '' && credentials.password !== '') {
                url = url.concat(credentials.username, ':', credentials.password, '@');
            } else {
                delete params.credentials;
            }
        }

        let su = [];
        servers.forEach((oneServer) => {
            let serverEntry = oneServer.host;
            if (protocol === 'mongodb' && oneServer.port) {
                serverEntry += `:${oneServer.port}`;
            }
            su.push(serverEntry);
        });
        url += su.join(',');

        url = url.concat('/');
        if (prefix) url = url.concat(prefix);
        url = url.concat(dbName);

        url = constructMongoOptions(url, params);
        return url;
    }

    return null;

    /**
     *constructMongoOptions: is a function that construct the mongo options for connection
     *
     * @param {String} url
     * @param {Object} config
     * @returns {String}
     */
    function constructMongoOptions(url, config) {
        let options = config.URLParam;
        if (config.extraParam && Object.keys(config.extraParam).length > 0) {
            flatternObject(options, config.extraParam);
        }

        delete options.maxPoolSize;
        delete options.wtimeoutMS;
        delete options.slaveOk;
        delete options.auto_reconnect;
        config.URLParam = options;
        delete config.extraParam;

        return url;

        //flattern extraParams to become one object but priority is for URLParam
        function flatternObject(options, params) {
            for (let i in params) {

                //if URLParam[i] exists, don't override it.
                if (!Object.hasOwnProperty.call(options, i)) {
                    if (typeof (params[i]) === 'object') {
                        flatternObject(options, params[i]);
                    } else {
                        options[i] = params[i];
                    }
                }
            }
        }
    }
}

module.exports = MongoDriver;