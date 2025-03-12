"use strict";

const sgMail = require('@sendgrid/mail');
const Validator = require('jsonschema');
const nmMail = require('nodemailer');

/**
 * Class wrapper for sendgrid
 * @param {Object} options
 * @param {Instance} logger
 * @param {Instance} fastify
 */
const Mailer = function (options, logger, fastify) {
    this.transport = null;
    this.message = {};
    this.options = options;
    this.logger = logger;
    this.fastify = fastify;

    switch(options.driver){
        case 'sendgrid':
            sgMail.setApiKey(options.apiKey);
            break;
        case 'nodemailer':
        default:
            let nodemailerOptions = {
                host: options.host,
                port: options.port,
                secure: options.secure
            };

            if(nodemailerOptions.secure !== false && nodemailerOptions.secure !== null && nodemailerOptions.secure !== undefined){
                nodemailerOptions.auth = {
                    user: options.auth.user,
                    pass: options.auth.password
                };
            }

            // Initialize nodemailer with your API key
            this.transport = nmMail.createTransport(nodemailerOptions);
            break;
    }
};

/**
 * Set different sections in the mail by mapping the context
 * @param section String
 * @param context Object
 */
Mailer.setSection = function (section, context) {
    if (context) {
        this.message[section] = context;
    }
};

/**
 * Prepare the message envelop and map the information from it
 * @param context Object
 */
Mailer.prepare = function (context) {

    const {to, from, cc, bcc, replyTo, attachments, subject, text, html} = context;

    this.message = {
        subject: subject,
        text: text,
        html: html
    };

    Mailer.setSection.call(this, 'to', to);
    Mailer.setSection.call(this, 'from', from);
    Mailer.setSection.call(this, 'cc', cc);
    Mailer.setSection.call(this, 'bcc', bcc);
    Mailer.setSection.call(this, 'replyTo', replyTo);
    Mailer.setSection.call(this, 'attachments', attachments);
};

/**
 * Invoke the sendgrid send functionality and pass on the message envelop
 * @param callback Function
 * @returns {Promise<[Response<object>, {}]>}
 */
Mailer.send = function (callback) {
    switch(this.options.driver) {
        case 'sendgrid':
            return sgMail.send(this.message, callback);
        case 'nodemailer':
        default:
            return this.transport.sendMail(this.message, callback);
    }
};

/**
 * Method that validates that the provided context is suitable to be used as a mail notification.
 * @param {Object} context
 * @param {Function} callback
 */
Mailer.validateContext = function (context, callback) {
    if(!context){
        return callback(new Error("Invalid Operation, no payload provided for mailer driver!"));
    }
    const validation = Validator.validate(context, this.options.schema);
    if (!validation.valid) {
        let errors = validation.errors.map(error => {
            return error.stack;
        });
        return callback(new Error(errors));
    }
    return callback(null, true);
};

/**
 * Sendgrid driver exposed function that executes the entire logic
 * @param context Object
 * @param callback Function
 * @returns {Promise<any>}
 */
Mailer.prototype.execute = function (context, callback) {
    Mailer.validateContext.call(this, context, (error) => {
        if (error) {
            return callback(error);
        }

        Mailer.prepare.call(this, context);
        return Mailer.send.call(this, callback);
    });
};

module.exports = Mailer;