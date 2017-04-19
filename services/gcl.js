'use strict';

/**
 * =============================================================================================
 * OAuth apis of google classroom
 * =============================================================================================
 */

const LMS = require('../libs/lms');
const dth = require('../helpers/datetime');
const validate = require('../helpers/validations');
const joi = require('joi');

const validCourseState = ['ACTIVE', 'ARCHIVED', 'PROVISIONED', 'DECLINED'];
const tokenValidation = joi.object().keys({
  access_token: joi.string().required(),
  refresh_token: joi.string().required(),
  token_type: joi.string().required(),
  expires_in: joi.number().required(),
  lastRefresh: joi.date().required(),
  info: joi.object(),
  id_token: joi.string(),
});

class GCL extends LMS {
  /**
   * Get profile
   */
  * getProfile(request, token) {
    const url = 'https://www.googleapis.com/userinfo/v2/me';
    const response = yield this.get(url, {}, token);
    return response;
  }

  /**
   * Return all the courses
   */
  * getCourses(request, token) {
    validate(request, joi.object().keys({
      studentId: joi.string(),
      teacherId: joi.string().default('me'),
      courseStates: joi.array().items(joi.string().valid(validCourseState)).default(Date.now()),
      pageSize: joi.number(),
      pageToken: joi.string(),
    }));

    const route = 'v1/courses';
    const data = Object.assign({}, request, {
      userId: undefined,
    });
    const response = yield this.get(route, data, token);
    return response;
  }


  /**
   * Create an assignment
   */
  * createAssignment(request, token) {
    validate(request, joi.object().keys({
      courseId: joi.string().required(),
      description: joi.string().default(''),
      link: joi.object().keys({
        url: joi.string().uri().required(),
        title: joi.string().required(),
        thumbnailUrl: joi.string(),
      }),
      game: joi.object().keys({
        name: joi.string().required(),
        expiry: joi.number().required(),
        createdAt: joi.date().required(),
      }),
      maxPoints: joi.number().default(100),
    }));
    validate(token, tokenValidation);

    const { courseId, game, description, link, maxPoints } = request;
    const dueTS = dth.addSeconds(game.createdAt, game.expiry);

    // create a cource work
    const courseWork = {
      title: game.name,
      description,
      materials: [{
        link,
      }],
      state: 'PUBLISHED',
      dueDate: dth.getGCLDate(dueTS),
      dueTime: dth.getGCLTime(dueTS),
      workType: 'ASSIGNMENT',
      maxPoints,
    };

    const route = `v1/courses/${courseId}/courseWork`;
    const response = yield this.post(route, courseWork, token);
    return response;
  }


  /**
   * Get the submission for the student
   * Student will only see their submission
   * Teachers will see all the submission
   */
  * getSubmisisons(request, token) {
    validate(request, joi.object().keys({
      studentId: joi.string(),
      courseId: joi.string().required(),
      courseWorkId: joi.string().required(),
    }));
    validate(token, tokenValidation);

    const { courseId, courseWorkId, studentId } = request;
    const data = {
      userId: studentId,
    };

    const route = `v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`;
    const response = yield this.get(route, data, token);
    return response;
  }


  /**
   * Add an attachment to the submission, can be done by anybody
   */
  * addAttachment(request, token) {
    // validate
    validate(request, joi.object().keys({
      courseId: joi.string().required(),
      courseWorkId: joi.string().required(),
      subId: joi.string().required(),
      link: joi.object().keys({
        url: joi.string().uri().required(),
      }),
    }));
    validate(token, tokenValidation);

    const { courseId, courseWorkId, link, subId } = request;
    const data = {
      addAttachments: [{
        link,
      }],
    };

    const route = `v1/courses/${courseId}/courseWork/${courseWorkId}/` +
      `studentSubmissions/${subId}:modifyAttachments`;
    const response = yield this.post(route, data, token);
    return response;
  }


  /**
   * Turn in a submission, done by student only
   */
  * submit(request, token) {
    // validate
    validate(request, joi.object().keys({
      courseId: joi.string().required(),
      courseWorkId: joi.string().required(),
      subId: joi.string().required(),
    }));
    validate(token, tokenValidation);

    const { courseId, courseWorkId, subId } = request;

    const route = `v1/courses/${courseId}/courseWork/${courseWorkId}/` +
      `studentSubmissions/${subId}:turnIn`;
    const response = yield this.post(route, {}, token);
    return response;
  }


  /**
   * Grade a submission
   */
  * grade(request, token) {
    validate(request, joi.object().keys({
      courseId: joi.string().required(),
      courseWorkId: joi.string().required(),
      submission: joi.object().required(),
      grade: joi.number().required(),
    }));
    validate(token, tokenValidation);

    const { courseId, courseWorkId, submission, grade } = request;
    const route = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submission.id}`
      + '?updateMask=assignedGrade';

    const sub = Object.assign({}, submission, {
      assignedGrade: grade,
    });

    const response = yield this.patch(route, sub, token);
    return response;
  }


  /**
   * Teacher can ask back the assignment when it's done
   */
  * askBack(request, token) {
    validate(request, joi.object().keys({
      courseId: joi.string().required(),
      courseWorkId: joi.string().required(),
      subId: joi.string().required(),
    }));
    validate(token, tokenValidation);

    const { courseId, courseWorkId, subId } = request;

    const route = `v1/courses/${courseId}/courseWork/${courseWorkId}/` +
      `studentSubmissions/${subId}:return`;
    const response = yield this.post(route, {}, token);
    return response;
  }
}

module.exports = GCL;
