"use strict";
const fastifyPlugin = require("fastify-plugin");
const {kOptions} = require("fastify/lib/symbols.js");

/**
 * Request plugin: populates request.raw.context (ip, hostname, user-agent, referer, data).
 * When {@link https://fastify.dev/docs/latest/Reference/Server/#trustproxy Fastify trustProxy} is enabled
 * (set `trustProxy: true` on the Fastify server options), `X-Forwarded-For` / `X-Real-IP` are consulted.
 * Fastify 4+ does not expose `trustProxy` on `initialConfig`; this plugin also reads the server options object.
 * When trust proxy is off, `request.ip` is used as-is (IPv4-mapped prefixes are still stripped when the value is a string).
 * @param {import("fastify").FastifyInstance} fastify
 * @returns {Promise<void>}
 */
const Request = async (fastify) => {
    fastify.addHook("onRequest", async (request, reply) => {
        const trustProxy = Boolean(
            (fastify.initialConfig && fastify.initialConfig.trustProxy) ||
                (fastify[kOptions] && fastify[kOptions].trustProxy)
        );
        let ipAddress = request.ip;
        if (trustProxy) {
            const xForwardedFor = request.headers["x-forwarded-for"];
            const forwardedFirst = xForwardedFor ? String(xForwardedFor).split(",")[0].trim() : null;
            const xRealIp = request.headers["x-real-ip"];
            ipAddress = xRealIp || forwardedFirst || request.ip;
        }
        if (typeof ipAddress === "string") {
            ipAddress = ipAddress.replace(/^::ffff:/i, "");
        }
        request.raw.context = {
            ip: ipAddress,
            hostname: request.hostname,
            "user-agent": request.headers["user-agent"],
            referer: request.headers["referer"],
            data: {}
        };
        const routeInfo = request.routeOptions.config || null;
        if (routeInfo) {
            const authDriverName = fastify.config.auth && fastify.config.auth.driver
                ? `driver_${fastify.config.auth.driver}`
                : null;
            if (
                routeInfo.private &&
                fastify.config.auth &&
                fastify.config.auth.driver &&
                fastify[authDriverName]
            ) {
                try {
                    request.raw.context.user = await fastify[authDriverName].authorize({
                        routeInfo: routeInfo,
                        headers: request.headers
                    });
                } catch (error) {
                    fastify.logger.error(error);
                    return reply.response(error, null, error.code || 401);
                }
            }
        }
    });
};

module.exports = fastifyPlugin(Request);
