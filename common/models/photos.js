'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Photos) {
  Photos.validatesPresenceOf('_userId');

  // Add created date before saving data
	Photos.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Photos.observe('before save', common.modifyUpdatedDate);
};
