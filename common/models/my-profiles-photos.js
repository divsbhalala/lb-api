'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function(MyProfilePhotos) {
  MyProfilePhotos.validatesPresenceOf('_userId');
  MyProfilePhotos.validatesPresenceOf('_photoId');

  // Add created date before saving data
	MyProfilePhotos.beforeRemote('create', common.addCreateDate);

	//Update time before saving data
  	MyProfilePhotos.observe('before save', common.modifyUpdatedDate);
};
