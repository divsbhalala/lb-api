'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Followers) {
  Followers.validatesPresenceOf('_followerId');

  // Add created date before saving data
	Followers.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Followers.observe('before save', common.modifyUpdatedDate);

};
