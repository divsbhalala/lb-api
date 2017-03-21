'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Videos) {
	// Add created date before saving data
	Videos.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Videos.observe('before save', common.modifyUpdatedDate);
};
