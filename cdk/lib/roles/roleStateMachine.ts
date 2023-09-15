import { Role } from "../base/role";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs/lib";
import * as iam from "aws-cdk-lib/aws-iam";

// RoleProps is an interface that defines the properties of the RoleS3 class

interface RoleStateMachineProps {
  // role name
  roleName: string;
  principal: string;
}

export class RoleStateMachine extends Role {
  constructor(scope: Construct, id: string, props: RoleStateMachineProps) {
    props.principal = "states.amazonaws.com";
    super(scope, id, props);

    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["states:*"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}