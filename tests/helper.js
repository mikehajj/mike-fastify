"use strict";
const path = require("path");
const request = require("request");

process.env.APP_DIR_FOR_CODE_COVERAGE = path.normalize(path.join(__dirname, "../"));

var testConsole = {
	log: function() {
		if(process.env.SHOW_LOGS === 'true') {
			console.log.apply(this, arguments);
		}
	}
};

var lib = {
	requireModule: function(path) {
		return require((process.env.APP_DIR_FOR_CODE_COVERAGE || '../server/') + path);
	},

	requester: function(ssl, method, params, cb) {
		let protocol = (ssl) ? "https" : "http";
		const requestOptions = {
			timeout: 30000,
			'uri': protocol + '://' + params.uri,
			'json': params.body || true
		};
		if(!params.headers){
			params.headers = {};
		}
		if(!params.headers['user-agent']){
			params.headers['user-agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36";
		}

		if(!Object.hasOwnProperty.call(params.headers,'env')){
			let envCode = process.env.APP_ENV || "dev";
			envCode = envCode.toLowerCase();
			params.headers['env'] = envCode;
		}
		// else if (params.headers['env'] === null){
		// 	delete params.headers['env'];
		// }

		if(params.headers) requestOptions.headers = params.headers;
		if(params.authorization) requestOptions.headers.authorization = params.authorization;
		if(params.qs) requestOptions.qs = params.qs;
		if(params.form !== undefined) {
			requestOptions.form = params.form;
			requestOptions.json = false;
		}
		if(params.formData !== undefined) {
			requestOptions.formData = params.formData;
			requestOptions.json = false;
		}

		testConsole.log('===========================================================================');
		testConsole.log('==== URI     :', params.uri);
		testConsole.log('==== REQUEST :', JSON.stringify(requestOptions));
		request[method](requestOptions, function(err, response, body) {
			testConsole.log('==== RESPONSE:', JSON.stringify(body));
			return cb(err, body, response);
		});
	}
};
module.exports = lib;
