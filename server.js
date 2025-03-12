"use strict";

/**
 * Require the application and create a new instance.
 *
 * @type {{init, start}}
 */
const ServerApplication = require("mike-fastify-framework/app/server");

const Driver = {
    server: null,

    restart: (cb) => {
        Driver.stop((error) => {
            if (error) {
                return cb(error);
            }
            process.nextTick(() => {
                Driver.start(cb);
            });
        });
    },

    start: (cb) => {
        ServerApplication.start(Driver.server, cb);
    },

    stop: (cb) => {
        ServerApplication.stop(Driver.server, cb);
    },

    launch: async (cb) => {
        if (process.env.APP_ENV) {
            console.log(`Launching Server in environment: ${process.env.APP_ENV}`);
        }

        /**
         * Initialize the instance
         */
        ServerApplication.init((error, server) => {
            if (error) {
                return cb(error);
            }

            Driver.server = server;

            Driver.start(cb);
        });
    }
};

if (require.main === module) {
    Driver.launch((error) => {
        if (error) {
            console.error(error.message);
            process.exit(-1);
        }
    });
} else {
    module.exports = Driver;
}