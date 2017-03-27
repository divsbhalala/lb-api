'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Notifications) {
  Notifications.validatesPresenceOf('_receiverId');
  Notifications.validatesPresenceOf('_senderId');

  // Add created date before saving data
  Notifications.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Notifications.observe('before save', common.modifyUpdatedDate);
  Notifications.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(Notifications.app);
    data._senderId=currentUser.id || data._senderId;
    if(!common.isValidId(data._senderId)){
      return next(common.badRequest('Invalid senderId.'))
    }
    if(!common.isValidId(data._receiverId)){
      return next(common.badRequest('Invalid receiverId.'))
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
