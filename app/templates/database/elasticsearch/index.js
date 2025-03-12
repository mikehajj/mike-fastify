"use strict";

const hash = require("object-hash");
const esConnectionCache = {};

const Client = require('@elastic/elasticsearch');
const localConfig = require("./config");

const generateError = function (code) {
    const error = new Error();
    if (isNaN(code)) {
        error.code = 400;
        error.message = code.message;
    } else {
        error.code = code;
        error.message = localConfig.errors[code];
    }
    return error;
};

/**
 * Wrapper around native elasticsearch driver
 * takes db connection configuration as a parameter and exposes easier to use methods.
 * @param dbConfig
 * @constructor
 */
const ElasticSearchDriver = function (dbConfig) {
    this.config = dbConfig;
    this.client = null;
    this.db = null;
    this.elasticsearch = Client;
};

/**
 * Attempts to establish a connection to ElasticSearch database engine
 * @param cb
 */
ElasticSearchDriver.prototype.connect = function (cb) {
    connect(this, cb);
};

/**
 * Closes ElasticSearch connection
 */
ElasticSearchDriver.prototype.closeDb = function () {
    const self = this;
    if (self.client) {
        self.flushDb();
    }
};

/**
 * resets the db property of this driver to null
 */
ElasticSearchDriver.prototype.flushDb = function () {
    const self = this;
    self.db = null;
    self.client = null;
    let testKey = hash(self.config);
    delete esConnectionCache[testKey];
};

/**
 * Creates the specified index in ES cluster
 * @param {String} indexName
 * @param {Object} mapping
 * @returns {*}
 */
ElasticSearchDriver.prototype.createIndex = async function (indexName, mapping = null) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            self.db.indices.create({index: indexName})
                .then(response => {
                    if(!mapping){
                        return resolve(response);
                    }
                    else{
                        self.db.indices.putMapping({ index: indexName, properties: mapping})
                            .then(response => {
                                return resolve(response);
                            })
                            .catch(error => {
                                return reject(error);
                            });
                    }
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Checks if index exists
 *
 * @param {String} indexName
 * @returns {*}
 */
ElasticSearchDriver.prototype.indexExists = async function (indexName) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            self.db.indices.exists({index: indexName})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Drops the specified collection
 *
 * @param {String} indexName
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.dropIndex = async function (indexName, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            self.db.indices.delete({index: indexName})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Inserts one or multiple records in the database
 * @param {String} indexName
 * @param {Object} docs
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.insert = async function (indexName, docs, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            self.db.index({index: indexName, document: docs})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Updates documents based on the query or criteria and the fields to update
 *
 * @returns {*}
 */
ElasticSearchDriver.prototype.update = async function (indexName, id, record, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            self.db.update({
                index: indexName,
                id: id,
                doc: record,
                refresh: true,
                retry_on_conflict: 5
            })
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Removes the objects matching the documentId from the specified collection
 *
 * @param {String} indexName
 * @param {Object} documentId
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.removeById = async function (indexName, documentId, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            if (!documentId) {
                documentId = {};
            }
            self.db.delete({index: indexName, id: documentId, refresh: true})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Removes the objects matching the criteria from the specified collection
 *
 * @param {String} indexName
 * @param {Object} criteria
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.remove = async function (indexName, criteria, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            if (!criteria) {
                criteria = {};
            }

            self.db.deleteByQuery({index: indexName, query: criteria, refresh: true})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Returns an objects matching the id from the specified collection
 *
 * @param {String} indexName
 * @param {Object} documentId
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.get = async function (indexName, documentId, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }
            self.db.get({index: indexName, query: documentId, refresh: true})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Finds a single document based on the query or criteria
 *
 * @param {String} indexName
 * @param {Object} criteria
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.find = async function (indexName, criteria, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            self.db.search({index: indexName, query: criteria})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * search in elasticsearch
 *
 * @param {Object} context
 * @returns {*}
 */
ElasticSearchDriver.prototype.search = async function (context) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            self.db.search(context)
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * Execute abstract bulk operations on the ES cluster in several indices
 *
 * @param {Array} operations
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.bulk = async function (operations, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            self.db.bulk({refresh: true, operations})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * counts the number of records in an index
 *
 * @param {String} indexName
 * @param {Object} criteria
 * @param {Function} cb
 * @returns {*}
 */
ElasticSearchDriver.prototype.count = async function (indexName, criteria, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
        if (!indexName) {
            return reject(new Error(generateError(191)));
        }
        self.connect(async function (err) {
            if (err) {
                return reject(err);
            }

            self.db.count({index: indexName, query: criteria})
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    });
};

/**
 * PRIVATE HELPER FUNCTIONS
 */

/**
 * Ensure a connection to ElasticSearch without any race condition problem
 *
 * @param {Object} obj
 * @param {Function} cb
 * @returns {*}
 */
function connect(obj, cb) {
    const elasticsearchClientConfig = checkClusterConfiguration(obj.config);
    if (!elasticsearchClientConfig) {
        return cb(generateError(192));
    }

    let testKey = hash(obj.config);
    if (Object.hasOwnProperty.call(esConnectionCache, testKey)) {
        obj.db = esConnectionCache[testKey];
        return cb();
    }

    try {
        obj.client = new obj.elasticsearch.Client(elasticsearchClientConfig);
        obj.db = obj.client;
        esConnectionCache[testKey] = obj.db;
        setTimeout(() => {
            return cb();
        }, 100)
    } catch (error) {
        return cb(error);
    }

    function checkClusterConfiguration(clusterConfiguration) {
        if (
            (!clusterConfiguration.node || clusterConfiguration.node.trim() === '') &&
            (!clusterConfiguration.nodes || !Array.isArray(clusterConfiguration.nodes) || clusterConfiguration.nodes.length === 0)
        ) {
            return null;
        }

        return clusterConfiguration;
    }
}

module.exports = ElasticSearchDriver;