import boto3
from PIL import Image
import io

s3_client = boto3.client('s3')

def handler(event, context):
    # Get bucket and key from the event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    # Get the image from S3
    response = s3_client.get_object(Bucket=bucket, Key=key)
    image_content = response['Body'].read()

    # Open the image file
    image = Image.open(io.BytesIO(image_content))

    # Resize images and their corresponding folder names
    sizes_and_folders = {
        "header-logo": (250, 100),
        "footer-logo": (150, 50),
        "sidebar-logo": (120, 40)
    }

    # Process and upload each resized image
    for folder_name, size in sizes_and_folders.items():
        resized_image = image.resize(size, Image.ANTIALIAS)
        output_stream = io.BytesIO()
        resized_image.save(output_stream, format='JPEG')
        output_stream.seek(0)

        # Define the new key according to the folder structure
        new_key = f"resized/{key}/{folder_name}.jpg"
        
        # Upload to S3
        s3_client.put_object(Bucket=bucket, Key=new_key, Body=output_stream, ContentType='image/jpeg')

    return {
        'statusCode': 200,
        'body': 'Images processed and uploaded successfully'
    }
