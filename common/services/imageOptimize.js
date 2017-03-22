const fs = require('fs')
  , gm = require('gm').subClass({imageMagick: true});
var path = require("path");
module.exports.pngToJpg = function (src, dest) {
  src= path.resolve(src);
  dest= path.resolve(dest);
  return new Promise(function (resolve, reject) {
    if(src.indexOf('.png')<0){
      return resolve()
    }
    if (!fs.existsSync(src)) {
      return reject('File not exists');
    }
    dest=dest.replace('.png', '.jpg');
    var writeStream = fs.createWriteStream(dest);
    gm(src).setFormat("jpg").write(dest, function(error, data){
      if(error){
        return reject(reject);
      }
      else{
        return resolve(data)
      }
    });
  })
}
