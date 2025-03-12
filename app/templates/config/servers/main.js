"use strict";

const user_contract = require("../schemas/validation/user");

const server = {
    "ip": process.env.APP_MAIN_IP || "0.0.0.0",
    "port": process.env.APP_MAIN_PORT || 4000,
    "apis": [
        {
            "method": "get",
            "url": "/metrics/:mode?",
            "logLevel": "debug",
            "api": "/main/metrics.js",
            "private": false,
            "roles": [],
            "schema": {
                description: 'Return Server Metrics & Analytics',
                tags: ['Metrics'],
                params: {
                    "type": "object",
                    "properties": {
                        "mode": {
                            "type": "string",
                            "enum": ["ui", "ux", "stats", "metrics"]
                        }
                    }
                }
            }
        },
        {
            "method": "get",
            "url": "/hello/:name?",
            "logLevel": "debug",
            "api": "/main/helloworld.js",
            "private": true,
            "roles": [ "ROLE_ADMIN"],
            "schema": {
                description: 'Sample Hello World API',
                tags: ['Data'],
                // body: user_contract.user,
                "headers": {
                    "type": "object",
                    "properties": {
                        "env": {
                            "type": "string",
                            "minLength": 2
                        }
                    },
                    "required": ['env']
                },
                "params": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string"
                        }
                    },
                    "required": ['name']
                }
            }
        }
    ],
    "swagger": require('../swagger/main')
};

module.exports = server;