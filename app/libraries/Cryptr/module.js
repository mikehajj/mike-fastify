"use strict";
const Cryptr = require('cryptr');

/**
 * Class that encrypts and decyrpts data using custom secret phrases
 * @type {{encrypt: (function(*=, *=): *), decrypt: (function(*=, *=): *)}}
 */
const myCrypter = {

    /**
     * return an encrypted version of the data
     * @param {String} secret
     * @param {String|Object} data
     * @returns {String} encryptedData
     */
    encrypt: (secret, data) => {
        let crypter = new Cryptr(secret);
        return crypter.encrypt(data);
    },

    /**
     * return a decrypted version of the encryptedData
     * @param {String} secret
     * @param {String|Object} encryptedData
     * @returns {String} data
     */
    decrypt: (secret, encryptedData) => {
        let crypter = new Cryptr(secret);
        return crypter.decrypt(encryptedData);
    }
};

module.exports = myCrypter;