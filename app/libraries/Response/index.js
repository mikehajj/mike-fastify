"use strict";
const fastifyPlugin = require("fastify-plugin");

/**
 * @param {boolean} isSuccess
 * @param {Error | null} error
 * @param {number | null | undefined} explicitStatus
 * @returns {number}
 */
function resolveReplyCode(isSuccess, error, explicitStatus) {
    if (typeof explicitStatus === "number" && !Number.isNaN(explicitStatus) && explicitStatus >= 100 && explicitStatus < 600) {
        return explicitStatus;
    }
    if (isSuccess) {
        return 200;
    }
    if (error && typeof error.code === "number" && !Number.isNaN(error.code) && error.code >= 100 && error.code < 600) {
        return error.code >= 600 ? 500 : error.code;
    }
    return 500;
}

/**
 * Response Builder Class used to standardize the API response.
 * @constructor
 */
const ResponseBuilder = function () {
    this.errors = {};
    /**
     * @param {Error | Error[] | null} error
     * @param {*} data
     * @param {number | null} httpStatusParam Optional HTTP status for envelope metadata (reply code resolved separately).
     * @returns {{status: number, result?: boolean, data?: *, ts?: number, message?: string}}
     */
    this.buildResponse = function (error, data, httpStatusParam) {
        this.errors = {};
        if (error) {
            let messageText = "";
            if (Array.isArray(error)) {
                const parts = [];
                error.forEach((oneError) => {
                    parts.push(oneError && oneError.message ? oneError.message : String(oneError));
                });
                messageText = parts.join("\n");
                this.errors.message = messageText;
            } else if (error && typeof error === "object") {
                this.errors = error;
                messageText = typeof error.message === "string" ? error.message : "";
            } else {
                messageText = String(error);
                this.errors.message = messageText;
            }
            const metaStatus = resolveReplyCode(false, Array.isArray(error) ? null : error, httpStatusParam);
            return {
                status: metaStatus,
                result: false,
                ts: new Date().getTime(),
                message: messageText || (this.errors && this.errors.message ? String(this.errors.message) : "") || "Error"
            };
        }
        const okStatus = resolveReplyCode(true, null, httpStatusParam);
        return {status: okStatus, data: data};
    };
};

/**
 * Response plugin: decorates reply.response(error, data, status?, headers?).
 * CORS is applied only by @fastify/cors (see Cors library); do not duplicate Access-Control-* on each reply.
 * @param {import("fastify").FastifyInstance} fastify
 * @returns {Promise<void>}
 */
const Response = async (fastify) => {
    const responseBuilder = new ResponseBuilder();
    fastify.decorateReply("response", function (error = null, data = null, status = null, headers = {}) {
        const reply = this;
        const jsonObj = responseBuilder.buildResponse(error, data, status);
        const outHeaders = Object.assign({}, headers);
        outHeaders["Content-Type"] = "application/json";
        reply.headers(outHeaders);
        const payload = Object.assign({}, jsonObj);
        delete payload.headers;
        delete payload.status;
        if (reply.alreadySent) {
            return;
        }
        reply.alreadySent = true;
        const replyCode = resolveReplyCode(!error, error, status);
        if (!error && replyCode === 204) {
            return reply.code(204).send();
        }
        const body = typeof payload === "object" ? JSON.stringify(payload) : String(payload);
        return reply.code(replyCode).send(body);
    });
};

module.exports = fastifyPlugin(Response);
