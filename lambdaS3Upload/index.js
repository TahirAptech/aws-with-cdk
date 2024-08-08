// const AWS = require('aws-sdk');
// const s3 = new AWS.S3();

// exports.handler = async (event) => {
//   const { fileName, contentType } = event.body;

//   const params = {
//     Bucket: process.env.BUCKET_NAME,
//     Key: fileName,
//     Expires: 300, // URL expires in 300 seconds
//     ContentType: contentType,
   
//   };

//   try {
//     const preSignedUrl = await s3.getSignedUrlPromise('putObject', params);
//     return  preSignedUrl
//   } catch (err) {
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: "Could not create a signed URL" }),
//     };
//   }
// };
exports.handler = async (event) => {
  console.log('Event: ', event);
  return {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda updated!'),
  };
};