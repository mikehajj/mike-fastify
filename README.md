# Mike Fastify Framework #

The following repository contains the mike **fastify** framework which can be used to 
quickly spin up ready to use web servers.

Each web server has the ability to load and use several drivers, models (DTO), and modules (Business logic).

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

## Usage

Once the framework is installed, create a new project from it:
```shell
./bin/create_project.sh
```
This command will bootstrap your web server with all the features that the framework offers.

It also creates all the api folders, config files, models, modules, drivers samples and sets up the testing platform.

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

You can then add the code of that driver inside its class located at `models/drivers/%driver_name%/index.js`.

### Create an API
To create a new api, run:
```shell
./bin/create_api.sh [main|maintenance] api_name [GET|POST|PUT|DELETE|PATCH|OPTIONS] api_route_endpoint
```
This command create a new api under the `apis/[main|maintenance]` folder and adds a prints out its route configuration on the terminal output.

The api has a business logic file named `api_name` as provided in argument 2.

That file is either created under `apis/main` or `apis/maintenance` folder depending on what you specify as argument 1.

The output of the command should be copied and added either under `config/servers/main.js` or `config/servers/maintenance.js` depending on what you specified as argument 2.

Once the config file is updated, simply restart the server and your new API is now available to handle requets.

You can then add the code of that API in its `fastify route` file under `/apis/[main|maintenance]/api_name.js`.

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

You will also need to udpate the `scripts` commands and add the following:
```json
"scripts": {
    "unit": "node --expose-internals ./node_modules/.bin/mocha ./tests/unit/*.js --timeout=60000 --exit",
    "integration": "node --expose-internals ./node_modules/.bin/mocha ./tests/integration/*.js --timeout=60000 --exit",
    "mocha": "npm run unit && npm run integration",
    "coverage": "./node_modules/.bin/nyc npm run mocha && rm -Rf .nyc_output && node ./coverage_check.js",
    "clean": "rm -Rf node_modules && rm -Rf ./tests/coverage && rm -Rf .nyc_output",
    "test": "npm run clean && npm install && sleep 5 && npm run coverage"
}
```


### Usage
There are several npm scripts that run the tests for you.

```shell
npm run mocha # run the tests but don't record the coverage
npm run unit # run the unit tests only
npm run integration # run the integration tests only
npm run coverate # run everything and record the coverage
npm run test # reset the node_modules, then run everything and record the coverage
npm run clean # clean all previous tests and recorded coverage reports
```