"use strict";

const assert = require("assert");
const path = require("path");
const helper = require("../../helper");

const ModelLoader = helper.requireModule(path.join("models", "index"));

describe("Testing Sample Model", () => {

    let ModelInstance = null;

    it("success - model exists", (done) => {
        ModelLoader.load({
            name: "Sample",
            fastify: {},
            config: {},
            logger: {
                debug: (msg) => { console.log(msg); }
            }
        }, true, (error, sampleModel) => {
            assert.ifError(error);
            assert.ok(sampleModel);
            ModelInstance = sampleModel;
            done();
        });
    });

    it("success - call model public method", (done) => {
        ModelInstance.execute({'foo': 'bar'}, (error, data) => {
            assert.ifError(error);
            assert.ok(data);
            done();
        });
    });
});