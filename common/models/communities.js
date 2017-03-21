'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Communities) {
	// Add created date before saving data
	Communities.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Communities.observe('before save', common.modifyUpdatedDate);
};
