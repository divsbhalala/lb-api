'use strict';

var moment = require('moment');
var common = require('./../services/common');
var _ = require("lodash");

module.exports = function (Profiles) {
  Profiles.validatesPresenceOf('_userId');

  // Add created date before saving data
  Profiles.beforeRemote('create', common.addCreateDate);

  //Update time before saving data
  Profiles.observe('before save', common.modifyUpdatedDate);
};
