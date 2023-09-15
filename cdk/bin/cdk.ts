#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const cdk_env: any = {};
Object.keys(process.env)
  .map((k) => (cdk_env[k] = process.env[k]));

const app = new cdk.App();
new CdkStack(app, 'CdkStack', {
  env: {
    account: process.env["CDK_DEPLOY_ACCOUNT"],
    region: process.env["CDK_DEPLOY_REGION"],
    ...cdk_env,
  },
});