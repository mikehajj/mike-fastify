"use strict";
const path = require("path");
const http = require("http");
const https = require("https");
const {URL} = require("url");

const fixtureAppRoot = path.join(__dirname, "fixture-app");

process.env.APP_DIR_FOR_CODE_COVERAGE = path.normalize(path.join(__dirname, "../"));

const testConsole = {
    log: function () {
        if (process.env.SHOW_LOGS === "true") {
            console.log.apply(this, arguments);
        }
    }
};

/**
 * @param {string} modulePath Path relative to fixture-app (e.g. apis/main/helloworld) or "server" for repo server.js
 * @returns {unknown}
 */
function requireModule(modulePath) {
    if (modulePath === "server") {
        return require(path.join(__dirname, "..", "server.js"));
    }
    const base = process.env.TEST_FIXTURE_ROOT || fixtureAppRoot;
    return require(path.join(base, modulePath));
}

/**
 * @param {boolean} ssl
 * @param {string} method
 * @param {{uri: string, body?: unknown, headers?: Record<string, string>, authorization?: string, qs?: Record<string, string>, form?: unknown, formData?: unknown}} params
 * @param {(err: Error | null, body: unknown, response: import("http").IncomingMessage) => void} cb
 */
function requester(ssl, method, params, cb) {
    const protocol = ssl ? "https" : "http";
    const headers = Object.assign({}, params.headers || {});
    if (!headers["user-agent"]) {
        headers["user-agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36";
    }
    if (!Object.prototype.hasOwnProperty.call(headers, "env")) {
        headers.env = (process.env.APP_ENV || "dev").toLowerCase();
    }
    if (params.authorization) {
        headers.authorization = params.authorization;
    }
    const url = new URL(protocol + "://" + params.uri);
    if (params.qs) {
        Object.keys(params.qs).forEach((key) => {
            url.searchParams.set(key, String(params.qs[key]));
        });
    }
    const lib = ssl ? https : http;
    const methodUpper = (method || "get").toUpperCase();
    let bodyPayload = null;
    if (params.body !== undefined && params.body !== null && methodUpper !== "GET" && methodUpper !== "HEAD") {
        headers["content-type"] = headers["content-type"] || "application/json";
        bodyPayload = typeof params.body === "string" ? params.body : JSON.stringify(params.body);
    }
    const options = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (ssl ? 443 : 80),
        path: url.pathname + url.search,
        method: methodUpper,
        headers,
        timeout: 30000
    };
    testConsole.log("===========================================================================");
    testConsole.log("==== URI     :", params.uri);
    testConsole.log("==== REQUEST :", JSON.stringify(options));
    const req = lib.request(options, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            let body = raw;
            const ct = res.headers["content-type"] || "";
            if (ct.includes("application/json") && raw.length > 0) {
                try {
                    body = JSON.parse(raw);
                } catch (parseErr) {
                    body = raw;
                }
            }
            testConsole.log("==== RESPONSE:", JSON.stringify(body));
            return cb(null, body, res);
        });
    });
    req.on("error", (err) => cb(err, null, null));
    if (bodyPayload) {
        req.write(bodyPayload);
    }
    req.end();
}

module.exports = {
    requireModule,
    requester
};
