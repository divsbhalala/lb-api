'use strict';
require('dotenv').load();
const loopback = require('loopback');
const boot = require('loopback-boot');
const _= require('lodash');
const bodyParser = require('body-parser');
const path = require('path');
const morgan=require('morgan');
const LoopBackContext = require('loopback-context');
var app = module.exports = loopback();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencodedapp = module.exports = loopback();
app.use(LoopBackContext.perRequest());
app.use(loopback.token());
// app.use(function setCurrentUser(req, res, next) {
//   //console.log(req);
//   var RoleMapping=app.models.RoleMapping;
//   var Role=app.models.Role;
//   app.currentUser=undefined;
//   app.currentRole=[];
//   if (!req.accessToken) {
//     return next();
//   }
//   app.models.user.findOne({where: {id:req.accessToken.userId}}, function(err, user) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return next(new Error('No user with this access token was found.'));
//     }
//     app.currentUser=user;
//     //Fetching user current role
//     RoleMapping.find({ where : { 	"principalType" : "USER"}}, function (err, roleMappings) {
//       var roleIds = _.uniq(roleMappings
//         .map(function (roleMapping) {
//           if(roleMapping.principalId == app.currentUser.__data.id)
//             return roleMapping.roleId;
//         }));
//       var conditions = roleIds.map(function (roleId) {
//         return roleId;
//       });
//       if(!_.isEmpty(conditions)){
//         Role.findByIds(conditions, function (err, roles) {
//           var roleNames = roles.map(function(role) {
//             return role.name;
//           });
//           console.log(roleNames);
//           app.currentRole=roleNames;
//         });
//       }
//       next();
//     });
//
//   });
// });
app.start = function() {
  // start the web server
  var server= app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API1 at %s%s', baseUrl, explorerPath);
    }
  });
  server.setTimeout(600000);
  return server;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.get('remoting').errorHandler = {
  handler: function(error, req, res, next) {
    var log = require('debug')('server:rest:errorHandler');
    if (error instanceof Error) {
      log('Error in %s %s: errorName=%s errorMessage=%s \n errorStack=%s',
        req.method, req.url, error.name, error.message, error.stack);
    }
    else {
      log(req.method, req.originalUrl, res.statusCode, error);
    }
    next(); /* let the default error handler (RestAdapter.errorHandler) run next */
  },
  disableStackTrace: false
};
