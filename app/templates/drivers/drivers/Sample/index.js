"use strict";

const Sample = function(options, logger, fastify){
    this.options = options;
    this.logger = logger;
    this.fastify = fastify;
};

/**
 * private function
 * @param {string} message
 * @returns {*}
 */
Sample.test = function(message){
    //call the logger property
    this.logger.debug(message);
};

/**
 * public function
 * @param context
 * @param cb
 * @returns {*}
 */
Sample.prototype.execute = function(context, cb){
    //call the logger property
    this.logger.debug(context);

    //call the private method
    Sample.test.call(this, 'test message');
    return cb(null, true);
};

module.exports = Sample;