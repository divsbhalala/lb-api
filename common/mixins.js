module.exports = function(Model, options) {
    var mergeQuery = require('loopback-datasource-juggler/lib/utils').mergeQuery;
    
    var _ = require('mono-core/lib/lodash');
    
    var ds = Model.getDataSource();
    var connector = ds.connector;
    
    var secret = _.randomHex(24); // Ugly hack to enable bypassing 'access' hook scoping
    
    var deletedCondition = { deletedAt: { neq: null } };
    
    if (!_.isFunction(connector.softDelete)) {
        connector.settings.softDeleteModels = connector.settings.softDeleteModels || [];
        
        var _destroyAll = connector.destroyAll;
        
        connector.forceDelete = _destroyAll.bind(connector);
        
        connector.softDelete = function(model, where, callback) {
            if (_.isFunction(where)) callback = where, where = {};
            where = _.extend({}, where);
            var data = { deletedAt: new Date() };
            this.updateAll(model, where, data, callback);
        };
        
        connector.destroyAll = function destroyAll(model, where, callback) {
            if (_.include(connector.settings.softDeleteModels, model)) {
                this.softDelete.apply(this, arguments);
            } else {
                _destroyAll.apply(this, arguments);
            }
        };
    }
    
    connector.settings.softDeleteModels.push(Model.modelName);
    
    if (_.isNumber(options.expire) && options.expire > 0) {
        var after = options.expire; // seconds
        Model.defineProperty('deletedAt', _.extend({
            index: { 
                keys: ['deletedAt'],
                expireAfterSeconds: after 
            }
        }, { type: 'date', default: null }));
    } else {
        Model.defineProperty('deletedAt', { type: 'date', default: null });
    }
    
    Model.observe('access', function(ctx, next) {
        var where = ctx.query.where || {};
        if (returnDeleted(where)) return next();
        mergeQuery(ctx.query || {}, { where: { deletedAt: null } });
        next();
    });
    
    Model.scope('deleted', { 
        where: { deletedAt: { neq: null, secret: secret } },
        order: 'deletedAt'
    });
    
    Model.forceDestroyAll = Model['__delete__deleted'] = function(where, cb) {
        if (_.isFunction(where)) cb = where, where = {};
        var filter = { where: _.extend({}, where) }
        mergeQuery(filter, { where: deletedCondition });
        connector.forceDelete(Model.modelName, filter.where, cb);
    };
    
    Model.forceDestroyById = Model['__destroyById__deleted'] = function(id, cb) {
        var filter = getFilter(Model, id);
        _.extend(filter.where, deletedCondition);
        connector.forceDelete(Model.modelName, filter.where, cb);
    };
    
    Model.remoteMethod('__destroyById__deleted', {
        isStatic: true,
        description: 'Force-delete a soft-deleted item by id',
        http: { verb: 'delete', path: '/deleted/:fk' },
        accepts: { arg: 'fk', type: 'any', description: 'Id for deleted item', required: true, http: { source: 'path' } },
        accessType: 'WRITE'
    });
    
    // Helpers
    
    function returnDeleted(cond) {
        if (_.isObject(cond.deletedAt) && _.isNull(cond.deletedAt.neq)
            && cond.deletedAt.secret === secret) {
            return true;
        } else if (_.isArray(cond.and)) {
            return _.any(cond.and, returnDeleted);
        } else if (_.isArray(cond.or)) {
            return _.any(cond.or, returnDeleted);
        }
        return false;
    };
    
    function getFilter(modelClass, modelId) {
        var idName = modelClass.definition.idName() || 'id';
        if (_.isFunction(modelClass.queryById)) {
            var filter = modelClass.queryById(modelId);
        } else {
            var filter = { where: {} };
            filter.where[idName] = modelId;
        }
        filter.fields = [idName, 'alias'];
        return filter;
    };
    
};