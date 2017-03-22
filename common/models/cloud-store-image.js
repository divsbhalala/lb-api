const  common= require('./../services/common');
const imageOptimize = require('./../services/imageOptimize');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');
const del = require('del');
module.exports = function (CloudStoreImage) {
  let app;

  const async = require('async');
  const qt = require('quickthumb');
  const fs = require('fs');
  const AWS = require('aws-sdk');

  //CloudStoreImage.disableRemoteMethod('createContainer', true);
  //CloudStoreImage.disableRemoteMethod('getContainer', true);
  //CloudStoreImage.disableRemoteMethod('destroyContainer', true);
  CloudStoreImage.disableRemoteMethod('download', true);
  CloudStoreImage.disableRemoteMethod('removeFile', true);
  CloudStoreImage.disableRemoteMethod('getFiles', true);
  CloudStoreImage.disableRemoteMethod('getFile', true);

  CloudStoreImage.on('attached', function () {
    app = CloudStoreImage.app;
    AWS.config.update({
      accessKeyId: app.get('cloudStoreImages').s3.accessKeyId,
      secretAccessKey: app.get('cloudStoreImages').s3.secretAccessKey
    });

    AWS.config.region = app.get('cloudStoreImages').s3.region;
  });

  CloudStoreImage.beforeRemote('upload', function (ctx, unused, next) {
    // Sample getting header
    //console.info("I GOT HEADER: " , ctx.req.headers);

    /*if (!ctx.req.headers['image-type']) {
     return next('Header \'image-type\' is required.');
     }
     */

    next();
  });

  CloudStoreImage.afterRemote('upload', function (ctx, res, next) {
    //let header = ctx.req.headers['image-type'];

    let file = res.result.files.fileUpload[0];
    let fileRoot = CloudStoreImage.app.datasources.fileStorageDS.settings.root;

    let ext = getExtension(file.name);

    let fileNameRoot = file.name.substr(0, file.name.length - ext.length);

    let filePath = fileRoot + '/' + file.container + '/' + file.name;

    let filePathRoot = fileRoot + '/' + file.container + '/' + fileNameRoot;

    let VALID_IMAGE_EXT = app.get('VALID_IMAGE_EXT') || [];
    let tmpExt = ext.replace('.', '').toLowerCase();
    if (VALID_IMAGE_EXT.indexOf(tmpExt) < 0) {
      fs.unlink(filePath, function (err) {
        console.log('due to invalid file this file will be removed')
      })
      return next(common.badRequest("Invalid image type"))
    }
    let resize = [{
      width: 0, ext: '',
      filePath: filePath,
      fileName: fileNameRoot + '.jpg',
      fileNameRoot: fileNameRoot,
      srcPath: fileRoot + '/' + file.container
    }];
    resize = resize.concat(app.get('cloudStoreImages').imageSize.map(function (item) {
      return {
        width: item.width,
        height: item.height,
        ext: ext,
        fileNameRoot: fileNameRoot,
        folder: item.folder,
        srcPath: fileRoot + '/' + file.container + '/' + item.folder,
        fileName: fileNameRoot + ext,
        filePath: fileRoot + '/' + file.container + '/' + item.folder + fileNameRoot + ext
      }
    }));
    //console.log(resize); return;
    /*let resize = [
     {
     width: 0, ext: '',
     filePath: filePath,
     fileName: fileNameRoot + '.jpg',
     fileNameRoot: fileNameRoot,
     srcPath: fileRoot + '/' + file.container
     },
     {
     width: app.get('cloudStoreImages').small.width,
     height: app.get('cloudStoreImages').small.height,
     ext: ext,
     fileNameRoot: fileNameRoot,
     folder: app.get('cloudStoreImages').small.folder,
     srcPath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').small.folder,
     fileName: fileNameRoot + '.jpg',
     filePath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').small.folder + fileNameRoot + ext
     },
     {
     width: app.get('cloudStoreImages').thumb.width,
     height: app.get('cloudStoreImages').thumb.height,
     ext: ext, folder: app.get('cloudStoreImages').thumb.folder,
     fileNameRoot: fileNameRoot,
     fileName: fileNameRoot + '.jpg',
     srcPath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').thumb.folder,
     filePath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').thumb.folder + fileNameRoot + ext
     },
     {
     width: app.get('cloudStoreImages').medium.width,
     height: app.get('cloudStoreImages').medium.height,
     ext: ext, folder: app.get('cloudStoreImages').medium.folder,
     fileNameRoot: fileNameRoot,
     fileName: fileNameRoot + '.jpg',
     srcPath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').medium.folder,
     filePath: fileRoot + '/' + file.container + '/' + app.get('cloudStoreImages').medium.folder + fileNameRoot + ext
     }
     ];*/

    let s3obj;

    async.eachSeries(resize, function (spec, cb) {
        if (spec.width === 0) {
          return cb();
        }
        qt.convert({
            src: filePath,
            dst: spec.filePath,
            width: spec.width
          }, function (err, path) {
            if (err) {
              return cb(err);
            }
            cb();
          }
        );
      },
      function (err) {
        if (err) {
          return next(err);
        }

        async.eachSeries(resize, function (spec, cb) {
            //spec.filePath = spec.filePath.replace('.png', '.jpg')
            if (!spec.folder) {
              spec.folder = '';
            }

            if (fs.existsSync(spec.filePath)) {

              /*imageOptimize.pngToJpg(spec.filePath, spec.filePath.replace('.png', '.jpg')).then(function (data) {
                console.log('png2jpg', data);
                //spec.filePath = spec.filePath.replace('.png', '.jpg')

              }).catch(function (err) {
                console.log('png2jpg err', err);
              })*/
              imagemin([spec.srcPath + '*.{png}'], spec.srcPath, {
                plugins: [
                  imageminMozjpeg({targa: false}),
                  imageminPngquant({quality: '50-65'})
                ]
              }).then(function (files) {
                /*if (fs.existsSync(spec.filePath.replace('.png', '.jpg'))) {
                  spec.filePath = spec.filePath.replace('.png', '.jpg');
                }*/
                fs.readFile(spec.filePath, function (err, buffer) {

                  s3obj = new AWS.S3(
                    {
                      params: {
                        Bucket: app.get('cloudStoreImages').s3.bucket,
                        Key: file.container + '/' + spec.folder + spec.fileNameRoot + ext,
                        ContentType: app.get('cloudStoreImages').contentType,
                        ACL: 'public-read',
                        CacheControl: 'max-age=' + app.get('cloudStoreImages').cacheControl
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
                    spec.aws = data;
                    cb();
                  });
                });
              }).catch(function (err) {
                return cb(err);
              });
            }
            else{
              return cb('File not found');
            }
            //Read the file

          },
          function (err) {
            if (err) {
              return next(err);
            }

            // Return the files we've uploaded
            res.result.files.fileUpload[0].path = filePath;
            res.result.files.fileUpload[0].resize = resize;

            //Return success to the client.  No need to wait for the files to be deleted.
            next();

            // Delete the local storage
            async.eachSeries(resize, function (spec, cb) {
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
          });
      });
  });

  function getExtension(filename) {
    let i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
  }
};

