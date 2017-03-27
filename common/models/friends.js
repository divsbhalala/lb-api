'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Friends) {
  Friends.validatesInclusionOf('status', {in: [1, 2, 3]});
  //Friends.validatesPresenceOf('_userId');
  Friends.validatesPresenceOf('_friendId');


  // Add created date before saving data
  Friends.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Friends.observe('before save', common.modifyUpdatedDate);

  Friends.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(Friends.app);
    data._userId=currentUser.id || data._userId;
    if(data._friendId==data._userId){
      return next(common.badRequest("User can not add friend as it self"))
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
