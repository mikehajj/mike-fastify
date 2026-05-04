# Database layer (`database/`)

This folder contains **database driver implementations** that connect to MongoDB, MySQL, Redis, Elasticsearch, and similar stores. The framework loads them by name from here and decorates Fastify with `db_<name>` (for example `db_nosql`, `db_sql`).

## Configuration (which connections exist)

Connection settings live under **`config/databases/`** — see `config/databases/index.js` and the files it requires (`nosql.js`, `sql.js`, `redis.js`, `es.js`). Each exported block tells the bootstrap which driver file under `database/<driver>/` to load and with which options.

Example shape (conceptual):

```javascript
// config/databases/index.js wires named pools
module.exports = {
    nosql: require("./nosql"),
    sql: require("./sql"),
    redis: require("./redis"),
    es: require("./es"),
};
```

## Implementing or extending a driver

Each subfolder (for example `mongo/`, `mysql/`, `redis/`) usually contains:

- `index.js` — driver class with at least `connect(callback)` and query helpers used by the framework or your code.

New database types should follow the same pattern: implement `connect`, expose the operations your app needs, and register via `config/databases` so the loader picks them up.

## Using databases from application code

Prefer the decorated Fastify instance rather than importing clients directly:

```javascript
fastify.db_nosql.findOne("users", { _id: id }).then(/* ... */);
```

Exact methods depend on the driver implementation in each `database/<name>/index.js`.

## Multiple connections

Use distinct keys in `config/databases` (for example `nosql_primary`, `nosql_archive`) so each maps to `db_<key>` without collisions.

## Related files

- Loader: `database/index.js` (`DatabaseDriver.load` and `getPlugin`).
- Global config entry: `config/index.js` includes the databases section read at startup.
