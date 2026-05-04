"use strict";

const path = require("path");

module.exports = {
    //app global
    /** When true, Fastify trustProxy is enabled and X-Forwarded-For / X-Real-IP are used for client IP (use only behind a trusted reverse proxy). */
    "trustProxy": process.env.APP_TRUST_PROXY === "true" || process.env.APP_TRUST_PROXY === "1",
    "timezone": process.env.APP_TIMEZONE || 'Europe/London',
    "protocol": process.env.APP_PROTOCOL || "http",
    "name": process.env.APP_NAME || "fastify_application",
    "url": process.env.APP_URL || "http://127.0.0.1:4000",
    "url_maintenance": process.env.APP_URL_MAINTENANCE || "http://127.0.0.1:5000",
    "uploadLimit": 200 * 1024 * 1024,
    //settings
    "cache": require("./settings/cache"),
    "cors": require("./settings/cors"),
    "logger": require("./settings/logger"),
    "stats": require("./settings/stats"),

    //auth
    "auth": {
        "driver": "authDriver",
        "ttl": 2 * 3600 * 1000 //token ttl in milliseconds
    },

    //pub-sub
    "pubsub": require("./pubsub/index"),

    //socket
    "socket": require('./socket/index'),

    //servers & apis
    "apis": {
        "folder": path.join(__dirname, "../", "apis"),
        "main": require("./servers/main"),
        "maintenance": require("./servers/maintenance"),
    },

    //databases
    "databases": {
        "folder": path.join(__dirname, "../", "database", "index"),
        "list": require("./databases/index")
    },

    //models
    "models": {
        "folder": path.join(__dirname, "../", "models", "index"),
        "list": require("./models/index")
    },

    //drivers
    "drivers": {
        "folder": path.join(__dirname, "../", "drivers", "index"),
        "list": require("./drivers/index")
    },

    //modules
    "modules": {
        "folder": path.join(__dirname, "../", "modules"),
        "list": require("./modules/index")
    }
};