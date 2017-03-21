'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Posts) {
	// Add created date before saving data
	Posts.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Posts.observe('before save', common.modifyUpdatedDate);
};