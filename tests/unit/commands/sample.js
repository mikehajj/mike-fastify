"use strict";

const assert = require("assert");
const {exec} = require("child_process");
const path = require("path");
const helper = require("../../helper");

describe("Testing Sample Command", () => {

    it("success - command exists", (done) => {

        let commandWorkingDirectory = path.join(__dirname, "../../../", "commands");

        exec(`node SampleCommand.js -e dev}`, {
            cwd: commandWorkingDirectory,
            env: process.env
        }, (error, data) => {
            assert.ifError(error);
            assert.ok(data);
            done();
        });

    });

});