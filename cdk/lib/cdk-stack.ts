import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { CfnStateMachine } from 'aws-cdk-lib/aws-stepfunctions';

import { Construct } from 'constructs';
import path from 'path';
import { RoleAppsync } from "./roles/roleAppsync";
import { RoleStateMachine } from "./roles/roleStateMachine";

import cdkStateMachineDefinition from "../assets/statemachines/cdk.asl.json";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cdk_env: any = { ...props?.env };

    console.log("cdk_env", cdk_env);

    const lambda = new cdk.aws_lambda.Function(this, 'HelloHandler', {
      runtime: cdk.aws_lambda.Runtime.PROVIDED_AL2,
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, '../assets/hello-world')),
      handler: 'main',
    });

    // array of several lambdas to deploy
    const lambdas = [{ name: 'lambda1', code: '../assets/hello-world' },
    { name: 'lambda2', code: '../assets/hello-world' },
    { name: 'lambda3', code: '../assets/hello-world' }]

    lambdas.forEach((lambda) => {
      new cdk.aws_lambda.Function(this, lambda.name, {
        runtime: cdk.aws_lambda.Runtime.PROVIDED_AL2,
        functionName: lambda.name,
        code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, lambda.code)),
        handler: 'main',
      });
      console.log(lambda.name + " deployed");
    });

    const appsyncGraphqlApi = new appsync.GraphqlApi(this, `cdk-appsync`, {
      name: `cdk-appsync`,
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, "../assets/schema/schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
    });

    const appsyncRole = new RoleAppsync(this, `appsyncRole`, {
      roleName: `appsyncRole`,
      principal: "appsync.amazonaws.com",
    });

    const stateMachineDataSource = new cdk.CfnResource(this, `stateMachineDataSource`, {
      type: "AWS::AppSync::DataSource",
      properties: {
        ApiId: appsyncGraphqlApi.apiId,
        Name: `stateMachineDataSource`,
        Type: "HTTP",
        ServiceRoleArn: appsyncRole.role.roleArn,
        HttpConfig: {
          Endpoint: `https://sync-states.${cdk_env["CDK_DEPLOY_REGION"]}.amazonaws.com/`,
          AuthorizationConfig: {
            AuthorizationType: "AWS_IAM",
            AwsIamConfig: {
              SigningRegion: cdk_env["CDK_DEPLOY_REGION"],
              SigningServiceName: "states",
            },
          },
        },
      },
    });

    const statMachineRole = new RoleStateMachine(this, `statMachineRole`, {
      roleName: `statMachineRole`,
      principal: "states.amazonaws.com",
    });

    const CDKStateMachine = new CfnStateMachine(this, `CDKStateMachine`, {
      stateMachineName: `CDKStateMachine`,
      definition: cdkStateMachineDefinition,
      roleArn: statMachineRole.roleArn,
      stateMachineType: "EXPRESS",
    });

    const StepFunctionsHttpResolverCDK = new cdk.CfnResource(this, `StepFunctionsHttpResolver-cdk`, {
      type: "AWS::AppSync::Resolver",
      properties: {
        ApiId: appsyncGraphqlApi.apiId,
        DataSourceName: stateMachineDataSource.getAtt("Name").toString(),
        FieldName: "stepFunctionsHttp",
        TypeName: "Mutation",
        RequestMappingTemplate: `{
          "version": "2018-05-29",
          "method": "POST",
          "resourcePath": "/",
          "params": {
            "headers": {
              "Content-Type": "application/x-amz-json-1.0",
              "x-amz-target": "AWSStepFunctions.StartSyncExecution"
            },
            "body": {
              "stateMachineArn": "${CDKStateMachine.ref}",
              "input": "{ \\"input\\": \\"$util.escapeJavaScript($ctx.args.input)\\" }"
            }
          }
        }`,
        ResponseMappingTemplate: `$util.parseJson($ctx.result.body).output`,
      },
    });

  }
}
