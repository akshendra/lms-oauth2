'use strict';

/*
 * The base config file, consisting of default values and the
 * schema definitions
 */

const convict = require('convict');
const path = require('path');

// Schema
const conf = convict({
  // application enviroment
  env: {
    doc: 'The application enviroment, defaults to development',
    format: ['dev', 'prod', 'local', 'test'],
    default: 'local',
    env: 'NODE_ENV',
  },

  // google project config
  google: {
    projectId: {
      format: String,
      doc: 'The google project to use',
      default: 'quizizz-dev',
    },
  },

  // other services we have
  services: {
    logger: {
      topic: {
        format: String,
        doc: 'The topic to push errors on',
        default: 'quizizz-logger',
      },
      resource: {
        format: String,
        doc: 'The resource name to use for logging',
        default: 'lms-service',
      },
      use: {
        format: Boolean,
        doc: 'Log on google',
        default: false,
      },
    },
  },

  // configuration for rabbitmq
  rabbit: {
    hosts: {
      doc: 'List of hosts ips or names',
      format: Array,
      default: ['104.196.172.152'],
    },
    port: {
      doc: 'The port to connect to',
      format: 'port',
      default: 5673,
    },
    user: {
      doc: 'The user for authentication',
      format: String,
      default: 'quizizz',
    },
    password: {
      doc: 'The password for authentication',
      format: String,
      default: 'ShankHunter42',
    },
    opts: {
      heartbeatIntervalInSeconds: {
        doc: 'Interval in seconds after which a heart beat is sent to the server',
        format: 'int',
        default: 5,
      },
      reconnectTimeInSeconds: {
        doc: 'Time to wait before trying to reconnect on error',
        format: 'int',
        default: 2,
      },
    },
  },

  // mongo server config
  mongo: {
    host: {
      doc: 'Mongo Server IP Address',
      format: '*',
      default: '127.0.0.1',
      env: 'MONGO_HOST',
    },
    port: {
      doc: 'Mongo Server Port',
      format: 'port',
      default: 27017,
      env: 'MONGO_PORT',
    },
    db: {
      doc: 'Database name',
      format: String,
      default: 'quizizz_test',
      env: 'MONGO_DB',
    },
    replset: {
      doc: 'Replica set name',
      format: String,
      default: 'quizizz_repl',
    },
  },


  // all the links
  links: {
    gcl: {
      client_id: {
        format: String,
        default: '58172892053-6laet7k6ls3k5va0jija3b175sm3jjms.apps.googleusercontent.com',
      },
      client_secret: {
        format: String,
        default: '-Js4R5cbI-h0eHVMrGfgPR8j',
      },
      authUrl: {
        format: String,
        default: 'https://accounts.google.com/o/oauth2/v2/auth',
      },
      tokenUrl: {
        format: String,
        default: 'https://www.googleapis.com/oauth2/v4/token',
      },
      refreshUrl: {
        format: String,
        default: 'https://www.googleapis.com/oauth2/v4/token',
      },
      providerUrl: {
        format: String,
        default: 'https://classroom.googleapis.com',
      },
    },
    canvas: {
      name: 'Akshendra',
    },
  },
});

const env = conf.get('env');
conf.loadFile(path.join(__dirname, 'envs', `${env}.json`));
conf.validate({ strict: false });
module.exports = conf;
