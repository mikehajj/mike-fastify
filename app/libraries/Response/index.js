"use strict";
const fastifyPlugin = require('fastify-plugin');

/**
 * Response Builder Class used to standardize the API response.
 * @constructor
 */
const ResponseBuilder = function () {
    this.errors = {};

    /**
     * This method generates a standardized response object in both error and valid cases
     * @param error
     * @param data
     * @returns {{result: boolean, data: *, status: number}|{result: boolean}}
     */
    this.buildResponse = function (error, data) {
        let response = null;
        this.errors = {};
        if (error) {
            if(Array.isArray(error)){
                let message = [];
                error.forEach((oneError) => {
                     message.push(oneError.message);
                });
                message = message.join("\n");
                this.errors.message = message;
            } else {
                this.errors = error;
            }
            response = {status: error.status || error.code || 520, result: false, ts: new Date().getTime(), message: this.errors.message};
        } else {
            response = {status: 200, data: data};
        }
        return response;
    };
};

/**
 * Response Middleware that assists in standardizing all returned responses regardless if they are valid or not.
 * @param {Object} fastify
 * @param {Object} options
 * @returns {Promise<void>}
 * @constructor
 */
const Response = async (fastify, options) => {

    const responseBuilder = new ResponseBuilder();

    /**
     * attach the response to the fastify server
     */
    fastify.decorateReply('response', function (error = null, data = null, status = null, headers = {}) {
        const reply = this;

        let jsonObj = responseBuilder.buildResponse(error, data);
        headers['Content-Type'] = 'application/json';
        headers["Access-Control-Allow-Origin"] = fastify.config.cors.origin;
        headers["Access-Control-Allow-Methods"] = fastify.config.cors.methods;

        reply.headers(headers);

        delete jsonObj.headers;
        delete jsonObj.status;

        if(!reply.alreadySent){
            reply.alreadySent = true;
            if(typeof jsonObj === 'object'){
                jsonObj = JSON.stringify(jsonObj);
            }
            if(error){
                let code = (isNaN(error.code) || error.code < 100) ? 500 : error.code;
                if (code >= 600) code = 500;
                reply.code(code).send(jsonObj);
            }
            else{
                reply.code(200).send(jsonObj);
            }
        }
    });
};

module.exports = fastifyPlugin(Response);