'use strict';

/**
 * =============================================================================================
 * Canvas apis
 * TODO: groups
 * =============================================================================================
 */

const LMS = require('../libs/lms');
const dth = require('../helpers/datetime');
const tph = require('../helpers/templates');


class Canvas extends LMS {
  /**
   * Return all courses as teacher
   */
  * getCourses(request) {
    // sanitize
    Object.assign(request, {
      enrollment_type: ['teacher', String],
      enrollment_state: ['active', String],
      state: [['available'], Array],
    });
    // validate
    v.validate({
      enrollment_type: ['isPresent', 'isString'],
      enrollment_state: ['isPresent', 'isString'],
      state: {
        type: 'list',
        rules: ['isString'],
      },
    });

    const userId = request.userId;
    const data = Object.assign({}, request, {
      userId: undefined,
    });

    const route = '/api/v1/courses';
    const response = yield this.post(route, data, userId);
    return response;
  }


  /**
   * Create an assignment
   */
  * createAssignment(request) {
    // sanitize
    sanitize(request, {
      grading_type: ['points', String],
      points_possible: [0, Number],
    });
    // validate
    v.validate(request, {
      userId: ['isPresent', 'isValidObjectId'],
      courseId: ['isPresent', 'isString'],
      url: ['isPresent', 'isString'],
      game: ['isPresent', 'isObject'],
      grading_type: ['isPresent', 'isCanvasGradingType'],
      points_possible: ['isPresent', 'isNumber'],
    });
    // game
    v.validate(request.game, {
      hash: ['isPresent', 'isValidObjectId'],
      name: ['isPresent', 'isString'],
      expiry: ['isPresent', 'isNumber'],
      createdAt: ['isPresent', 'isString'],
    });

    const { game, url, grading_type, points_possible, userId, courseId } = request;
    const dueTS = dth.addSeconds(game.createdAt, game.expiry);
    const assignment = {
      name: game.name,
      submission_types: ['online_text_entry'],
      peer_reviews: false,
      automatic_peer_reviews: false,
      notify_of_update: false,
      points_possible,
      grading_type,
      due_at: dth.canvasTimestamp(dueTS),
      description: tph.canvasAssignment(game, url),
      published: true,
    };

    const route = `/api/v1/courses/${courseId}/assignments`;
    const response = yield this.post(route, assignment, userId);
    return response;
  }


  /**
   * Submit an assignment, student do it
   */
  * submit(request) {
    // validate
    v.validate(request, {
      userId: ['isPresent', 'isValidObjectId'],
      url: ['isPresent', 'isString'],
      result: ['isPresent', 'isObject'],
      courseId: ['isPresent', 'isString'],
      assignmentId: ['isPresent', 'isString'],
    });

    const { userId, url, courseId, result, assignmentId } = request;
    const submission = {
      submission_types: ['online_text_entry'],
      body: tph.canvasSubmission(result, url),
    };

    const route = `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`;
    const response = yield this.post(route, submission, userId);
    return response;
  }
}

module.exports = Canvas;
