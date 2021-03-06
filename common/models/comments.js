'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Comments) {
  Comments.validatesPresenceOf('_userId');
  Comments.validatesPresenceOf('_parentId');
  Comments.validatesPresenceOf('_postId');

  // Add created date before saving data
  Comments.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Comments.observe('before save', common.modifyUpdatedDate);

  Comments.observe('before save', function (ctx, next) {
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
    var currentUser = common.getUsers(Comments.app);
    data._userId=currentUser.id || data._userId;
    if(!common.isValidId(data._userId)){
      return next(common.badRequest('Invalid userId.'))
    }

    if(!common.isValidId(data._postId)){
      return next(common.badRequest('Invalid postId.'))
    }

    if(!common.isEmpty(data._parentId) && !common.isValidId(data._parentId)){
      return next(common.badRequest('Invalid _parentId.'))
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


  Comments.observe('loaded', function (ctx, next) {
    var currentUser = common.getUsers(Comments.app);
    ctx.instance = _.map(ctx.instance, function (item, key) {
      if (item && key === '__data') {
        //TODO return all item
        return item;
      }
    });
    next();
  });
};
