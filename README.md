# Mike Fastify Framework

The following repository contains the mike **fastify** framework which can be used to
quickly spin up ready to use web servers.

Each web server can load **drivers** (external integrations), **models** (DTOs / transforms), and **modules** (business logic), all registered from configuration.

## Overview

- **Dual-server bootstrap**: an application API server (`main`) and a maintenance server (`maintenance`, health-style routes).
- **Configuration-first**: modules, drivers, models, databases, routes, pub/sub, and optional Socket.IO are declared under `config/`.
- **Standard responses**: use `reply.response(error, data, status?, headers?)` from route handlers; you can set HTTP status with the third argument when it is a valid numeric code (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- **Built-in libraries**: config injection, Bunyan logging (with `[REQ]` / `[RES]` lines — see **Request logging** below), cache, cryptr, request context, CORS via `@fastify/cors`, Swagger, stats.
- **Data stores**: MongoDB, MySQL, Redis, Elasticsearch via decorated `fastify['db_*']` instances.
- **Redis pub/sub**: publishers and subscribers driven from `config/pubsub`.
- **Optional Socket.IO**: enabled when `config.socket.handler.driver` is set.

In addition, each server is bootstrapped with ready to use resource drivers that connect to:

| Dependency    | link                                                 |
|---------------|------------------------------------------------------|
| MongoDB       | https://www.npmjs.com/package/mongodb                |
| MySQL2        | https://www.npmjs.com/package/mysql2                 |
| ElasticSearch | https://www.npmjs.com/package/@elastic/elasticsearch |
| Redis         | https://www.npmjs.com/package/redis                  |
| lodash        | https://www.npmjs.com/package/lodash                 |
| async         | https://www.npmjs.com/package/async                  |
| bunyan        | https://www.npmjs.com/package/bunyan                 |
| cryptr        | https://www.npmjs.com/package/cryptr                 |
| swagger       | https://www.npmjs.com/package/@fastify/swagger       |
| swagger-stats | https://www.npmjs.com/package/swagger-stats          |

In addition, each resource driver can be configured to connect to several servers of its type.

## Request logging

Fastify’s default per-request logger is **disabled** on both servers (`disableRequestLogging: true`) so high-frequency health checks do not flood logs. Instead, the framework registers hooks that log one line per request and one per response:

- **`[REQ] METHOD url`** on `onRequest` (skipped for `/heartbeat` and `/heartbeat/` on the maintenance app).
- **`[RES] METHOD url HTTP status elapsedMs`** on `onResponse` (same heartbeat skip).

So load balancers and probes hitting the maintenance **heartbeat** route stay quiet in the request log, while real traffic still shows up in structured lines on the Bunyan child logger for that request.

## Quickstart (this repository)

1. `git clone` this repository and run `npm install`.
2. Export configuration for the bundled smoke fixture: `export APP_CONFIG="$(pwd)/tests/fixture-app/config/index.js"`.
3. Start the app: `node server.js` (or wire `APP_CONFIG` in your process manager).
4. Implement business logic in `modules/`, `drivers/`, `models/`, and register routes under `config/servers/main.js` or `maintenance.js`. Use `reply.response(error, data, status?, headers?)` — the third argument sets the HTTP status when it is a number between 100 and 599 (for both success and error). CORS is handled by `@fastify/cors` from your config.

For a new **application** repo, add this package as a dependency (prefer a published semver version from npm when available), run `install.sh` from `postinstall` once, then use `./bin/create_project.sh` from `node_modules/mike-fastify-framework/bin` or your copied `bin/`. The bootstrap scripts resolve the framework root whether you work from a git clone (`./app/templates`) or from `node_modules/mike-fastify-framework`. Avoid running `npm install` again inside `node_modules/mike-fastify-framework` unless you are developing the framework itself.

### Prerequisites

- Node.js **v17.9.1** or higher (see `package.json` `engines`).
- npm **v8.11.0** or higher.

## Installation

To use the framework, create a new repository and add a `package.json` file in it.

Inside the `package.json` add the framework as a dependency:
```json
"dependencies": {
    "mike-fastify-framework": "*",
}
```
Then add the `post install` script to the `package.json`.
```json
"scripts": {
    "postinstall": "bash node_modules/mike-fastify-framework/install.sh"
}
```
Finally, run `npm install` in your repository and the framework gets installed.

### Environment variables

The root `server.js` loads **dotenv** from the current working directory. Typical variables:

| Variable | Purpose |
|----------|---------|
| `APP_CONFIG` | **Required at runtime.** Absolute path to `config/index.js`. |
| `APP_ENV` | Environment name (e.g. `development`) — use in your own config if needed. |
| `APP_TIMEZONE` | Default timezone for `process.env.TZ` (see template `config/index.js`). |
| `APP_PROTOCOL`, `APP_NAME`, `APP_URL`, `APP_URL_MAINTENANCE` | Application metadata and base URLs. |
| `APP_MAIN_IP`, `APP_MAIN_PORT`, `APP_MAINTENANCE_IP`, `APP_MAINTENANCE_PORT` | Bind addresses and ports when wired through config. |
| `APP_TRUST_PROXY` | Set to `true` or `1` to enable Fastify `trustProxy` and forwarded client IP handling (use only behind a trusted reverse proxy). |

Align names with your generated `config/index.js`; the template maps many keys from `process.env`.

## Usage

Once the framework is installed, create a new project from it:
```shell
./bin/create_project.sh
```
This command will bootstrap your web server with all the features that the framework offers.

It also creates all the api folders, config files, models, modules, drivers samples and sets up the testing platform. Per-component README stubs are copied under `modules/`, `drivers/`, `models/`, and `database/` where applicable.

Start the process:

```shell
export APP_CONFIG="$(pwd)/config/index.js"
node server.js
```

The **main** server serves your application APIs; the **maintenance** server serves routes such as heartbeat/metrics from `config/servers/maintenance.js`.

### Architecture

| Component | Role | Access after bootstrap |
|-----------|------|-------------------------|
| **Module** | Business logic | `fastify['module_<name>']` — instance methods on your class |
| **Driver** | External APIs, email, S3, etc. | `fastify['driver_<name>']` — typically `.execute(context, cb)` |
| **Model** | Normalize / transform data | `fastify['model_<name>']` — `.execute(context, cb)` |
| **Database** | Mongo, MySQL, Redis, ES | `fastify['db_<key>']` — key from `config/databases` |
| **API** | HTTP routes | Files under `apis/main/` or `apis/maintenance/` registered in `config/servers/*.js` |

Configuration lists live in `config/modules/index.js`, `config/drivers/index.js`, `config/models/index.js`, and `config/databases/index.js`. Each registered name becomes the `<name>` segment in the decorator (see each folder’s `README.md` after scaffolding).

### Create a Module
To create a new module, run:
```shell
./bin/create_module.sh module_name
```
This command create a new module under the `modules` folder and adds a new configuration file for it inside `config/modules/index.js`.

You can then add the code of that module inside its class located at `modules/%module_name%/module.js`.

### Create a Model
To create a new model (DT), run:
```shell
./bin/create_model.sh model_name
```
This command create a new model under the `models/drivers` folder and adds a new configuration file for it inside `config/models/index.js`.

You can then add the code of that model inside its class located at `models/drivers/%module_name%/index.js`.

### Create a Driver
To create a new driver, run:
```shell
./bin/create_driver.sh driver_name
```
This command create a new driver under the `drivers/drivers` folder and adds a new configuration file for it inside `config/drivers/index.js`.

You can then add the code of that driver inside its class located at `drivers/drivers/%driver_name%/index.js`.

### Create an API
To create a new api, run:
```shell
./bin/create_api.sh [main|maintenance] api_name [GET|POST|PUT|DELETE|PATCH|OPTIONS] api_route_endpoint
```
This command create a new api under the `apis/[main|maintenance]` folder and adds a prints out its route configuration on the terminal output.

The api has a business logic file named `api_name` as provided in argument 2.

That file is either created under `apis/main` or `apis/maintenance` folder depending on what you specify as argument 1.

The output of the command should be copied and added either under `config/servers/main.js` or `config/servers/maintenance.js` depending on whether you chose `main` or `maintenance` as the first argument.

Once the config file is updated, simply restart the server and your new API is now available to handle requets.

You can then add the code of that API in its `fastify route` file under `/apis/[main|maintenance]/api_name.js`.

**Example**

```shell
./bin/create_api.sh main listUsers GET /api/users
```

Creates `apis/main/listUsers.js` from the neutral stub template and prints JSON to paste into `config/servers/main.js`.

### Standardized responses in routes

Use the response helper from handlers:

```javascript
// Success (optional explicit status)
return reply.response(null, { items: [] });
return reply.response(null, { id: 1 }, 201);

// Error (prefer errors with numeric `error.code` for HTTP status when applicable)
return reply.response(err, null);
```

### Database drivers in application code

Connections are defined under `config/databases/` and implemented under `database/<driver>/`. Access the decorated client from any route or component:

```javascript
// Examples — exact methods depend on the driver implementation
await fastify.db_nosql.findOne("collection", { _id: id });
await fastify.db_sql.query("SELECT * FROM users WHERE id = ?", [id]);
```

You can define multiple connections (e.g. `nosql_primary` and `nosql_secondary`) and use `fastify.db_nosql_primary` and `fastify.db_nosql_secondary` when both are registered in config.

### CLI scripts (`bin/`)

| Script | Purpose |
|--------|---------|
| `create_project.sh` | Scaffold a new app tree from templates (optional `true` to force overwrite). |
| `create_module.sh`, `create_model.sh`, `create_driver.sh` | Add one component; updates the matching `config/*/index.js` when possible. |
| `create_api.sh` | Add an API file and print route JSON for `config/servers/main.js` or `maintenance.js`. |
| `clean_project.sh` | Deletes generated app folders; run with `--yes` for non-interactive use (otherwise type `YES` to confirm). |

## Pub/Sub & Queues

This framework bootstraps PubSub subscribers upon launch.

You only need to register your publishers and your subscribers and the framework handles the rest.

Both are configured under `config/pubsub` folder.

#### Publishers

When configuring publishers, simply add a new entry in the list under `config/pubsub.publishers`. 
Your entry needs the name of the queue to publish to and which `redis` driver to use.

```shell
"publishers": [
    {
        "name": "queue-name-1",
        "driver": "db_red_conn_name"
    },
    {
        "name": "queue-name-2",
        "driver": "db_red_conn_name"
    }
]
```
#### Subscribers

When configuring subscribers, simply add a new entry in the list under `config/pubsub.subscribers`.
Your entry needs the name of the queue to subscribe to, which `redis` driver to use, and a handler.

**Note**
```json
DO NOT USE THE SAME REDIS DRIVER FOR PUBLISHERS AND SUBSCRIBERS.
MAKE SURE THAT EACH HAS A COMPLETELY DIFFERENT INSTANCE.
```
The Handler is a simple `JSON` that contains the type of handling `module | model | driver`, 
the name of the handling driver, which method inside the handler should be used to process the queue message, 
and additional static configuration that should be provided if any.

Then depending on the handler type you have selected, simply make sure that this driver and its method exist.

```shell
"subscribers": [
    {
        "name": "products-to-mongodb",
        "driver": "db_redis_sub_mongo",
        "handler": {
            "type": "module",
            "name": "products",
            "method": "syncToMongo",
            "params": {
                "database": "db_nosql"
            }
        }
    },
    {
        "name": "products-to-es",
        "driver": "db_redis_sub_es",
        "handler": {
            "type": "module",
            "name": "products",
            "method": "syncToES",
            "params": {
                "database": "db_es"
            }
        }
    }
]
```

## WebSockets (Socket.IO)

The main API server can expose **Socket.IO** when a socket **connection handler** is configured. Registration happens at bootstrap (see `app/server.js`); you only supply config and implement the handler (and optional auth) on a `module`, `model`, or `driver` that the framework already decorates on `fastify` (e.g. `fastify.module_products`, `fastify.driver_authDriver`).

### Enabling sockets

Sockets are **off** until `config.socket.handler.driver` is a non-empty string. The shape is defined in `config/socket/index.js` and loaded from the root `config/index.js` as the `socket` key.

- **`handler`** (required to enable): `type` (`module` | `model` | `driver`), `name` (the registered component name, lowercased in the decorator, e.g. `products` → `module_products`), and `driver` (the **method name** on that component called for each new connection: `(socket) => { ... }`).
- **`auth`** (optional): same `type` / `name` / `driver` pattern; the `driver` method is invoked as `(socket, next) => { ... }` in a Socket.IO middleware. If the component or method is missing, the framework skips custom auth and allows the connection to proceed.
- **`auth.routes`**: map of route patterns (e.g. `"/chat/:id"`) to `{ "private": true, "roles": ["ADMIN"] }`. The sample `authDriver` uses this with the client’s `handshake.query.route` to require roles for “private” routes. Public routes can use `"private": false` or omit matching entries.
- **`config`**: optional object passed through to the socket library wrapper (`config.socket.config`); use for app-specific options you read from your own module.

When enabled, the framework registers `fastify-socket.io` with **`cors`** taken from your root **`config.cors`** (same origin policy as the REST API).

### Example `config/socket/index.js`

```javascript
"use strict";

module.exports = {
    "config": {},
    "auth": {
        "type": "driver",
        "name": "authDriver",
        "driver": "socket",
        "routes": {
            "/notifications": {
                "private": true,
                "roles": ["ADMIN", "USER"]
            }
        }
    },
    "handler": {
        "type": "module",
        "name": "realtime",
        "driver": "onConnection"
    }
};
```

Point **`handler.driver`** at a real method, e.g. on `modules/realtime/module.js` expose `Realtime.prototype.onConnection = function (socket) { ... }` after that module is registered.

### Client usage (conceptual)

- Connect to the **main** server URL (same host/port as your public API, not the maintenance port unless you change the bootstrap).
- The template `authDriver` expects a token in **`socket.handshake.auth.token`**. For route-based authorization, pass the logical route in **`handshake.query.route`** so it can be matched against `auth.routes`.
- Implement your `handler` method to subscribe to events, use `socket.user` if the auth driver attached it, and call `socket.emit` / `socket.on` as usual for Socket.IO.

## Testing Platform

The testing platform uses `mocha` to run unit and integration tests.

All tests are written under the `tests` folder.

### Installation
The test platform is automatically created when `create_project` command runs.

however, you still need to install the dependencies so you can use it.
```json
"devDependencies": {
    "esdoc": "^1.1.0",
    "esdoc-brand-plugin": "^1.0.1",
    "esdoc-ecmascript-proposal-plugin": "^1.0.0",
    "esdoc-external-ecmascript-plugin": "^1.0.0",
    "esdoc-external-nodejs-plugin": "^1.0.0",
    "esdoc-node": "^1.0.5",
    "esdoc-node-plugin": "^0.2.1",
    "esdoc-standard-plugin": "^1.0.0",
    "mocha": "^6.2.2",
    "nyc": "^14.1.1",
    "sinon": "^9.0.2"
}
```

You will also need to update the `scripts` commands and add the following (align versions with this repository where possible):
```json
"scripts": {
    "unit": "./node_modules/.bin/mocha ./tests/unit/*.js --timeout=60000 --exit",
    "integration": "./node_modules/.bin/mocha ./tests/integration/*.js --timeout=60000 --exit",
    "mocha": "npm run unit && npm run integration",
    "coverage": "./node_modules/.bin/nyc npm run mocha && rm -Rf .nyc_output && node ./coverage_check.js",
    "clean": "rm -Rf node_modules && rm -Rf ./tests/coverage && rm -Rf .nyc_output",
    "test": "npm run coverage"
}
```


### Usage
There are several npm scripts that run the tests for you.

```shell
npm run mocha # run the tests but don't record the coverage
npm run unit # run the unit tests only
npm run integration # run the integration tests only
npm run coverage # run everything and record the coverage
npm run test # same as coverage (non-destructive; does not remove node_modules)
npm run clean # clean all previous tests and recorded coverage reports
```

`coverage_check.js` compares the **average of NYC’s four total metrics** (lines, statements, functions, branches) to a threshold (default **95%**). The printed **statements** percentage (e.g. 77.89%) is only one of those four; the gate uses their mean. Use `ACCEPTABLE_CI_AVG` to override locally; GitHub Actions sets a lower interim value until the suite reaches 95%. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Developing this framework

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch workflow, how the `tests/fixture-app` layout is used in CI, and the `reply.response` contract.
