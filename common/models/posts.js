'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Posts) {
  Posts.validatesPresenceOf('_userId');

  // Add created date before saving data
  Posts.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Posts.observe('before save', common.modifyUpdatedDate);
  Posts.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(Posts.app);
    if (_.isEmpty(data._photoId) || _.isEmpty(data._videoId) || _.isEmpty(data.postContent)) {
      return next(common.badRequest('Invalid post data.'))
    }

    if ((!_.isEmpty(data._photoId) && !common.isValidId(data._photoId)) || ( !_.isEmpty(data._videoId) && !common.isValidId(data._videoId))) {
      return next(common.badRequest('Invalid photoId or videoId.'))
    }

    if(!common.isValidId(data._userId)){
      return next(common.badRequest('Invalid userId.'))
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
