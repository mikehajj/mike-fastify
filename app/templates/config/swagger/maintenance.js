module.exports = {
	swagger: {
		routePrefix: '/documentation',
		openapi: {
			info: {
				title: 'Server Maintenance',
				description: 'Maintenance Server API Documentation',
				version: '0.0.1'
			},
			externalDocs: {
				url: 'http://localhost/wiki',
				description: 'Learn More on the official Documentation'
			},
			servers: [
				{
					url: process.env.APP_URL_MAINTENANCE || 'http://localhost:5000',
					"description": "Local Development Server"
				}
			],
			tags: [
				{name: 'Maintenance'}
			],
			components: {
				schemas: {
					Database: require('../schemas/entities/database')
				}
			}
		},
		exposeRoute: process.env.APP_MAINTENANCE_SWAGGER || true
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