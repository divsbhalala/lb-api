'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Followers) {
  Followers.validatesPresenceOf('_followerId');

  // Add created date before saving data
  Followers.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Followers.observe('before save', common.modifyUpdatedDate);
  Followers.observe('before save', function (ctx, next) {
    var data = {};
    if (ctx.instance) {
      data = ctx.instance;
    } else if (ctx.args && ctx.args.data) {
      data = ctx.args.data;
    }
    else if (ctx.currentInstance) {
      data = ctx.currentInstance
    }
    else {
      next();
    }
    var currentUser = common.getUsers(Article.app);
    if (_.isEmpty(data._userId) && _.isEmpty(data._communityId)) {
      return next(common.badRequest('userId or communityId is required.'))
    }

    //TODO REASSIGN
    if (ctx.instance) {
      ctx.instance = data;
    } else if (ctx.args && ctx.args.data) {
      ctx.args.data = data;
    }
    else {
      ctx.currentInstance = data
    }
    next();
  });

};
