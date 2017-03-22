module.exports = {
  mongoDb: {
    "name": "mongoDb",
    "connector": "loopback-connector-mongodb",
    "url":process.env.DB_URL+ process.env.DB_NAME
  },
  "sparkpost": {
    "connector": "loopback-connector-sparkpost",
    "apiKey": process.env.APIKEY,
    "defaults": {
      "options": {
        "start_time": "now",
        "from": process.env.EMAILFROM,
        "sandbox":true
      }
    }
  },
  fileStorageDS: {
    root: "./upload",
    acl: 'public-read',
    maxFileSize: process.env.MAX_IMAGE_UPLOAD_SIZE,
    getFilename: function(fileInfo) {
      var fileName = fileInfo.name.replace(/\s+/g, '-').toLowerCase();
      return 'image-' + new Date().getTime() + '-' + fileName;
    }
  }
};
