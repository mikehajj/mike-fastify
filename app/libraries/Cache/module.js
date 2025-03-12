"use strict";

const {existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, statSync, unlinkSync} = require('fs');

/**
 * File Caching Class, can be instantiated and used to cache data on the file system
 * @param {Object} options
 * @example { location: '/tmp/cache/', writeLockTTL: 1000 }
 * @constructor
 */
const FileCache = function (options) {
    this.config = {
        cacheLocation: '.cache',
        writeLockTTL: 1000
    };

    if (options.location) {
        if (!existsSync(options.location)) {
            mkdirSync(options.location, {recursive: true});
        }
        this.config.cacheLocation = options.location;
    }

	if(options.writeLockTTL){
		this.config.writeLockTTL = options.writeLockTTL;
	}
};

/**
 * Set the cache file content
 *
 * @param {String} key identifier
 * @param {*} value file content
 * @param {Number} ttl tile to live set to a 60 min default
 * @param {String} loc location to cache in
 */
FileCache.prototype.set = function (key, value, ttl = 60, loc = null) {
    let location = loc || this.config.cacheLocation;
    if (!existsSync(location)) {
        mkdirSync(location, {recursive: true});
    }

    key = key.replace(/\//g, "-");
    if (key.charAt(0) === '-') {
        key = key.substring(1);
    }

    const fileName = `${key}_${ttl}`;
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    writeFileSync(`${location}/${fileName}`, value, {encoding: 'utf8', flag: 'w'});

    //wait before returning a response to ensure the write file instruction removes the file lock.
    setTimeout(() => {
        return true;
    }, this.config.writeLockTTL);
};

/**
 * Get cache file content by key and location if its TTL is higher than expiry TTL
 * @param {String} key
 * @param {String} loc
 */
FileCache.prototype.get = function (key, loc = null) {
    let location = loc || this.config.cacheLocation;

    if (location && !existsSync(location)) {
        return false;
    }

    key = key.replace(/\//g, "-");
    if (key.charAt(0) === '-') {
        key = key.substring(1);
    }
    const getFileByKey = readdirSync(location).filter(fn => fn.startsWith(key));
    if (!getFileByKey.length) {
        return false;
    }

    let contents = null;
    getFileByKey.map(async (item) => {
        const getFileTTL = item.split("_").pop() * 60 * 1000;
        const fileInfo = statSync(`${location}/${item}`);
        const fileCreation = fileInfo.birthtimeMs;
        const ttl = Date.now() - fileCreation;
        if (ttl <= getFileTTL && !contents) {
            contents = readFileSync(`${location}/${item}`, 'utf8');
        }
        if (ttl > getFileTTL) {
            unlinkSync(`${location}/${item}`);
        }
    });

    if (!contents) {
        return false;
    }

    try {
        contents = JSON.parse(contents);
    } catch (e) {

    }

    return contents;
};

/**
 * Remove a cached file using its key identifier.
 * @param {String} key
 * @param {String} loc
 * @example ("filename.txt", "/tmp/cache/")
 */
FileCache.prototype.delete = function (key, loc = null) {
    let location = loc || this.config.cacheLocation;

    key = key.replace(/\//g, "-");
    if (key.charAt(0) === '-') {
        key = key.substring(1);
    }

    const getFileByKey = readdirSync(location).filter(fn => fn.startsWith(key));
    if (!getFileByKey.length) {
        return false;
    }
    getFileByKey.map(item => {
        unlinkSync(`${location}/${item}`);
    });

    return true;
};

/**
 * Clear all cache files in the specified location
 * @param {String} loc
 * @example ("/tmp/cache/")
 */
FileCache.prototype.clear = function (loc = null) {
    let location = loc || this.config.cacheLocation;

    if (!existsSync(location)) {
        return true;
    }
    readdirSync(location).map(item => {
        //remove all
        unlinkSync(`${location}/${item}`);
    });

    return true;
};

module.exports = FileCache;