"use strict";

/**
 /^
 (?=.*[A-Z])        Ensure string has at least 1 uppercase letter.
 (?=.*[!@#$%^&*])   Ensure string has one special case letter.
 (?=.*[0-9])        Ensure string has at least 1 digit.
 (?=.*[a-z])        Ensure string has at least 1 lowercase letter.
 (?=.{8,})           Ensure string is of length 10 and above
 $/
 */
let pwdPattern = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\\s\\*.!@$%\\^&(){}\\[\\]:;<>,.?\\/~_+\\-=|\\\\]).{10,32}$";
let username = {
    "oneOf": [
        {
            "type": "string",
            "format": "email"
        },
        {
            "type": "string",
            "pattern": "^[a-zA-Z0-9\._\-]{4,}$"
        }
    ]
};

module.exports = {
    "user": {
        "type": "object",
        "properties": {
            "username": username,
            "password": {
                "type": "string",
                "pattern": pwdPattern
            }
        },
        "required": ['username', 'password'],
        "additionalProperties": false
    }
};