'use strict';

global.ROOT = __dirname;

const canvas = require('./services/canvas');
const GCL = require('./services/gcl');

module.exports = {
  canvas,
  GCL,
};
