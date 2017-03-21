'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Myprofilesphotos) {
	// Add created date before saving data
	Myprofilesphotos.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Myprofilesphotos.observe('before save', common.modifyUpdatedDate);
};
