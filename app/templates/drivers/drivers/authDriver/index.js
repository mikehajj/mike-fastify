"use strict";

const _lodash = require('lodash');
const {pathToRegexp} = require('path-to-regexp');

/**
 * Authentication Driver used to authenticate and authorize the access of a user by validating the headers with the
 * configured route information.
 * - If the route is private then an 'authorization' needs to be provided.
 * - If the route is also protected by specific roles, then the logged in user needs to have at least one of these roles.
 * @param {Object} options
 * @param {Instance} logger
 * @param {Instance} fastify
 * @constructor
 */
const AuthDriver = function (options, logger, fastify) {
    this.options = options;
    this.logger = logger;
    this.fastify = fastify;
};

/**
 * Private method used to validate the TTL lifetime of the provided token
 * @param {String} accessToken
 * @returns {boolean}
 */
AuthDriver.checkAccessToken = function (accessToken) {
    let token = accessToken.replace('Bearer ', '');
    return token === this.options.apiToken;
};

/**
 * Public function used to authenticate and authorized the access to a specific route by comparing the headers of the request
 * @param {Object} context
 * @returns {Promise<unknown>}
 */
AuthDriver.prototype.authorize = async function (context) {
    return new Promise(async (resolve, reject) => {
        let {routeInfo, headers} = context;
        let roles = routeInfo.roles;

        //check if the headers contain an authorization
        if (!headers['authorization']) {
            let error = new Error('Access Denied! This resource is only accessible to logged in users.');
            error.code = 401;
            return reject(error);
        }

        //check if the headers contain a valid authorization format token
        if (!headers['authorization'].includes("Bearer ")) {
            let error = new Error('Access Denied! Invalid token format detected.');
            error.code = 401;
            return reject(error);
        }

        try {
            let tokenValid = AuthDriver.checkAccessToken.call(this, headers['authorization']);
            if (!tokenValid) {
                let error = new Error('TOKEN_EXPIRED');
                error.code = 401;
                return reject(error);
            }

            const user = {
                id: 'abcdefgh12345678',
                username: 'mike.hajj@gmail.com',
                firstName: 'Mike',
                lastName: 'Hajj',
                lastLogin: null,
                roles: ['ADMIN', 'USER']
            };

            //if the private route also has roles configured, validate that the user has at least 1 of these roles
            let access = false;
            if (!roles || roles.length === 0) {
                access = true;
            } else if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                user.roles.forEach(oneUserRole => {
                    if (roles.includes(oneUserRole)) {
                        access = true;
                    }
                });
            }

            if (!access) {
                let error = new Error('Access Denied! user is not allowed to access this resource.');
                error.code = 401;
                return reject(error);
            }

            //update the last time this token has been used by the user using the authentication db driver
            let now = new Date();
            let nowMonth = now.getMonth() + 1;
            user.lastLogin = now.getFullYear() + '-' + nowMonth + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
            return resolve(user);
        } catch (error) {
            this.fastify.log.error(error);
            error = new Error('Access Denied! Invalid Token provided.');
            error.code = 401;
            return reject(error);
        }
    });
};

/**
 * Public function used to authenticate and authorized the access to a specific socket by comparing the token it has
 * @param {Object} socket
 * @param {Function} next
 * @returns {Promise<unknown>}
 */
AuthDriver.prototype.socket = function(socket, next){
    const token = socket.handshake.auth?.token;
    let error = null;

    if (!token) {
        error = new Error('Authentication error: No token provided');
        error.code = 401;
        return next(error);
    }

    try {
        let tokenValid = AuthDriver.checkAccessToken.call(this, token);
        if (!tokenValid) {
            error = new Error('TOKEN_EXPIRED');
            error.code = 401;
            return next(error);
        }

        const user = {
            id: 'abcdefgh12345678',
            username: 'mike.hajj@gmail.com',
            firstName: 'Mike',
            lastName: 'Hajj',
            lastLogin: null,
            roles: ['ADMIN', 'USER']
        };

        const requestedRoute = socket?.handshake?.query.route;
        const routeConfiguration = this.fastify.config?.socket?.auth?.routes;
        let roles = [];
        if(requestedRoute && routeConfiguration){
           for(let routeInfo in routeConfiguration){
               const checkRoute = pathToRegexp(routeInfo);
               if(
                   checkRoute.regexp.test(requestedRoute) &&
                   routeConfiguration[routeInfo] &&
                   routeConfiguration[routeInfo].private
               ){
                   roles = roles.concat(routeConfiguration[routeInfo].roles);
                   roles = _lodash.uniq(roles);
               }
           }
        }
        //if the private route also has roles configured, validate that the user has at least 1 of these roles
        let access = false;
        if (!roles || roles.length === 0) {
            access = true;
        } else if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            user.roles.forEach(oneUserRole => {
                if (roles.includes(oneUserRole)) {
                    access = true;
                }
            });
        }

        if (!access) {
            error = new Error('Access Denied! user is not allowed to access this resource.');
            error.code = 401;
            return next(error);
        }

        let now = new Date();
        let nowMonth = now.getMonth() + 1;
        user.lastLogin = now.getFullYear() + '-' + nowMonth + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

        socket.user = user; // Attach user data to socket
        return next();
    } catch (error) {
        error = new Error('Authentication error: Invalid Token');
        error.code = 401;
        return next(error);
    }
};

module.exports = AuthDriver;