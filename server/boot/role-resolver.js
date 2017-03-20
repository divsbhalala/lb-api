//REF LINK https://github.com/strongloop/loopback-example-access-control/blob/master/server/boot/role-resolver.js
const  _= require('lodash');

module.exports = function (app) {
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  Role.registerResolver('admin', function (role, context, cb) {
    function reject() {
      process.nextTick(function () {
        cb(null, false);
      });
    }

    // do not allow anonymous users
    var userId = context.accessToken.userId;
    if (!userId) {
      return reject();
    }

    //REF https://gist.github.com/zhenyanghua/d24ea57cd70e69bcb82dc3bc8f14ea74
    RoleMapping.find({where: {"principalType": "USER"}}, function (err, roleMappings) {
      var roleIds = _.uniq(roleMappings
        .map(function (roleMapping) {
          if (roleMapping.principalId == userId)
            return roleMapping.roleId;
        }));
      var conditions = roleIds.map(function (roleId) {
        return roleId;
      });
      if (_.isEmpty(conditions)) {
        return reject();
      }
      Role.findByIds(conditions, function (err, roles) {
        if (err) throw err;
        var roleNames = roles.map(function (role) {
          return role.name;
        });
        if (roleNames.indexOf('admin') > -1) {
          return cb(null, true);
        }
        return reject();
      });
    });
  });
};
