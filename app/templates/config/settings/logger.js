"use strict";

module.exports = {
    src: true,
    level: 'trace',
    name: 'logger',
    format: {
        "levelInString": true,
        outputMode: 'long',
    },
    streams: [
        {
            level: 'debug',
            stream: "process.stdout"
        }
    ],
    serializers: {
        req: "function(req){ return { method: req.method, url: req.url }; }",
        res: "function(res){ return ''; }"
    }
};