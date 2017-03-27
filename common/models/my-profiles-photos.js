'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (MyProfilePhotos) {
  MyProfilePhotos.validatesPresenceOf('_userId');
  MyProfilePhotos.validatesPresenceOf('_photoId');

  // Add created date before saving data
  MyProfilePhotos.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  MyProfilePhotos.observe('before save', common.modifyUpdatedDate);
  MyProfilePhotos.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(MyProfilePhotos.app);

    if(!common.isValidId(data._profileId)){
      return next(common.badRequest('Invalid profileId.'))
    }
    if(!common.isValidId(data._photoId)){
      return next(common.badRequest('Invalid photoId.'))
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
