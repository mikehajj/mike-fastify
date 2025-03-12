"use strict";

/**
 * define the drivers that should be auto-loaded upon starting the server or triggering a command line
 * each entry points to a config file that contains the connection configuration to a specific resource type
 */
module.exports = {
    "nosql": require("./nosql"),
    "sql": require("./sql"),
    "redis": require("./redis"),
    "es": require("./es"),
};