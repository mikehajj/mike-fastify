"use strict";

const abstractMailAttachment = {
    type: 'array',
    uniqueItems: true,
    items: {
        type: 'object',
        properties: {
            content: {type: 'string'},
            filename: {type: 'string'},
            type: {type: 'string'},
            disposition: {type: 'string'},
            content_id: {type: 'string'},
        },
        required: ['content', 'filename'],
        additionalProperties: false
    }
};

//one email address
const simpleEmailSchema = {
    type: "string",
    format: "email"
};

//{name: xx, email: xx}
const verboseEmailSchema = {
    type: 'object',
    properties: {
        name: {type: 'string'},
        email: {type: 'string', format: 'email'}
    },
    required: ["email", "name"]
};

//name <email>
const complexEmailSchema = {
    type: "string",
    pattern: "^([\\w\\s]+)\\s<([^@\\s]+@[^@\\s]+)>$"
};

const abstractMailRecipient = function(min = 0){
    return {
        "oneOf": [
            simpleEmailSchema,
            //array of simple email schemas
            {
                type: "array",
                uniqueItems: true,
                minItems: 1,
                items: simpleEmailSchema
            },
            verboseEmailSchema,
            //array of verbose  email schemas
            {
                type: "array",
                uniqueItems: true,
                minItems: 1,
                items: verboseEmailSchema
            },
            complexEmailSchema,
            //array of complex email schemas
            {
                type: "array",
                uniqueItems: true,
                minItems: 1,
                items: complexEmailSchema
            }
        ]
    }
};

const schemas = {
    type: 'object',
    properties: {
        to: abstractMailRecipient(1),
        from: abstractMailRecipient(1),
        cc: abstractMailRecipient(0),
        bcc: abstractMailRecipient(0),
        replyTo: abstractMailRecipient(0),
        subject: {type: 'string'},
        text: {type: 'string'},
        html: {type: 'string'},
        templateId: {type: 'string'},
        headers: {type: 'object'},
        attachments: abstractMailAttachment
    },
    required: ['to', 'from', 'subject', 'html'],
    additionalProperties: false
};

module.exports = schemas;