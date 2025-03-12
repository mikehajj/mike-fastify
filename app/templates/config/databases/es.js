"use strict";

module.exports = {
    "driver": "elasticsearch",
    "config": {
        node: 'https://localhost:9200',
        // node: 'https://username:password@localhost:9200',
        // nodes: ['https://localhost:9201', 'https://localhost:9202', 'https://localhost:9203'],

        // auth: {
        //     username: 'elastic',
        //     password: 'changeme',
        //     //apiKey: 'base64EncodedKey' //used with elastic.io
        // },

        //cloud: { id: '<cloud-id>' }, //used with elastic.io

        maxRetries: 5,
        pingTimeout: 3000,
        requestTimeout: 60000
    }
};