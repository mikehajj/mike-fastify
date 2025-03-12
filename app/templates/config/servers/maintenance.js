"use strict";

const server = {
    "ip": process.env.APP_MAINTENANCE_IP || "0.0.0.0",
    "port": process.env.APP_MAINTENANCE_PORT || 5000,
    "apis": [
        {
            "method": "get",
            "url": "/heartbeat",
            "logLevel": "debug",
            "api": "/maintenance/heartbeat.js",
            "private": false,
            "roles": [],
            "schema": {
                description: 'Server Heartbeat check operation API',
                tags: ['Maintenance']
            }
        }
    ],
    "swagger": require('../swagger/maintenance')
};

module.exports = server;