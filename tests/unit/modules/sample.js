"use strict";

const assert = require("assert");
const path = require("path");
const helper = require("../../helper");

const Module = helper.requireModule(path.join("modules", "Sample", "module"));

describe("Testing Sample Module", () => {

    let ModuleInstance = new Module({
        fastify: {
            logger: {
                trace: (message) => { console.log(message); },
                debug: (message) => { console.log(message); },
                info: (message) => { console.log(message); },
                error: (message) => { console.log(message); }
            }
        }
    }, {
        'foo': 'bar'
    });

    it("success - call module public method", (done) => {
        ModuleInstance.publicMethod();
        done();
    });
});