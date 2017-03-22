'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Likes) {
  Likes.validatesPresenceOf('_userId');

  // Add created date before saving data
	Likes.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Likes.observe('before save', common.modifyUpdatedDate);
};
