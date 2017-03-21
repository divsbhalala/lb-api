'use strict';

module.exports = function(Friends) {
  Friends.validatesInclusionOf('status', {in: [1, 2, 3]});
};
