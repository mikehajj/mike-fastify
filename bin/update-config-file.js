"use strict"

const fs = require("fs");
const path = require("path");

const type = process.argv[2];
const name = process.argv[3];

if (type === 'apis') {
    const apiMethod = process.argv[4];
    const apiRoute = process.argv[5];
    const apiType = process.argv[6];

    //if config file doesn't exist, create it
    if (!fs.existsSync(path.join(__dirname, "../", "config", 'servers', `${apiType}.js`))) {
        throw new Error("Invalid operation, please make sure there is a configuration for APIs before proceeding!");
    }

    let apiSample = {
        "method": apiMethod.toLowerCase(),
        "url": apiRoute,
        "logLevel": "debug",
        "api": `/${apiType}/${name}.js`,
        "schema": {
            description: 'Server API',
            tags: [apiType]
        }
    };

    console.log(`\n\n********************************************************************`);
    console.log(`* Please copy the output below and add it inside the [apis] array in file: [config/app/${apiType}.js]`);
    console.log("*");
    console.log(JSON.stringify(apiSample, null, 2));
    console.log("*");
    console.log(`********************************************************************\n\n`);

} else {
    //if config file doesn't exist, create it
    if (!fs.existsSync(path.join(__dirname, "../", "config", type, "index.js"))) {
        fs.writeFileSync(path.join(__dirname, "../", "config", type, "index.js"), "\"use strict\";\n" +
            "\n" +
            "module.exports = {};", {encoding: "utf8"})
    }

    //load config file
    const config = require(path.join(__dirname, "../", "config", type, "index.js"));

    //if config entry doesn't exist, create it
    if (!config[name]) {
        config[name] = {
            "config_entry": "value"
        };
    }

    //rewrite config file
    let newConfig = '"use strict";\n' +
        '\n' +
        'module.exports = ';
    newConfig += JSON.stringify(config, null, 2);
    newConfig += ';';
    fs.writeFileSync(path.join(__dirname, "../", "config", type, "index.js"), newConfig, {encoding: 'utf8'});
}
