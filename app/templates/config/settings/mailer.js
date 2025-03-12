"use strict";

module.exports = {
    driver: process.env['MAIL_DRIVER'] || 'nodemailer',
    apiKey: process.env['MAIL_API_KEY'] || 'XXXX',
    host: process.env['MAIL_API_HOST'] || 'localhost',
    port: process.env['MAIL_API_PORT'] || 1025,
    secure: process.env['MAIL_API_SECURE'] === 'true' || false,
    auth: {
        user: process.env['MAIL_API_USER'] || 'me@email.com',
        password: process.env['MAIL_API_PASSWORD'] || 'password'
    },
    schema: require("../schemas/validation/mail")
};