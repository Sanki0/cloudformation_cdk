import { Role } from "../base/role";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs/lib";
import * as iam from "aws-cdk-lib/aws-iam";

// RoleProps is an interface that defines the properties of the RoleS3 class

interface RoleS3Props {
  // role name
  roleName: string;

  principal: string;
  // bucket name
  bucketName: string | string[];
}

export class RoleS3 extends Role {
  constructor(scope: Construct, id: string, props: RoleS3Props) {
    super(scope, id, props);

    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
        ],
        resources: [
          '*'
        ],
      })
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ],
        resources: [
          '*'
        ],
      })
    );

    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:*"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}