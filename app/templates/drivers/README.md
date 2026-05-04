# Drivers

Drivers integrate **external systems**: HTTP APIs, email, object storage, payment gateways, etc. Each driver implements `execute(context, callback)` (and optionally other methods referenced by name from sockets or other hooks).

## Registration

- **Location:** `drivers/drivers/<driverName>/index.js`.
- **Config:** `config/drivers/index.js` — connection URLs, API keys (prefer env-backed values), and feature flags.

Access after startup:

```javascript
fastify['driver_<driverKey>'](context, (error, result) => {
    // ...
});
```

The decorator name matches your config key (for example `mailer` → `fastify.driver_mailer`).

## Typical usage from an API

```javascript
currentRoute.handler = async (request, reply) => {
    request.server.driver_mailGateway.execute(
        { to: request.body.email, template: "welcome" },
        (error, sendResult) => {
            if (error) {
                return reply.response(error, null);
            }
            return reply.response(null, { sent: true });
        }
    );
};
```

## Secrets and configuration

Put secrets in environment variables and read them through `config/drivers` or `fastify.config`. Do not commit API keys.

## Related files

- Loader wiring: `drivers/index.js`.
- Auth-related socket helpers often live on an `authDriver` under `drivers/drivers/authDriver/` when using the framework’s Socket.IO template.
