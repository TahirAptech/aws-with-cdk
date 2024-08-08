import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DefaultStackSynthesizer } from 'aws-cdk-lib';
import { CdkTestStack } from '../lib/cdk-test-stack';

const app = new cdk.App();
// new CdkTestStack(app, 'CdkTestStack');

new CdkTestStack(app, 'CdkTestStack', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  })
});