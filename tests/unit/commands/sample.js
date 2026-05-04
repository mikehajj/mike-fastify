"use strict";

const assert = require("assert");
const {exec} = require("child_process");
const path = require("path");
const helper = require("../../helper");

describe("Testing Sample Command", () => {

    it("success - command exists", (done) => {

        const commandWorkingDirectory = path.join(__dirname, "../../../app/templates/commands");
        const profilePath = path.join(__dirname, "../../fixture-app/config/index.js");
        exec(`node SampleCommand.js -e dev -p ${JSON.stringify(profilePath)}`, {
            cwd: commandWorkingDirectory,
            env: process.env
        }, (error, data) => {
            assert.ifError(error);
            assert.ok(data);
            done();
        });

    });

});