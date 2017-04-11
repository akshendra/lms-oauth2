'use strict';

/**
 * =============================================================================================
 * Boot all the services
 * =============================================================================================
 */

global.APP_ROOT = __dirname;

const is = require('is_js');
const { validate: v, pubsub, rabbit, log, qemit, ioc, mongo } = require('quizizz-services');

const config = require('./config');


module.exports = function* boot() {
  qemit.on('error', (msg) => {
    const { service, error, data } = msg;
    log.app.error(`${service.toUpperCase()} :: ${error}`, data);
  });
  qemit.on('log', (msg) => {
    const { service, type, message } = msg;
    log.always(`${service.toUpperCase()} : ${type} : ${message}`);
  });

  // Inititalize the services
  yield [
    pubsub.init(config.get('google')),
    mongo.init(config.get('mongo')),
    rabbit.init(config.get('rabbit')),
  ];

  // create the topic on pubsub we will listen to
  const requestQueue = 'o2c-request';
  ioc.add('requestQueue', requestQueue);
  yield rabbit.createQueue(requestQueue);

  // add rules to validator
  v.addRule('isCourseState', value => {
    if (is.not.inArray(value, ['ACTIVE', 'ARCHIVED', 'PROVISIONED', 'DECLINED'])) {
      return false;
    }
    return true;
  }, 'should be correct course state');
  return true;
};
