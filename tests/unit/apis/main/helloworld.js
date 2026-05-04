"use strict";
const assert = require("assert");
const path = require("path");

const helper = require( "../../../helper" );
const API = helper.requireModule( path.join( "apis", "main", "helloworld" ) );

describe("Testing Hello World API", () => {

    it( "success - it works", ( done ) => {
        let fastify = {
            log: { debug: function () {} },
            route: function ( obj ) {
                fastify.test = obj.handler;
            },
            response: function ( reply, error, data ) {
                return new Promise( ( resolve, reject ) => {
                    if ( error ) {
                        return reject( error );
                    }
                    else {
                        return resolve( data );
                    }
                } );
            }
        };

        let reply = {
            response(error, data){
                return new Promise((resolve, reject) => {
                    if(error){
                        return reject(error);
                    }
                    return resolve(data);
                });
            }
        };

        API( fastify, {
            method: 'get',
            url: '/hello/mike',
            schema: {}
        } );

        fastify.test( {
            raw: { context: {} },
            query: {
                'env': 'dev'
            }
        }, reply ).then(data => {
            assert.ok(data);
            done();
        });
    } );

});