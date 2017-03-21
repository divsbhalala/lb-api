'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Notifications) {
	// Add created date before saving data
	Notifications.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Notifications.observe('before save', common.modifyUpdatedDate);
};
