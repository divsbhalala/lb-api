'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Profiles) {
  Profiles.validatesPresenceOf('_userId');

  // Add created date before saving data
  Profiles.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Profiles.observe('before save', common.modifyUpdatedDate);
  Profiles.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(Profiles.app);
   
    data._userId=currentUser.id || data._userId;
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
