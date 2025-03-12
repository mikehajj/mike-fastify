"use strict";
const path = require('path');
const fastifyPlugin = require('fastify-plugin');
/**
 * Request Middleware that populates a client object and injects it in the request.
 * The client object contains information related to the user-agent that made the request.
 * @param {Object} fastify
 * @param {Object} options
 * @param {Function} done
 * @returns {Promise<void>}
 * @constructor
 */
const Request = async (fastify, options, done) => {

    /**
     * Attach a hook that triggers as the first step to execute on each new request.
     */
    fastify.addHook('onRequest', async (request, reply) => {

        //attempt to detect the real IP address
        let x_forwarded_for = (request.headers['x-forwarded-for']) ? request.headers['x-forwarded-for'].split(',')[0] : null;
        let ipAddress = request.headers['x-real-ip'] || x_forwarded_for || request.ip;
        ipAddress ? ipAddress.replace(/^::ffff:/i, '') : null;
        //build the context object
        request.raw.context = {
            'ip': ipAddress,
            'hostname': request.hostname,
            'user-agent': request.headers['user-agent'],
            'referer': request.headers['referer'],
            'data': {}
        };

        //check if route exists, if it is public, and if it is private, authenticate, and authorize
        let routeInfo = request.routeOptions.config || null;
        if (routeInfo) {
            if (
                routeInfo.private &&
                fastify.config.auth &&
                fastify.config.auth.driver &&
                Object.hasOwnProperty.call(fastify, `driver_${fastify.config.auth.driver}`)
            ) {
                try{
                    request.raw.context.user = await fastify[`driver_${fastify.config.auth.driver}`].authorize({
                        'routeInfo': routeInfo,
                        'headers': request.headers
                    });
                }
                catch(error){
                    fastify.logger.error(error);
                    return reply.response(error, null, error.code || 401);
                }
            }
        } else {
            return reply.code(404).send('');
        }
    });

    //trigger the next operation, we're done here.
    done();
};

module.exports = fastifyPlugin(Request);