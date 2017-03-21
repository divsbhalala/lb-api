'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Comments) {
	// Add created date before saving data
	Comments.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Comments.observe('before save', common.modifyUpdatedDate);
};
