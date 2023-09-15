import { Role } from "../base/role";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs/lib";
import * as iam from "aws-cdk-lib/aws-iam";

// RoleProps is an interface that defines the properties of the RoleAppsync class

interface RoleAppsyncProps {
  // role name
  roleName: string;
  // principal
  principal: string;
  // array of services
  services?: string[];
}

function getServices(services?: string[]): string[] {
  if (services) {
    return services;
  } else {
    return ["lambda:* ", "states:* ", "dynamodb:* "];
  }
}


export class RoleAppsync extends Role {
  constructor(scope: Construct, id: string, props: RoleAppsyncProps) {
    super(scope, id, props);

    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lambda:InvokeFunction",
          "states:*",
          "dynamodb:PutItem",
        ],
        resources: ["*"],
      })
    );
  }
}