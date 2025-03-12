"use strict";

const assert = require("assert");
const {exec} = require("child_process");
const path = require("path");
const helper = require("../../helper");

describe("Testing Application Server", () => {

    it("success - driver exists", (done) => {

        process.env['APP_CONFIG'] = path.join(__dirname, "../../../config/index.js");
        const Server = helper.requireModule("server");

        assert.ok(Server.launch);
        assert.ok(Server.start);
        assert.ok(Server.stop);
        assert.ok(Server.restart);

        Server.launch((error, server) => {
            assert.ifError(error);
            assert.ok(server);

            Server.stop((error) => {
                assert.ifError(error);

                done();
            });
        });

    });

});