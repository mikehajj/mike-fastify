"use strict";

/**
 * Class that encrypts and decyrpts data using custom secret phrases
 * @type {{encrypt: (function(*=, *=): *), decrypt: (function(*=, *=): *)}}
 */
const ParamsHelper = {

    /**
     * Method that transforms a PHP array annotation input into a JSON object
     * @param {Object} input
     * @returns {Object}
     * @constructor
     */
    PHPArraytoJSON: function (input) {
        const jsonObject = {};

        for (const key in input) {
            const parts = key.split('[');
            let currentObj = jsonObject;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].replace(']', '');
                if (i === parts.length - 1) {
                    currentObj[part] = input[key];
                } else {
                    currentObj[part] = currentObj[part] || {};
                    currentObj = currentObj[part];
                }
            }
        }
        return jsonObject;
    },

    /**
     * Method that checks if the given variable is empty
     * @param variable
     * @return {boolean}
     */
    notEmpty(variable){
        return variable != null && variable.toString().trim().length > 0;
    },

    /**
     * Method that extracts query information from the params of the given payload and generates a friendly mongodb
     * filter and find contexts
     * @param payload
     * @param fastify
     * @param DBToUse
     * @return {{filterOptions: {}, findOptions: {}}}
     */
    extractFindOptionsFromPayload: function (payload, fastify, DBToUse) {
        const {offset, limit} = payload;
        let findOptions = {};
        if (ParamsHelper.notEmpty(limit) && limit !== '-1') {
            if (ParamsHelper.notEmpty(offset)) {
                findOptions['skip'] = parseInt(offset) === 1 ? 0 : parseInt(offset);
            }

            findOptions['limit'] = parseInt(limit);
        }

        const sort = payload['sort[]'];
        if (ParamsHelper.notEmpty(sort)) {
            findOptions['sort'] = {};
            findOptions['sort'][sort[0]] = parseInt(sort[1]);
        }

        let filterOptions = {};
        let options = ParamsHelper.PHPArraytoJSON(payload);

        if (options.filter && options.filter.operation && options.filter.criteria) {
            filterOptions['$' + options.filter.operation] = [];
            let filtersCounter = 0;
            for (let oneCriteria in options.filter.criteria) {
                let entry = options.filter.criteria[oneCriteria];
                if (entry.value && (typeof entry.value === 'object' || (typeof entry.value === 'string' && entry.value.trim() !== ''))) {
                    let oneFilter = {};
                    if(entry.meta){
                        switch(entry.meta){
                            case 'boolean':
                                entry.value = entry.value === 'true';
                                break;
                            case 'number':
                                entry.value = parseFloat(entry.value);
                                break;
                        }
                    }
                    if (!['id', '_id'].includes(entry.field)) {
                        switch (entry.operation) {
                            case 'start_with':
                                oneFilter[entry.field] = { $regex: "^" + entry.value + ".*", "$options": "i" };
                                break;
                            case 'end_with':
                                oneFilter[entry.field] = {$regex: '.*' + entry.value + "$", "$options": "i"};
                                break;
                            case 'contains':
                                oneFilter[entry.field] = {$regex: entry.value, "$options": "i"};
                                break;
                            case 'not_contains':
                                oneFilter[entry.field] = {$not: {$regex: entry.value, "$options": "i"}};
                                break;
                            case 'not_equal':
                                oneFilter[entry.field] = {$not: entry.value};
                                break;
                            case 'in':
                                oneFilter[entry.field] = {$in: [entry.value]};
                                break;
                            case 'exists':
                                oneFilter[entry.field] = {$exists: entry.value};
                                break;
                            case 'expr':
                                oneFilter['$expr'] = {};
                                oneFilter['$expr'][entry.meta] = Object.values(entry.value);
                                break;
                            case 'equal':
                            default:
                                oneFilter[entry.field] = entry.value;
                                break;
                        }
                    } else {
                        oneFilter['_id'] = new fastify[DBToUse.name].mongodb.ObjectId(entry.value);
                    }
                    filterOptions['$' + options.filter.operation].push(oneFilter);
                    filtersCounter++;
                }
            }
            if (filtersCounter === 0) {
                filterOptions = {};
            }
        }

        if(options && options.fields && Object.keys(options.fields).length > 0){
            findOptions['projection'] = options.fields;
            for(let field in findOptions['projection']){
                if(findOptions['projection'][field] === '1'){
                    findOptions['projection'][field] = 1;
                }
                else {
                    findOptions['projection'][field] = 0;
                }
            }
        }

        return {findOptions, filterOptions};
    }
};

module.exports = ParamsHelper;