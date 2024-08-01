import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3"

export class CdkTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /**
    * Logging bucket for S3 and CloudFront
    */
    const logsBucket = new s3.Bucket(this, "Logs", {
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
    })
    const cfnLogsBucket = logsBucket.node.findChild("Resource") as s3.CfnBucket
    cfnLogsBucket.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN
    cfnLogsBucket.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN

    // Create an S3 bucket
    const testCDKBucket = new s3.Bucket(this, "testCDKBucket", {
      serverAccessLogsBucket: logsBucket,
      serverAccessLogsPrefix: "testCDKBucket-logs/",
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }),
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      versioned: true,
      enforceSSL: true,
    })
    const cfnTestCDKBucket = testCDKBucket.node.findChild("Resource") as s3.CfnBucket
    cfnTestCDKBucket.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN
    cfnTestCDKBucket.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN

    //#region GetSignedUrl role and lambda By Tahir:
    const getSignedUrlRole = new iam.Role(this, "getSignedUrlRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    })
    const getSignedUrlRolePolicy = new iam.Policy(this, "GetSignedUrlPolicy", {
      policyName: `${cdk.Aws.STACK_NAME}-getSignedUrl-role`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:PutObject"],
          resources: [testCDKBucket.arnForObjects("*")],
        }),
        new iam.PolicyStatement({
          resources: [
            `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`,
          ],
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
        }),
      ],
    })
    getSignedUrlRolePolicy.attachToRole(getSignedUrlRole)

    // Create a Lambda function
    const lambdaFunction = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../lambdaS3Upload"),
      environment: {
        BUCKET_NAME: testCDKBucket.bucketName,
      },
    });

    // Grant Lambda permission to write to the bucket
    testCDKBucket.grantPut(lambdaFunction);
    testCDKBucket.grantWrite(lambdaFunction);

    /**
     * CloudFront distribution.
     * AWS Solutions Construct.
     * Construct includes a logs bucket for the CloudFront distribution and a CloudFront
     * OriginAccessIdentity which is used to restrict access to S3 from CloudFront.
     */
    const cachePolicyName = `cp-${cdk.Aws.REGION}-${cdk.Aws.STACK_NAME}`

    const cachePolicy = new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: cachePolicyName,
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
      ),
      maxTtl: cdk.Duration.seconds(0),
    })
    const distribution = new CloudFrontToS3(this, "CloudFrontToS3", {
      existingBucketObj: testCDKBucket,
      cloudFrontDistributionProps: {
        defaultBehavior: {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cachePolicy,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        logBucket: logsBucket,
        logFilePrefix: "cloudfront-logs/",
      },
      insertHttpSecurityHeaders: false,
      logS3AccessLogs: false,
    })
  }
}