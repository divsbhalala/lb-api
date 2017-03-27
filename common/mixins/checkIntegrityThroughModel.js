'use strict'

var _ = require('lodash');

var checkIntegrityThroughModel = function(ctx, next) {
  console.log('here')
  if (ctx.instance) {
    var relations = ctx.Model.definition.settings.relations;
    // get models from relations and findById w/ val from foreignKey
    // that matches ctx.instance key/val
    var throughInfo = _.map(relations, relation => {
        return { modelName: relation.model, fk: relation.foreignKey };
  });

    // ES6 destructuring
    var [
      { modelName: modelNameA, fk: fkA },
      { modelName: modelNameB, fk: fkB }
    ] = throughInfo;

    var throughModel = ctx.Model;
    var modelA = throughModel.app.models[modelNameA];
    var modelB = throughModel.app.models[modelNameB];
    var valueAId = ctx.instance[fkA];
    var valueBId = ctx.instance[fkB];

    modelA.findById(valueAId).then(function(instanceA) {
      if (instanceA === null) {
        return next('No ' + modelNameA + ' with "' + valueAId + '" id');
      }

      modelB.findById(valueBId).then(function(instanceB) {
        if (instanceB === null) {
          return next('No ' + modelNameB + ' with "' + valueBId + '" id');
        }
        next();
      });
    }).catch(function(err) {
      next(err);
    });
  }
};

module.exports = function(Model, options) {
  /**
   * @api {POST} /ThroughModel/ Create ModelA-ModelB information
   * @apiDescription Before Create a row in the through model, we check
   * both ids exist => integrity
   * This is both fk must be existing rows as pk in their tables
   *
   * @apiName beforeCreate
   * @apiGroup Model
   *
   * @apiParam {String} modelAId ModelA unique ID.
   * @apiParam {String} modelBId ModelB unique ID.
   *
   * @apiParamExample {json} Request-Example (/User-Role):
   *     {
    *       "userId": "490dd640-862e-11e6-9644-b5c34ca53299",
    *       "roleId": "basic",
    *     }
   */
  Model.observe('before save', checkIntegrityThroughModel);
};
