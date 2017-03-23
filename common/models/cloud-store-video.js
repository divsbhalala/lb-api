const  common= require('./../services/common');
const fs = require('fs');
const del = require('del');
module.exports = function (CloudStoreVideo) {
  var app;

  const async = require('async');
  const fs = require('fs');
  const AWS = require('aws-sdk');

  //CloudStoreVideo.disableRemoteMethod('createContainer', true);
  //CloudStoreVideo.disableRemoteMethod('getContainer', true);
  //CloudStoreVideo.disableRemoteMethod('destroyContainer', true);
  CloudStoreVideo.disableRemoteMethod('download', true);
  CloudStoreVideo.disableRemoteMethod('removeFile', true);
  CloudStoreVideo.disableRemoteMethod('getFiles', true);
  CloudStoreVideo.disableRemoteMethod('getFile', true);

  CloudStoreVideo.on('attached', function () {
    app = CloudStoreVideo.app;
    AWS.config.update({
      accessKeyId: app.get('cloudStoreVideos').s3.accessKeyId,
      secretAccessKey: app.get('cloudStoreVideos').s3.secretAccessKey
    });

    AWS.config.region = app.get('cloudStoreVideos').s3.region;
  });

  CloudStoreVideo.beforeRemote('upload', function (ctx, unused, next) {
    // Sample getting header
    //console.info("I GOT HEADER: " , ctx.req.headers);

    /*if (!ctx.req.headers['image-type']) {
     return next('Header \'image-type\' is required.');
     }
     */

    next();
  });

  CloudStoreVideo.afterRemote('upload', function (ctx, res, next) {
    //var header = ctx.req.headers['image-type'];

    var file = res.result.files.fileUpload[0];
    var fileRoot = CloudStoreVideo.app.datasources.fileStorageVideo.settings.root;

    var ext = getExtension(file.name);

    var fileNameRoot = file.name.substr(0, file.name.length - ext.length);

    var filePath = fileRoot + '/' + file.container + '/' + file.name;

    var filePathRoot = fileRoot + '/' + file.container + '/' + fileNameRoot;

    var VALID_IMAGE_EXT = app.get('VALID_VIDEO_EXT') || [];
    var tmpExt = ext.replace('.', '').toLowerCase();
    if (VALID_IMAGE_EXT.indexOf(tmpExt) < 0) {
      fs.unlink(filePath, function (err) {
        console.log('due to invalid file this file will be removed')
      })
      return next(common.badRequest("Invalid image type"))
    }

    var s3obj;
    async.parallel([
      function(cb){
        fs.readFile(filePath, function (err, buffer) {

          s3obj = new AWS.S3(
            {
              params: {
                Bucket: app.get('cloudStoreVideos').s3.bucket,
                Key: file.container + '/videos/' + fileNameRoot + ext,
                ContentType: app.get('cloudStoreVideos').contentType,
                ACL: 'public-read',
                CacheControl: 'max-age=' + app.get('cloudStoreVideos').cacheControl
              }
            });

          // Upload the file to S3
          s3obj.upload({Body: buffer})
            .on('httpUploadProgress', function (evt) {
              console.log('httpUploadProgress', evt);
            }).send(function (err, data) {
            if (err) {
              return cb('httpUploadProgress err', err);
            }
            cb(null, {data:data,filePath:filePath});
          })
        });
      }
    ], function (err, data) {
      // Delete the local storage
      async.eachSeries(data, function (spec, cb) {
          console.log('Removing file: %s', spec.filePath);

          fs.unlink(spec.filePath, function (err) {
            if (err) {
              return cb(err);
            }

            cb();
          })
        },
        function (err) {
          if (err) {
            console.error(err);
          }
        });
      return next();
    })


  });

  function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
  }
};

