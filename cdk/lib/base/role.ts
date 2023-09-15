import { Construct } from "constructs/lib";
import * as iam from "aws-cdk-lib/aws-iam";

interface RoleProps {
  // role name
  roleName: string;
  principal: string;
}

export class Role extends Construct {
  public readonly role: iam.Role;
  public readonly roleArn: string;
  public readonly roleName: string;

  constructor(scope: Construct, id: string, props: RoleProps) {
    super(scope, id);

    // create role
    this.role = new iam.Role(this, props.roleName, {
      roleName: props.roleName,
      assumedBy: new iam.ServicePrincipal(props.principal),
    });

    this.roleArn = this.role.roleArn;
  }
}