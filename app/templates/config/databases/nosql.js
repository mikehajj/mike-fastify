"use strict";

module.exports = {
    "driver": "mongo",
    "config": {
        "name": "vorteile",
        "prefix": "new_",
        "servers": [
            {
                "host": "127.0.0.1",
                "port": 27017
            }
        ],
        "credentials": null,
        "streaming": {
            "batchSize": 10000
        },
        "URLParam": {
            "maxPoolSize": 2
        }
    }
};