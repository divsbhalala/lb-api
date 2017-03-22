const moment = require('moment');
const  _= require('lodash');
const slugify = require('slug');

module.exports.addCreateDate = function (ctx, instance, next) {
    if (!ctx) {
        return;
    }
    if (ctx.args.data) {
        ctx.args.data.createdAt = moment().toISOString();
    }
    next();
};

//REF LINK ref http://stackoverflow.com/questions/32850153/strongloop-loopback-extending-built-in-user-model-with-remote-hook-results-in-e
module.exports.modifyUpdatedDate = function (ctx, next) {
    if (ctx.data) {
        ctx.data.updatedAt = moment().toISOString();
    }
    next();
};

module.exports.slugifySlugOnCreate = function (ctx, instance, next) {
    if (!ctx) {
        return;
    }
    if (ctx.args.data) {
        if (ctx.args.data.slug) {
          var tmpSlug=ctx.args.data.slug;
          tmpSlug=tmpSlug.toLowerCase();
          ctx.args.data.slug = slugify(tmpSlug);
        }
        else {
          var tmpSlug=ctx.args.data.title || ctx.args.data.name;
          tmpSlug=tmpSlug.toLowerCase();
          ctx.args.data.slug = slugify(tmpSlug);
        }
    }
    next();
};
module.exports.slugifySlugOnUpdate = function (ctx, next) {
    if (ctx.data) {
        if (ctx.data.slug) {
            ctx.data.slug = slugify(ctx.data.slug);
        }
    }
    next();
};

module.exports.isAdmin = function (appCtx) {
    var currentRole = appCtx && appCtx.currentRole;
    if (!_.isEmpty(currentRole)) {
        return currentRole.indexOf('admin') > -1;
    }
    return false;
};

module.exports.getUserRoles = function (appCtx) {
    var currentRole = appCtx && appCtx.currentRole;
    return currentRole ? currentRole : [];
};

module.exports.getUsers = function (appCtx) {
    var currentUser = appCtx && appCtx.currentUser;
    return currentUser;
};


module.exports.conflict = function (msg, cb) {
    var error = new Error();
    error.status = 409;
    error.statusCode = 409;
    error.message = msg;
    error.code = 'CONFLICT';
    if(cb){
        return cb(error);
    }
    else {
        return error;
    }
};

module.exports.notFound = function (msg, cb) {
    var error = new Error();
    error.status = 404;
    error.statusCode = 404;
    error.message = msg;
    error.code = 'NOT_FOUND';
    if(cb){
        return cb(error);
    }
    else {
        return error;
    }
};
module.exports.badRequest = function (msg, cb) {
    var error = new Error();
    error.status = 400;
    error.statusCode = 400;
    error.message = msg;
    error.code = 'BAD_REQUEST';
    if(cb){
        return cb(error);
    }
    else{
        return error;
    }

};
module.exports.authorizationRequired = function (msg, cb) {
    var error = new Error();
    error.status = 401;
    error.statusCode = 401;
    error.message = msg;
    error.code = 'AUTHORIZATION_REQUIRED';
    if(cb){
        return cb(error);
    }
    else{
        return error;
    }

};

module.exports.findOne = function (model, query) {
    return new Promise(function (resolve, reject) {
        model.findOne(query, function (err, instance) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};

module.exports.find = function (model, query) {
    return new Promise(function (resolve, reject) {
        model.find(query, function (err, instance) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};

module.exports.findById = function (model, id, filter) {
    return new Promise(function (resolve, reject) {
      filter= filter || {};
        model.findById(id, filter, function (err, instance) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};

module.exports.create = function (model, data) {
    return new Promise(function (resolve, reject) {
        model.create(data, function (err, instance) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};

module.exports.updateAttributes = function (model, json) {
    return new Promise(function (resolve, reject) {
        model.updateAttributes(json, function (err, instance) {

            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};

module.exports.sendMail = function (model, json) {
    return new Promise(function (resolve, reject) {
        model.app.models.Email.send(json, function (err, instance) {

            if (err) {
                return reject(err);
            }
            else {
                return resolve(instance);
            }
        })
    });
};


//HIDE all method except array of method supplied on "methods" array
//REF https://github.com/strongloop/loopback/issues/651
module.exports.setMethodsVisibility = function(Model, methods) {
    methods = methods || [];
    Model.sharedClass.methods().forEach(function(method) {
        method.shared = methods.indexOf(method.name) > -1;
    });
};
exports.isValidId = function (id) {

  // check first if undefined
  if (!id) {
    return false;
  }

  // check if id is a valid string
  if (typeof id !== 'string') {
    id = id.toString();
  }

  // simply match the id from regular expression
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    return true;
  } else {
    return false;
  }
};
