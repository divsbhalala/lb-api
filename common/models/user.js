'use strict';
const path = require('path');
const moment = require('moment');
const  _= require('lodash');
const  common= require('./../services/common');
//require('dotenv').load();
module.exports = function (user) {

  user.validatesUniquenessOf('email');
  user.validatesUniquenessOf('username');
  var userFields = {
    firstName: true,
    lastName: true,
    id: true,
    username: true,
  };

  user.observe('before save', function (ctx,   next) {
    if(ctx.instance && !ctx.instance.displayName){
      ctx.instance.displayName=ctx.instance.username;
      next();
    }
    else{
      next();
    }

  });
  //send verification email after registration
  user.afterRemote('create', function (ctx, userInstance, next) {
    //send verification mail
    var options = {
      host: user.app.get('UIHOST'),
      protocol: user.app.get('UIPROTOCOL'),
      port: user.app.get('UIPORT'),
      text: 'Please activate your account by clicking on this link or copying and pasting it in a new browser window:\n\t {href}',
      html: 'Please activate your account by clicking on this link or copying and pasting it in a new browser window:\n\t <a href="{href}">Verify Account</a>',
      type: 'email',
      to: userInstance.email,
      from: user.app.get('EMAILFROM'),
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      redirect: user.app.get('UIURL') + '/login-success',
      user: userInstance
    };

    userInstance.verify(options, function (err, response) {
      console.log(err)
      if (err) return next(err);

      /*user.app.models.Role.findOne({where: { name: 'admin'}}, function (err, role) {
       if (err) cb(err);

       //make bob an admin
       role.principals.create({
       principalType: user.app.models.RoleMapping.USER,
       principalId: userInstance.id
       }, function (err, principal) {

       });
       });*/
      return next();
    });
  });

  //SEND RESET PASSWORD https://loopback.io/doc/en/lb2/User-REST-API.html#reset-password
  //TODO https://github.com/strongloop/loopback-example-user-management/blob/master/server/boot/routes.js#L76-L99
  user.on('resetPasswordRequest', function (info) {
    var url = user.app.get('UIURL') + '/reset-password';
    var html = 'Click <a href="' + url + '/' +
      info.accessToken.id + '">here</a> to reset your password';
    //'here' in above html is linked to : 'http://<host:port>/reset-password?access_token=<short-lived/temporary access token>'
    user.app.models.Email.send({
      to: info.email,
      from: user.app.get('EMAILFROM'),
      subject: 'Password reset',
      text: 'Click below link to reset you password ' + url + '/' + info.accessToken.id,
      html: html
    }, function (err) {

      if (err) {
        console.log('> error sending password reset email');
        return err;
      }
      //Remove all token except current one
      user.app.models.AccessToken.remove({
        "userId": info.accessToken.userId,
        _id: {"neq": info.accessToken.id}
      }, function (err, data) {
        console.log(err);
        console.log(data)
      });
    });
  });

  user.beforeRemote('login', function (ctx, c, next) {
    if (ctx.args && ctx.args.credentials) {
      //Add access token ttl to one day
      //REF https://github.com/strongloop/loopback/issues/736
      //REF https://github.com/strongloop/loopback-component-passport/issues/31
      ctx.args.credentials.ttl = 604800;
      next()
    }
    else {
      next();
    }
  });

  user.afterRemote('login', function (ctx, c, next) {
    user.findOne({where: {id: ctx.result.userId}}, function (err, appUserObject) {
      if (!err) {
        user.app.models.AccessToken.remove({
          "userId": ctx.result.userId,
          _id: {"neq": ctx.result.id}
        }, function (err, data) {
        });
        ctx.result.userData = appUserObject;//Fetching user current role
        user.app.models.RoleMapping.find({filter: {where: {principalId: appUserObject.id}}}, function (err, roleMappings) {
          var roleIds = _.uniq(roleMappings
            .map(function (roleMapping) {
              return roleMapping.roleId;
            }));
          var conditions = roleIds.map(function (roleId) {
            return {id: roleId};
          });
          if (!_.isEmpty(conditions)) {
            user.app.models.Role.find({filter: {where: {or: conditions}}}, function (err, roles) {
              var roleNames = roles.map(function (role) {
                return role.name;
              });
              ctx.result.userData.Role = _.uniq(roleNames);
              return next();
            });
          }
          else {
            ctx.result.userData.Role = ['User'];
            return next();
          }

        });

      }

    });
  });

  user.getCurrentUser = function (cb) {
    //FOR Getting current User Context

    var currentUser = common.getUsers(user.app);
    currentUser.Role = common.getUserRoles(user.app);

    return cb(null, currentUser);
  };

  user.getUserByEmail = function (email, cb) {

    if (!email || email === '{email}') {
      return common.notFound('User email is required', cb);
    }
    user.findOne({where: {email: email}}, function (err, appUserObject) {
      if (err) {
        return cb(err);
      }
      if (!appUserObject) {
        return common.notFound('User not found', cb);
      }
      return cb(null, appUserObject || {});
    });
  };

  user.getUserByUserName = function (username, cb) {

    if (!username || username === '{username}') {
      return common.notFound('User\s username is required', cb);
    }
    user.findOne({where: {username: username}, fields: userFields}, function (err, appUserObject) {
      if (err) {
        return cb(err);
      }
      if (!appUserObject) {
        return common.notFound('User not found', cb);
      }
      return cb(null, appUserObject || {});
    });
  };


  user.resetUserPassword = function (params, cb) {

    if (_.isEmpty(params.password)) {
      return common.notFound('Password is required', cb);
    }

    var currentUser = common.getUsers(user.app);
    if (currentUser.email !== params.email) {
      return common.notFound('Invalid Email address', cb);
    }
    user.findById(currentUser.id, function (err, userObj) {
      if (err) {
        return cb(err);
      }
      userObj.updateAttribute('password', params.password, function (err) {
        if (err) {
          return cb(err);
        }
        console.log('> password reset processed successfully');

        //Remove all token of user
        user.app.models.AccessToken.remove({
          "userId": currentUser.id
        });
        return cb(null, {
          status: true,
          message: "Password change successfully. Please login with new password"
        });
      });
    })
  };

  user.changeUserPassword = function (params, cb) {

    if (_.isEmpty(params.password)) {
      return common.notFound('Old password is required', cb);

    }
    else if (_.isEmpty(params.newPassword)) {
      return common.notFound('New password is required', cb);

    }

    var currentUser = common.getUsers(user.app);
    console.log(currentUser)
    user.findById(currentUser.id, function (err, userObj) {
      if (err) {
        return cb(err);
      }
      userObj.hasPassword(params.password, function (err, isMatch) {
        if (err) {
          return cb(err);
        } else if (!isMatch) {
          return common.notFound('OldPassword Dose not match', cb);
        }
        else {

          userObj.updateAttribute('password', params.newPassword, function (err, data) {
            if (err) {
              return cb(err);

            }
            var html = 'Your account password is successfully changed.';
            common.sendMail(user, {
              to: currentUser.email,
              from: user.app.get('EMAILFROM'),
              subject: 'Password change successfully',
              text: html,
              html: html
            });

            return cb(null, {
              status: true,
              message: "Password change successfully. Please login with new password"
            });
          });

        }
      });
    })
  };

  user.resendUsersVerificationMail = function (params, cb) {
    if (_.isEmpty(params.email)) {
      return common.notFound('Email required', cb);
    }

    user.findOne({where: {email: params.email}}, function (err, userInstance) {
      if (err) {
        return cb(err);
      }
      if (!userInstance) {
        return common.badRequest('Email is not register with us', cb);
      }
      if (userInstance.emailVerified) {
        return common.badRequest('Email is already verified', cb);
      }
      var options = {
        host: user.app.get('UIHOST'),
        protocol: user.app.get('UIPROTOCOL'),
        port: user.app.get('UIPORT'),
        text: 'Please activate your account by clicking on this link or copying and pasting it in a new browser window:\n\t <a href="{href}">Verify Account</a>',
        type: 'email',
        to: userInstance.email,
        from: user.app.get('EMAILFROM'),
        subject: 'Blavity Verification link.',
        template: path.resolve(__dirname, '../../server/views/verify.ejs'),
        redirect: user.app.get('UIURL') + '/login-success',
        user: userInstance
      };
      userInstance.verify(options, function (err, response) {
        if (err) {
          return common.badRequest("Oops! Error in Verification mail send ");
        }
        else {
          return cb(null, {
            status: true,
            message: "Verification mail send successfully. Please check your email"
          });
        }

      });
    });
  };

  user.getRole = function (cb) {
    user.app.models.Role.find({filter: {fields: {name: true, id: true}}}, function (err, data) {
      if (err) {
        return cb(err);
      }
      return cb(null, data);
    })
  };


  user.isUserNameExists= function(username, cb){

    if (!username || username === '{username}') {
      return common.notFound('User\s username is required', cb);
    }
    user.find({where:{username:username}}, function(err, data){
      if(err){
        return cb(err);
      }
      if(data.length){
        return common.conflict('Username is already exists',cb)
      }
      return cb(null,data);
    })
  };

  user.isEmailExists= function(email, cb){

    if (!email || email === '{email}') {
      return common.notFound('User\s email is required', cb);
    }
    user.find({filter:{where:{email:email}}}, function(err, data){
      if(err){
        return cb(err);
      }
      if(data.length){
        return common.conflict('email is already exists',cb)
      }
      return cb(null,data);
    })
  };

  //Ref Link https://loopback.io/doc/en/lb2/Remote-methods.html
  user.remoteMethod(
    'getCurrentUser', {
      http: {
        path: '/me',
        verb: 'get'
      },
      returns: {
        arg: 'data',
        type: 'array',
        root: true
      }
    }
  );

  //Ref Link https://loopback.io/doc/en/lb2/Remote-methods.html
  user.remoteMethod(
    'getUserByEmail', {
      http: {
        path: '/:email/data',
        verb: 'get'
      },
      returns: {
        arg: 'data',
        type: 'array',
        root: true
      },
      accepts: {
        arg: 'email', type: 'string', http: {source: 'path'}
        , required: true
      }
    }
  );


  //Ref Link https://github.com/strongloop/loopback-example-user-management/blob/master/server/boot/routes.js#L76-L99
  user.remoteMethod(
    'resetUserPassword', {
      http: {
        path: '/reset-password',
        verb: 'put'
      },
      returns: {
        arg: 'data',
        type: 'array',
        root: true
      },
      accepts: [
        {
          arg: 'params', type: 'object', default: {
          "password": "string",
          "confirmPassword": "string"
        }, http: {source: 'body'}, required: true
        }

      ]
    }
  );

  //Ref Link https://github.com/strongloop/loopback-example-user-management/blob/master/server/boot/routes.js#L76-L99
  user.remoteMethod(
    'changeUserPassword', {
      http: {
        path: '/change-password',
        verb: 'put'
      },
      returns: {
        arg: 'data',
        type: 'array'
      },
      accepts: [
        {
          arg: 'params', type: 'object', default: {
          "password": "string",
          "confirmPassword": "string"
        }, http: {source: 'body'}, required: true
        }

      ]
    }
  );

  user.remoteMethod(
    'resendUsersVerificationMail', {
      http: {
        path: '/resend-verification-mail',
        verb: 'post'
      },
      returns: {
        arg: 'data',
        type: 'array'
      },
      accepts: [
        {
          arg: 'params', type: 'object', default: {
          "email": "string"
        }, http: {source: 'body'}, required: true
        }

      ]
    }
  );

  user.remoteMethod(
    'getRole', {
      http: {
        path: '/getRole',
        verb: 'get'
      },
      returns: {
        root: true
      }
    }
  );


  //Ref Link https://loopback.io/doc/en/lb2/Remote-methods.html
  user.remoteMethod(
    'getUserByUserName', {
      http: {
        path: '/name/:username',
        verb: 'get'
      },
      returns: {
        root: true
      },
      accepts: {
        arg: 'username', type: 'string', http: {source: 'path'}
        , required: true
      }
    }
  );

  //Ref Link https://loopback.io/doc/en/lb2/Remote-methods.html
  user.remoteMethod(
    'isUserNameExists', {
      http: {
        path: '/isExists/:username',
        verb: 'get'
      },
      returns: {
        root: true
      },
      accepts: {
        arg: 'username', type: 'string', http: {source: 'path'}
        , required: true
      }
    }
  );

  //Ref Link https://loopback.io/doc/en/lb2/Remote-methods.html
  user.remoteMethod(
    'isEmailExists', {
      http: {
        path: '/:email/isExists',
        verb: 'get'
      },
      returns: {
        root: true
      },
      accepts: {
        arg: 'email', type: 'string', http: {source: 'path'}
        , required: true
      }
    }
  );

};
