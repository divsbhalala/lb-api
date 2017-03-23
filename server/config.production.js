module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,
  UIHOST: process.env.UIHOST,
  UIPROTOCOL: process.env.UIPROTOCOL,
  UIPORT: process.env.UIPORT,
  EMAILFROM: process.env.EMAILFROM,
  UIURL: process.env.UIURL,
  APIKEY: process.env.APIKEY,
  cloudStoreVideos: {
    s3: {
      bucket: process.env.AWS_S3_BUCKET ,
      region: process.env.AWS_S3_REGION ,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID ,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
    },
    cacheControl:1296000
  },
  VALID_VIDEO_EXT: ['mp4']
};
