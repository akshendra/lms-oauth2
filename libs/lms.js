'use strict';

/**
 * =============================================================================================
 * A base class that every lms link will extends
 * -> It will contain the refresh token url and access token url
 * -> It will contain a method to refresh the access token
 * =============================================================================================
 */

const is = require('is_js');
const url = require('url');
const Provider = require('./provider');

class LMS {
  /**
   * @param {String} name
   * @param {Object} opts { client_id, client_secret, tokenUrl, authUrl, providerUrl, refreshUrl }
   */
  constructor(name, opts, errorParser) {
    this.name = name;
    const providerBodyType = opts.providerBodyType || 'form';
    const apiBodyType = opts.apiBodyType || 'json';
    const { client_id, client_secret, tokenUrl, authUrl, apiUrl, refreshUrl, scope } = opts;
    this.apiUrl = apiUrl;
    this.provider = new Provider({
      authUrl,
      refreshUrl,
      tokenUrl,
      client_id,
      client_secret,
      scope,
      providerBodyType,
      apiBodyType,
    }, errorParser);
  }

  getUrl(value) {
    if (is.url(value)) {
      return value;
    }
    return url.resolve(this.apiUrl, value);
  }

  * call(method, route, data, token) {
    const uri = this.getUrl(route);
    const response = yield this.provider[method](uri, data, token);
    return Object.assign({}, response, {
      name: this.name,
    });
  }

  get(route, data, token) {
    return this.call('get', route, data, token);
  }

  post(route, data, token) {
    return this.call('post', route, data, token);
  }

  patch(route, data, token) {
    return this.call('patch', route, data, token);
  }
}

module.exports = LMS;
