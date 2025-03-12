"use strict";

const assert = require("assert");
const path = require("path");
const helper = require("../../helper");

const DriverLoader = helper.requireModule(path.join("drivers", "index"));

describe("Testing Sample Driver", () => {

    let DriverInstance = null;

    it("success - driver exists", (done) => {
        DriverLoader.load({
            name: "Sample",
            fastify: {},
            config: {},
            logger: {
                debug: (msg) => { console.log(msg); }
            }
        }, true, (error, sampleDriver) => {
            assert.ifError(error);
            assert.ok(sampleDriver);
            DriverInstance = sampleDriver;
            done();
        });
    });

    it("success - call driver public method", (done) => {
        DriverInstance.execute({'foo': 'bar'}, (error, data) => {
            assert.ifError(error);
            assert.ok(data);
            done();
        });
    });
});