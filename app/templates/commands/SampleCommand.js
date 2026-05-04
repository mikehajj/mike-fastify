"use strict";

const path = require('path');
let Application;
try {
    Application = require("mike-fastify-framework/app/cli");
} catch (firstErr) {
    Application = require(path.join(__dirname, "..", "..", "cli"));
}

//configure the inputs of this command
//the inputs follow the annotation of 'stdio' library
//Ref: https://www.npmjs.com/package/stdio
const inputs = {
    "env": {
        "key": "e",
        "description": "The first Input to the command",
        "args": 1,
        'required': true
    },
    "profile": {
        "key": "p",
        "description": "The second Input to the command",
        "args": 1,
        "default": path.join(__dirname, "../", "config", "index.js")
    },
};

Application.init(inputs, (error, application) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }

    console.log(application);
    process.exit(0);
});