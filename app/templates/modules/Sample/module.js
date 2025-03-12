"use strict";

const Sample = function(fastify, options){
    this.fastify = fastify;
    this.options = options;
};

Sample.privateMethod = function(){
    console.log('i am a private method.')
    console.log(this.options);
};

Sample.prototype.publicMethod = function(){

    //calling a private method
    Sample.privateMethod.call(this);

    console.log('i am a public method.')
    console.log(this.options);
};

module.exports = Sample;