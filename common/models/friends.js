'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(Friends) {
  Friends.validatesInclusionOf('status', {in: [1, 2, 3]});
  Friends.validatesPresenceOf('_userId');
  Friends.validatesPresenceOf('_friendId');


  	// Add created date before saving data
	Friends.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	Friends.observe('before save', common.modifyUpdatedDate);
};
