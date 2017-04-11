'use strict';

/**
 * =============================================================================================
 * Use moemnt to play with dates
 * =============================================================================================
 */

const moment = require('moment');

const h = module.exports;


/**
 * Add the number of seconds to the time given
 * @param  {Mixed} time everything supported by moment
 * @param  {Number} seconds
 * @return {Number} unix timestamp in ms
 */
h.addSeconds = (time, seconds) => moment(time).add(Number(seconds), 'seconds').valueOf();


/**
 * Return a google class room date type
 * @param  {Number} time unix ts in ms
 * @return {Object} { year, month, day }
 */
h.getGCLDate = (time) => {
  const mtime = moment(time);
  return {
    year: mtime.year(),
    month: mtime.month() + 1, // retuns from 0 (JAN is 0)
    day: mtime.date(),
  };
};


/**
 * Return a google classroom time type
 * @param  {Number} time unix ts in ms
 * @return {Object} { hours, minutes, seconds }
 */
h.getGCLTime = (time) => {
  const mtime = moment(time);
  return {
    hours: mtime.hour(),
    minutes: mtime.minute(),
    seconds: mtime.seconds(),
    nanos: 0,
  };
};
