"use strict";

const SocketModule = function (fastify, options) {
    this.fastify = fastify;
    this.logger = fastify.logger;
    this.options = options;
};

/**
 * Public method that registers a socket.io auth to a handler in the framework
 * @param {Object} socket
 * @param {Object} handler
 * @param {Function} next
 */
SocketModule.prototype.registerAuthHandler = function (socket, handler, next) {
    //create a new instance of the handler
    const socketHandler = this.fastify[`${handler.type}_${handler.name}`];

    if(!socketHandler || !handler.driver || !socketHandler[handler.driver]){
        this.logger.debug("No Socket Auth Handler registered; ignoring socket authentication ....");
        return next();
    }
    //call the handler main function and use it
    socketHandler[handler.driver](socket, next);
};

/**
 * Public method that registers a socket.io socket to a handler in the framework
 * @param {Object} socket
 * @param {Object} handler
 */
SocketModule.prototype.registerSocketHandler = function (socket, handler) {
    //create a new instance of the handler
    const socketHandler = this.fastify[`${handler.type}_${handler.name}`];

    if(!socketHandler || !handler.driver || !socketHandler[handler.driver]){
        this.logger.debug("No Socket Handler registered!");
    }
    else {
        //call the handler main function and use it
        socketHandler[handler.driver](socket);
    }
};

module.exports = SocketModule;