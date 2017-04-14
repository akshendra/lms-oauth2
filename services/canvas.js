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
const joi = require('joi');
const validate = require('../helpers/validations');

const enrollmentTypes = ['teacher', 'student', 'ta', 'observer', 'designer'];
const enrollmentStates = ['active', 'invited_or_pending', 'completed'];
const courseStates = ['unpublished', 'available', 'completed', 'deleted'];
const gradingTypes = ['pass_fail', 'percent', 'letter_grade', 'gpa_scale', 'points'];
const tokenValidation = joi.object().keys({
  access_token: joi.string().required(),
  refresh_token: joi.string().required(),
  token_type: joi.string().required(),
  expires_in: joi.number().required(),
  lastRefresh: joi.date().required(),
  info: joi.object(),
  id_token: joi.string(),
});


class Canvas extends LMS {
  /**
   * Return all courses as teacher
   */
  * getCourses(request, token) {
    validate(request, joi.object().keys({
      enrollment_type: joi.string().valid(enrollmentTypes).default('teacher'),
      enrollment_state: joi.string().valid(enrollmentStates).default('active'),
      state: joi.array().items(joi.string().valid(courseStates)).default(['available']),
    }));
    validate(token, tokenValidation);

    const route = '/api/v1/courses';
    const response = yield this.post(route, request, token);
    return response;
  }


  /**
   * Create an assignment
   */
  * createAssignment(request, token) {
    validate(request, joi.object().keys({
      grading_type: joi.string().valid(gradingTypes).default('points'),
      points_possible: joi.number().default(100),
      courseId: joi.string().required(),
      url: joi.string().uri().required(),
      game: joi.object().keys({
        name: joi.string().required(),
        expiry: joi.number().required(),
        createdAt: joi.date().required(),
      }).required(),
    }));
    validate(token, tokenValidation);

    const { game, url, grading_type, points_possible, courseId } = request;
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
    const response = yield this.post(route, assignment, token);
    return response;
  }


  /**
   * Submit an assignment, student do it
   */
  * submit(request, token) {
    validate(request, joi.object().keys({
      url: joi.string().uri().required(),
      result: joi.object().required(),
      courseId: joi.string().required(),
      assignmentId: joi.string().required(),
    }));

    const { url, courseId, result, assignmentId } = request;
    const submission = {
      submission_types: ['online_text_entry'],
      body: tph.canvasSubmission(result, url),
    };

    const route = `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`;
    const response = yield this.post(route, submission, token);
    return response;
  }
}

module.exports = Canvas;
