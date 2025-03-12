"use strict";

const Stream = require('node:stream');
const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Class wrapper for AWS S3Client
 * @param {Object} options
 * @param {Instance} logger
 * @param {Instance} fastify
 */
const S3 = function (options, logger, fastify) {
    this.options = options;
    this.logger = logger;
    this.fastify = fastify;
    this.client = new S3Client({
        region: options.region,
        credentials: {
            accessKeyId: options.key,
            secretAccessKey: options.secret,
        }
    });
};

// ** Regarding S3 URLs **
// Virtual host style: https://BUCKET.s3.amazonaws.com/FILE
// Path style: https://s3.eu-central-1.amazonaws.com/BUCKET/FILE

/**
 * Uploads a file to S3
 * @param {String} bucket
 * @param {String} key
 * @param {Buffer} buffer
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.upload = function (bucket, key, buffer, opts) {
    const self = this;
    return new Promise((resolve, reject) => {
        // Prepare the command options
        const cmdOpts = {
            Bucket: bucket,
            Key: key,
            Body: buffer
        };
        // Add any extra options to the command
        if (opts) {
            Object.keys(opts).forEach(key => {
                cmdOpts[key] = opts[key]
            });
        }
        const putObjectCommand = new PutObjectCommand(cmdOpts);

        // Execute the command
        self.client.send(putObjectCommand).then(response => {
            if (response.$metadata.httpStatusCode !== 200) {
                return reject(new Error(`Failed to upload file to S3: ${response.$metadata.httpStatusCode}`));
            }
            return resolve();
        }).catch(err => reject(err));
    });
};

/**
 * Pipes a stream to S3
 * @param {String} bucket
 * @param {String} key
 * @param {Stream} stream
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.streamUpload = async function (bucket, key, stream, opts) {
    const self = this;
    const s3Stream = new Stream.PassThrough();
    const params = {
        Bucket: bucket,
        Key: key,
        Body: s3Stream,
    };
    // Add any extra options to the command
    if (opts) {
        Object.keys(opts).forEach(key => {
            params[key] = opts[key]
        });
    }
    // start upload command
    const s3Upload = new Upload({
        client: self.client,
        params,
    });
    // pipe data to S3
    stream.pipe(s3Stream);
    stream.on('finish', function () {
        self.fastify.logger.debug('Input stream finished');
    });
    // wait for completion
    await s3Upload.done();
    self.fastify.logger.debug('Streaming upload completed');
};

/**
 * Downloads a file from S3 and returns its contents
 * @param {String} bucket
 * @param {String} key
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.download = function (bucket, key, opts) {
    const self = this;
    return new Promise((resolve, reject) => {
        // Prepare the command options
        const cmdOpts = {
            Bucket: bucket,
            Key: key
        };
        // Add any extra options to the command
        if (opts) {
            Object.keys(opts).forEach(key => {
                cmdOpts[key] = opts[key]
            });
        }
        const getObjectCommand = new GetObjectCommand(cmdOpts)

        // Execute the command
        self.client.send(getObjectCommand).then(response => {
            // Store all of data chunks returned from the response data stream 
            // into an array then use Array#join() to use the returned contents as a String
            const responseDataChunks = [];

            // Handle an error while streaming the response body
            response.Body.once('error', err => reject(err));

            // Attach a 'data' listener to add the chunks of data to our array
            // Each chunk is a Buffer instance
            response.Body.on('data', chunk => responseDataChunks.push(chunk));

            // Once the stream has no more data, join the chunks into a string and return the string
            response.Body.once('end', () => resolve(responseDataChunks.join('')));
        }).catch(err => reject(err));
    })
};

/**
 * Deletes a file from S3
 * @param {String} bucket
 * @param {String} key
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.delete = async function (bucket, key, opts) {
    const self = this;
    // Prepare the command options
    const cmdOpts = {
        Bucket: bucket,
        Key: key
    };
    // Add any extra options to the command
    if (opts) {
        Object.keys(opts).forEach(key => {
            cmdOpts[key] = opts[key]
        });
    }
    const delObjectCommand = new DeleteObjectCommand(cmdOpts)

    // Execute the command
    const response = await self.client.send(delObjectCommand);
    if (response.$metadata.httpStatusCode < 200 || response.$metadata.httpStatusCode > 299) {
        throw new Error(`Failed to delete file from S3: ${response.$metadata.httpStatusCode}`);
    }
    return true;
};

/**
 * Lists objects at a specific S3 path
 * @param {String} bucket
 * @param {String} prefix
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.list = async function (bucket, prefix, opts) {
    const self = this;
    // Prepare the command options
    const cmdOpts = {
        Bucket: bucket,
    };
    if (prefix) {
        cmdOpts.Prefix = prefix;
    }
    // Add any extra options to the command
    if (opts) {
        Object.keys(opts).forEach(key => {
            cmdOpts[key] = opts[key]
        });
    }
    const command = new ListObjectsV2Command(cmdOpts);
    let objects = [];

    // The command fetches 1000 objects at a time, so we need to call it until there are no more objects
    let isTruncated = true;
    while (isTruncated) {
        // Execute the command
        const { Contents, IsTruncated, NextContinuationToken } = await self.client.send(command);
        isTruncated = IsTruncated;
        command.input.ContinuationToken = NextContinuationToken;
        // Add to the list of objects
        objects = objects.concat(Contents);
    }
    return objects;
};

/**
 * Creates a signed URL for a file on S3
 * @param {String} bucket
 * @param {String} key
 * @param {Number} ttlSeconds
 * @param {Object} opts
 * @returns {Promise<any>}
 */
S3.prototype.getSignedUrl = function (bucket, key, ttlSeconds = 3600, opts) {
    // Prepare the command options
    const cmdOpts = {
        Bucket: bucket,
        Key: key
    };
    // Add any extra options to the command
    if (opts) {
        Object.keys(opts).forEach(key => {
            cmdOpts[key] = opts[key]
        });
    }
    const getObjectCommand = new GetObjectCommand(cmdOpts);
    // Build and return the signed URL
    return getSignedUrl(this.client, getObjectCommand, { expiresIn: ttlSeconds });
};

module.exports = S3;
