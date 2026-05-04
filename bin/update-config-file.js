"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = process.env.MIKE_FASTIFY_PROJECT_ROOT
    ? path.resolve(process.env.MIKE_FASTIFY_PROJECT_ROOT)
    : path.join(__dirname, "..");

const type = process.argv[2];
const name = process.argv[3];

if (type === "apis") {
    const apiMethod = process.argv[4];
    const apiRoute = process.argv[5];
    const apiType = process.argv[6];

    if (!fs.existsSync(path.join(projectRoot, "config", "servers", `${apiType}.js`))) {
        throw new Error("Invalid operation, please make sure there is a configuration for APIs before proceeding!");
    }

    const apiSample = {
        method: apiMethod.toLowerCase(),
        url: apiRoute,
        logLevel: "debug",
        api: `/${apiType}/${name}.js`,
        private: false,
        roles: [],
        schema: {
            description: "Server API",
            tags: [apiType]
        }
    };

    console.log("\n\n********************************************************************");
    console.log("* Please copy the output below and add it inside the [apis] array in file:");
    console.log(`*   config/servers/${apiType}.js`);
    console.log("*");
    console.log(JSON.stringify(apiSample, null, 2));
    console.log("*");
    console.log("********************************************************************\n\n");
} else {
    /**
     * Merges a new key into config/{type}/index.js by loading, mutating, and JSON.stringify.
     * Those index files must remain plain JSON-compatible exports (no require(), functions, or
     * getters); otherwise this rewrite will corrupt them. Prefer editing complex configs by hand.
     */
    const indexPath = path.join(projectRoot, "config", type, "index.js");
    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, "\"use strict\";\n\nmodule.exports = {};", {encoding: "utf8"});
    }

    const config = require(indexPath);

    if (!config[name]) {
        config[name] = {
            config_entry: "value"
        };
    }

    let newConfig = "\"use strict\";\n\nmodule.exports = ";
    newConfig += JSON.stringify(config, null, 2);
    newConfig += ";";
    fs.writeFileSync(indexPath, newConfig, {encoding: "utf8"});
}
