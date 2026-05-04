# Models

Models normalize or transform data between external shapes and your application. They are thin wrappers around `execute(context, callback)` and are registered as Fastify decorators.

## Registration

- **Location:** `models/drivers/<modelName>/index.js` (one folder per model).
- **Config:** `config/models/index.js` — each key is the model name; values hold options passed to the constructor.

After bootstrap the decorator holds the **model instance** (not a factory). Call `execute` on it using the key from `config/models/index.js`:

```javascript
request.server.model_productNormalizer.execute(
    { raw: request.body },
    (error, result) => {
        // ...
    }
);
```

Use the exact key from config (for example `productNormalizer` → `model_productNormalizer`).

## Responsibilities

- Map fields, validate payloads, or adapt third-party responses.
- Keep side effects and persistence in **drivers** or **modules**, not inside models, unless the model’s sole job is that transformation.

## Example call from an API handler

```javascript
request.server.model_productNormalizer.execute(
    { raw: request.body },
    (error, normalized) => {
        if (error) {
            return reply.response(error, null);
        }
        return reply.response(null, normalized);
    }
);
```

## Related files

- Sample scaffold: `models/drivers/<name>/index.js` created by `./bin/create_model.sh`.
- Loader: `models/index.js` (project root) discovers models from config.
