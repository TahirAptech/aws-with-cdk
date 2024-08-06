// const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
// const sharp = require('sharp');

// // Initialize AWS S3 client
// const s3Client = new S3Client();

// exports.handler = async (event) => {
//   const bucket = event.Records[0].s3.bucket.name;
//   const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

//   try {
//     // Fetch the image from S3
//     const getObjectParams = {
//       Bucket: bucket,
//       Key: key
//     };
//     const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
//     const imageBuffer = await streamToBuffer(Body);

//     // Resize images using Sharp
//     const headerLogo = await sharp(imageBuffer).resize(250, 100).toFormat('jpeg').toBuffer();
//     const footerLogo = await sharp(imageBuffer).resize(150, 50).toFormat('jpeg').toBuffer();
//     const sidebarLogo = await sharp(imageBuffer).resize(120, 40).toFormat('jpeg').toBuffer();

//     // Upload resized images back to S3
//     await Promise.all([
//       uploadResizedImage(bucket, `resized/${key}/header-logo.jpg`, headerLogo),
//       uploadResizedImage(bucket, `resized/${key}/footer-logo.jpg`, footerLogo),
//       uploadResizedImage(bucket, `resized/${key}/sidebar-logo.jpg`, sidebarLogo),
//     ]);

//     return { status: 'Success' };
//   } catch (err) {
//     console.error(err);
//     return { status: 'Error', message: err.message };
//   }
// };

// function uploadResizedImage(bucket, key, buffer) {
//   const putObjectParams = {
//     Bucket: bucket,
//     Key: key,
//     Body: buffer,
//     ContentType: 'image/jpeg'
//   };
//   return s3Client.send(new PutObjectCommand(putObjectParams));
// }

// function streamToBuffer(stream) {
//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     stream.on('data', (chunk) => chunks.push(chunk));
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//     stream.on('error', reject);
//   });
// }

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const S3 = new S3Client();
const SUPPORTED_FORMATS = {
  jpg: true,
  jpeg: true,
  png: true,
};

export const handler = async (event, context) => {
  console.log('event', event);
  const { eventTime, s3 } = event.Records[0];
  const bucket = s3.bucket.name;

  // Object key may have spaces or unicode non-ASCII characters
  const srcKey = decodeURIComponent(s3.object.key.replace(/\+/g, " "));
  const ext = srcKey.replace(/^.*\./, "").toLowerCase();

  console.log(`${eventTime} - ${bucket}/${srcKey}`);

  if (!SUPPORTED_FORMATS[ext]) {
    console.log(`ERROR: Unsupported file type (${ext})`);
    return;
  }

  // Get the image from the source bucket
  try {
    const { Body, ContentType } = await S3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: srcKey,
      })
    );
    const sizes = [
      { width: 250, height: 100 },
      { width: 150, height: 50 },
      { width: 120, height: 40 },
    ]
    const image = await Body.transformToByteArray();
    for(const size of sizes){
       const destKey = `resized-${size.width}.jpg`

        // resize image
         const outputBuffer = await sharp(image).resize(size).toBuffer();
    
        // store new image in the destination bucket
        await S3.send(
          new PutObjectCommand({
            Bucket: process.env.BUCKET_OUTPUT,
            Key: destKey,
            Body: outputBuffer,
            ContentType,
          })
        );
        const message = `Successfully resized ${bucket}/${srcKey} and uploaded to ${bucket}/${srcKey}`;
        console.log(message);
    }
    return {
      statusCode: 200,
      body: message,
    };
  } catch (error) {
    console.log(error);
  }
};


// const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
// const s3 = new S3Client({ region: process.env.AWS_REGION_NAME });
// const Jimp = require('jimp');
// // const streamToBuffer = require('stream-to-buffer');

// exports.handler = async (event) => {
//     console.log('event', JSON.stringify(event));

//     const bucket = event.Records[0].s3.bucket.name;
//     const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

//     try {
//         //fetch the image from s3
//         const originalImage = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

//         //resize the image
//         // const image = await Jimp.read(originalImage.Body);
//         const image = await Jimp.read(Buffer.from(originalImage.Body));

//         // Resize images
//         const headerLogo = image.clone().resize(250, Jimp.AUTO);
//         const footerLogo = image.clone().resize(150, Jimp.AUTO);
//         const sidebarLogo = image.clone().resize(120, Jimp.AUTO);

//         // await uploadResizedImage(bucket, `resized/${key}/header.jpg`, headerLogo);
//         // await uploadResizedImage(bucket, `resized/${key}/footer.jpg`, footerLogo);
//         // await uploadResizedImage(bucket, `resized/${key}/sidebar.jpg`, sidebarLogo);
//         const processedImages = await Promise.all([
//             uploadResizedImage(bucket, `resized/${key}/header-logo.jpg`, headerLogo),
//             uploadResizedImage(bucket, `resized/${key}/footer-logo.jpg`, footerLogo),
//             uploadResizedImage(bucket, `resized/${key}/sidebar-logo.jpg`, sidebarLogo),
//         ]);

//         return { status: 'Success', processedImages };
//     } catch (error) {
//         console.error('Error processing image', error);
//         return { status: 'Error processing image', error };
//     }
// };

// // const streamToBuffer = (stream) => {
// //     return new Promise((resolve, reject) => {
// //         const chunks = [];
// //         stream.on('data', (chunk) => chunks.push(chunk));
// //         stream.on('end', () => resolve(Buffer.concat(chunks)));
// //         stream.on('error', reject);
// //     });
// // };

// // const resizeImage = async (image, width, height) => {
// //     return image.resize(width, height).quality(80).getBufferAsync(Jimp.MIME_JPEG);
// // };

// // const uploadResizedImage = async (bucket, key, imageBuffer) => {
// //     await s3.send(new PutObjectCommand({
// //         Bucket: bucket,
// //         Key: key,
// //         Body: imageBuffer,
// //         ContentType: 'image/jpeg'
// //     }));
// // };

// async function uploadResizedImage(bucket, key, image) {
//     const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
//     const result = await s3.send(new PutObjectCommand({
//         Bucket: bucket,
//         Key: key,
//         Body: buffer,
//         ContentType: 'image/jpeg'
//     }));
//     return { key: key, ETag: result.ETag };
// }