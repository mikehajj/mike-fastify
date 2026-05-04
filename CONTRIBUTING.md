# Contributing

## Developing the framework

1. Clone this repository.
2. Run `npm install` in the repository root.
3. Set `APP_CONFIG` to the bundled fixture when running the app locally, for example:
   - `export APP_CONFIG="$(pwd)/tests/fixture-app/config/index.js"`
4. Run tests:
   - `npm run unit` — unit tests (Mocha), including `tests/unit/app/libraries/*` for core plugins (Response, Request, Cache, PubSub, Socket, etc.).
   - `npm run integration` — integration smoke tests against `tests/fixture-app` (maintenance heartbeat, main `/hello`, private route auth).
   - `npm run coverage` — coverage. `coverage_check.js` compares the **arithmetic mean** of NYC’s four **project totals** (`total.lines`, `total.statements`, `total.functions`, `total.branches` each has `.pct`) against a threshold (**default 95%**). That mean is **not** the same number as the first column of the NYC text table (“All files” is usually **lines only**). Override with `ACCEPTABLE_CI_AVG` (CI sets this until the suite reaches 95%). Set `COVERAGE_MIN_EACH_METRIC=1` to also require every metric ≥ threshold.

The fixture under `tests/fixture-app` mirrors a minimal generated project (config, apis, empty databases list) so the framework can be tested without running `create_project` first.

## Pull requests

- Keep changes focused and describe the motivation in the PR text.
- Run `npm run mocha` before opening a PR when possible.
- Do not commit secrets or environment-specific credentials.

## `reply.response` contract

Handlers should use `reply.response(error, data, status?, headers?)`.

- The third argument is the **HTTP status code** when it is a number in the range 100–599. It is used for both success and error responses when provided.
- For errors without a valid third argument, the framework uses `error.code` when it is a numeric HTTP status; otherwise it defaults to 500.
- CORS is handled by `@fastify/cors` from your config; `reply.response` does not set `Access-Control-*` headers.

Optional: set `trustProxy: true` in your root config object to enable `trustProxy` on both Fastify instances so `X-Forwarded-For` / `X-Real-IP` are honored (see Fastify server options).
