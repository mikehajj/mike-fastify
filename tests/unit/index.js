"use strict";

describe("Running Unit Tests", () => {

    //test the models
    require("./models/index.js");

    //test the drivers
    require("./drivers/index.js");

    // //test the modules
    require("./modules/index.js");

    //test the commands
    require("./commands/index.js");

    //test the main apis
    require("./apis/main/index.js");

    //test the maintenance apis
    require("./apis/maintenance/index.js");

    //test the server application
    require("./app/server.js");

});