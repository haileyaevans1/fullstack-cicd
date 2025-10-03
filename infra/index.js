const aws = require("@pulumi/aws");

// 1) S3 bucket for static site
const site = new aws.s3.Bucket("site", { website: { indexDocument: "index.html" } });

// 2) SGs
const apiSg = new aws.ec2.SecurityGroup("api-sg", {
  description: "Allow 8080 from anywhere (demo)",
  ingress: [{ protocol:"tcp", fromPort:8080, toPort:8080, cidrBlocks:["0.0.0.0/0"] }],
  egress: [{ protocol:"-1", fromPort:0, toPort:0, cidrBlocks:["0.0.0.0/0"] }],
});

const dbSg = new aws.ec2.SecurityGroup("db-sg", {
  description: "Allow Postgres from API SG only",
  ingress: [{ protocol:"tcp", fromPort:5432, toPort:5432, securityGroups:[apiSg.id] }],
  egress: [{ protocol:"-1", fromPort:0, toPort:0, cidrBlocks:["0.0.0.0/0"] }],
});

// 3) EC2 (installs docker; you will SSH/Actions to run container)
const role = new aws.iam.Role("ec2-role", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ec2.amazonaws.com" }),
});
new aws.iam.RolePolicyAttachment("ssm", { role: role.name, policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" });
const profile = new aws.iam.InstanceProfile("ec2-prof", { role });

const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["amazon"],
  filters: [{ name: "name", values: ["al2023-ami-*-x86_64"] }],
}, { async: true });

const api = new aws.ec2.Instance("api", {
  instanceType: "t3.micro",
  ami: ami.then(a => a.id),
  vpcSecurityGroupIds: [apiSg.id],
  iamInstanceProfile: profile.name,
  userData: `#!/bin/bash
    yum update -y
    yum install -y docker
    systemctl enable docker
    systemctl start docker
  `,
  tags: { Name: "api" },
});

// 4) RDS Postgres (private)
const db = new aws.rds.Instance("db", {
  engine: "postgres",
  instanceClass: "db.t3.micro",
  allocatedStorage: 20,
  dbName: "appdb",
  username: "appuser",
  password: "ChangeMe1234!",
  publiclyAccessible: false,
  vpcSecurityGroupIds: [dbSg.id],
  skipFinalSnapshot: true,
});

exports.bucket = site.bucket;
exports.apiIp = api.publicIp;
exports.dbHost = db.address;
