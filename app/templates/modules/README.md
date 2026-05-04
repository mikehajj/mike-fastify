# Modules

Modules hold **business logic**. They receive `(fastify, options)` where `options` is the entry from `config/modules/index.js`. Access them via decorators after registration.

## Registration

- **Location:** `modules/<ModuleName>/module.js` (class or constructor) and `modules/<ModuleName>/index.js` (Fastify plugin wrapper).
- **Config:** `config/modules/index.js` — each key matches the module name used in the decorator.

Decorator pattern:

```javascript
fastify['module_<moduleKey>'](params, callback);
```

The key in `config/modules/index.js` is typically lowercase (for example `products` → `fastify.module_products`).

## Using modules from routes

```javascript
currentRoute.handler = async (request, reply) => {
    const moduleProducts = request.server.module_products;
    return moduleProducts.publicMethod(/* ... */);
};
```

Or with callbacks where your module exposes them:

```javascript
fastify['module_orders'].processCheckout(payload, (error, result) => {
    if (error) {
        return reply.response(error, null);
    }
    return reply.response(null, result);
});
```

## Splitting large modules

If a module grows beyond a manageable size, extract helpers under `modules/<Name>/utils/` or split into multiple modules with clear boundaries.

## Related files

- Scaffold from `./bin/create_module.sh`.
- Pub/sub handlers and socket handlers can reference modules by `type` / `name` in `config/pubsub` or `config/socket` when configured.
