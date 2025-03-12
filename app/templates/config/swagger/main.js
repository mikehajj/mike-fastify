module.exports = {
	swagger: {
		routePrefix: '/documentation',
		openapi: {
			info: {
				title: 'Server Main',
				description: 'Main Server API Documentation',
				version: '0.0.1'
			},
			externalDocs: {
				url: 'http://localhost/wiki',
				description: 'Learn More on the official Documentation'
			},
			servers: [
				{
					url: process.env.APP_URL || 'http://localhost:4000',
					"description": "Local Development Server"
				}
			],
			tags: [
				{name: 'Data'}
			],
			components: {
				schemas: {
					User: require('../schemas/entities/user')
				},
				securitySchemes: {
					Authorization: {
						"type": "apiKey",
						"name": "Authorization",
						"in": "header"
					}
				}
			}
		},
		exposeRoute: process.env.APP_MAIN_SWAGGER || true
	},
	ui: {
		routePrefix: '/documentation',
		uiConfig: {},
		uiHooks: {
			onRequest: function (request, reply, next) { next(); },
			preHandler: function (request, reply, next) { next(); }
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, request, reply) => { return swaggerObject; },
		transformSpecificationClone: true
	}
};