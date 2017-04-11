'use strict';

const qs = require('qs');
const axios = require('axios');
const OError = require('./error');
const moment = require('moment');
const debug = require('debug')('lms-oauth2:provider');


/**
 * Select the Content-Type header according to the bodyType var
 * @param  {String} bodyType
 * @return {String}
 */
function getContentType(bodyType) {
  if (bodyType === 'form') {
    return 'application/x-www-form-urlencoded';
  }
  return 'application/json';
}

/**
 * Throw OError according to response from axios
 * @param  {Object} error from axios
 * @return {Error}
 */
function throwError(error, errorParser) {
  debug('ERROR :: ');
  debug(error.config);
  if (error.response) { // if the error is from api, satus code not in 200s
    const { status, data } = error.response;
    debug('Status => ');
    debug(status);
    debug('Data => ');
    debug(data);
    const { message } = errorParser(data);
    throw new OError(message, status, 'api', error.config);
  } else { // something wrong sending the response itself
    const message = error.message;
    debug('Message =>');
    debug(message);
    throw new OError(message, null, 'request', error.config);
  }
}

function post(url, d, bodyType, errorParser) {
  const data = bodyType === 'json' ? d : qs.stringify(d, { arrayFormat: 'repeat' });
  const ct = getContentType(bodyType);
  const config = {
    url,
    method: 'post',
    data,
    responseType: 'json',
    headers: {
      'Content-Type': ct,
    },
  };
  return axios(config)
  .catch((error) => {
    throwError(error, errorParser);
  });
}


class OAuth2Provider {
  /**
   * Create an instance of OAuth2
   * @param  {String} name a unique name for this provider
   * @param  {Object} opts the defaults { authUrl, tokenUrl, refreshUrl, bodyType, scope }
   * @param  {Function} errorParser parse the error from the lms api and return status and message
   */
  constructor(opts, errorParser) {
    const options = Object.assign({}, opts);
    // validate options
    this.options = options;
    this.errorParser = errorParser;
  }


  /**
   * Return an authorization url, which takes user to the permission page
   * @param  {Object} opts the basic stuff { client_id, response_type, scope,
   *                      redirect_uri, state, access_type }
   * @param  {Object} extras Some extra prameter to send
   * @return {String} url to redirect on
   */
  authorizeURL(opts, extras) {
    const options = Object.assign({
    }, this.options, opts);
    const { scope, client_id, authUrl } = options;
    const query = Object.assign({
      scope: scope.join(' '),
      client_id,
    }, extras);
    debug('Generating Auth Url with ::');
    debug('Base => ', authUrl);
    debug('Query => ');
    debug(query);
    return `${authUrl}?${qs.stringify(query, { arrayFormat: 'repeat' })}`;
  }


  /**
   * Get token from code
   * @param  {String} code the code that came from auth url
   * @param  {Object} opts contains { grant_type, redirect_uri } and anything to override
   *                       default
   * @return {Object} containing token data
   */
  getToken(code, opts, extras) {
    const options = Object.assign({
      grant_type: 'authorization_code',
    }, this.options, opts);
    const { client_id, client_secret, redirect_uri, grant_type, tokenUrl,
      providerBodyType } = options;
    const data = Object.assign({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type,
    }, extras);
    debug('Getting token from code ::');
    debug('Base => ', tokenUrl);
    debug('Data => ');
    debug(data);
    debug('providerBodyType =>', providerBodyType);
    return post(tokenUrl, data, providerBodyType, this.errorParser);
  }


  /**
   * Refresh token
   * @param  {String} refresh_token
   * @param  {Object} opts contains { grant_type } and anything to override from defaults
   * @return {Object} the token data without any new refresh token
   */
  refreshToken(refresh_token, opts, extras) {
    const options = Object.assign({
      grant_type: 'refresh_token',
    }, this.options, opts);
    const { client_id, client_secret, grant_type, refreshUrl, providerBodyType } = options;
    const data = Object.assign({
      client_id,
      client_secret,
      grant_type,
      refresh_token,
    }, extras);
    debug('Refreshing token ::');
    debug('Base => ', refreshUrl);
    debug('Data => ');
    debug(data);
    return post(refreshUrl, data, providerBodyType, this.errorParser);
  }

  /**
   * Inner helper for calling  api
   */
  * _call(method, url, d, token, opts = {}) { // eslint-disable-line
    const options = Object.assign({}, this.options, opts);
    const { apiBodyType: bodyType } = options;
    try {
      const config = {
        method,
        responseType: 'json',
      };
      if (method === 'post' || method === 'put') {
        Object.assign(config, {
          url,
          data: bodyType === 'json' ? d : qs.stringify(d, { arrayFormat: 'repeat' }),
          headers: {
            'Content-Type': getContentType(bodyType),
            Authorization: `${token.token_type} ${token.access_token}`,
          },
        }, opts);
      } else {
        Object.assign(config, {
          url: `${url}?${qs.stringify(d, { arrayFormat: 'repeat' })}`,
          headers: {
            Authorization: `${token.token_type} ${token.access_token}`,
          },
        }, opts);
      }
      const { status, data } = yield axios(config);
      return { status, data };
    } catch (error) {
      throwError(error, this.errorParser);
    }
  }

  * call(method, url, data, token, opts = {}) {
    const now = moment().unix();
    const start = moment(token.lastRefresh).unix();
    debug('Do we need to refresh', ((start + token.expires_in) - (now - 600)) > 0 ? 'NO' : 'YES');
    if ((start + token.expires_in) < (now - 600)) {
      const { data: newToken } = yield this.refreshToken(token.refresh_token, opts);
      const response = yield this._call(method, url, data, newToken, opts);
      return {
        refresh: newToken,
        response,
      };
    }
    try {
      const response = yield this._call(method, url, data, token, opts);
      return {
        refresh: null,
        response,
      };
    } catch (err) {
      if (err.type === 'api' && err.status === 401) { // try refreshing token
        const { data: newToken } = yield this.refreshToken(token.refresh_token, opts);
        const response = yield this._call(method, url, data, newToken, opts);
        return {
          refresh: newToken,
          response,
        };
      }
      throw err;
    }
  }

  post(url, data, token, opts = {}) {
    return this.call('post', url, data, token, opts);
  }

  get(url, data, token, opts = {}) {
    return this.call('get', url, data, token, opts);
  }

  put(url, data, token, opts = {}) {
    return this.call('put', url, data, token, opts);
  }

  delete(url, data, token, opts = {}) {
    return this.call('delete', url, data, token, opts);
  }
}

module.exports = OAuth2Provider;
