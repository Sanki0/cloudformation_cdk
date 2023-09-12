import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambda = new cdk.aws_lambda.Function(this, 'HelloHandler', {
      runtime: cdk.aws_lambda.Runtime.PROVIDED_AL2,
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, '../assets/hello-world')),
      handler: 'main',

    });

  }
}
