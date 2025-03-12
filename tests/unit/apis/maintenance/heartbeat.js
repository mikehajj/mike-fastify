"use strict";
const assert = require("assert");
const path = require("path");

const helper = require("../../../helper");
const API = helper.requireModule(path.join("apis", "maintenance", "heartbeat"));

describe("Testing Heartbeat API", () => {

    it("success - it works", (done) => {
        let fastify = {
            route: function (obj) {
                fastify.test = obj.handler;
            },
            response: function (reply, error, data) {
                return new Promise((resolve, reject) => {
                    if (error) {
                        return reject(error);
                    } else {
                        return resolve(data);
                    }
                });
            }
        };

        let reply = {
            response(error, data){
                return new Promise((resolve, reject) => {
                    if(error){
                        return reject(error);
                    }
                    return resolve(data);
                });
            }
        };

        API(fastify, {
            method: 'get',
            url: '/heartbeat',
            schema: {}
        });

        fastify.test({}, reply).then(data => {
            assert.ok(data);
            done();
        });
    });

});