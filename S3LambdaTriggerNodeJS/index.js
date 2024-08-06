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

