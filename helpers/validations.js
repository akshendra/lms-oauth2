'use strict';

const joi = require('joi');
const OError = require('../libs/error');

module.exports = function validate(request, schema) {
  const result = joi.validate(request, schema);
  if (result.error) {
    throw new OError(result.error, 500, 'validation', request);
  }
};
