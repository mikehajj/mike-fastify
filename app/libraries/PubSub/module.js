"use strict";

const PubSubModule = function (fastify, options) {
    this.fastify = fastify;
    this.logger = fastify.logger;
    this.options = options;

    this.publisher = {};
    this.subscriber = {};
};

PubSubModule.prototype.get = function (type, name) {
    if (this[type] && this[type][name]) {
        return this[type][name];
    }
    return null;
};

PubSubModule.prototype.list = function (type) {
    if (this[type]) {
        return this[type];
    }
    return null;
};

PubSubModule.prototype.register = function (type, name, driver, handler = null) {
    switch (type) {
        case 'publisher':
            this.publisher[name] = driver.client;
            break;
        case 'subscriber':
            this.subscriber[name] = {
                driver: driver.client,
                handler: handler
            };
            break;
        default:
            throw new Error(`Invalid PubSub type ${type} provided. Please use either: publisher or subscriber.`);
    }
};

module.exports = PubSubModule;