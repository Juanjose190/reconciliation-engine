# Academic AWS Deployment

This is a low-cost, single-EC2 deployment for academic demonstration. It is not production HA.

## Current AWS Access Issue

The configured profile authenticates, but the IAM user currently lacks EC2 read permissions. This command failed:

```bash
AWS_PROFILE=reconciliation-academic aws ec2 describe-vpcs
```

Required minimum permissions for this Terraform demo:

- `ec2:DescribeVpcs`
- `ec2:DescribeSubnets`
- `ec2:DescribeImages`
- `ec2:DescribeInstances`
- `ec2:RunInstances`
- `ec2:TerminateInstances`
- `ec2:CreateSecurityGroup`
- `ec2:DeleteSecurityGroup`
- `ec2:AuthorizeSecurityGroupIngress`
- `ec2:AuthorizeSecurityGroupEgress`
- `ec2:RevokeSecurityGroupIngress`
- `ec2:CreateKeyPair`
- `ec2:DeleteKeyPair`
- `ec2:CreateTags`
- `iam:PassRole`, only if adding an instance profile later
- Route 53 permissions only if `create_private_dns=true`

For a short academic demo, attaching `AmazonEC2FullAccess` temporarily is the quickest path. Remove it after the demo.

## Install Terraform

macOS:

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

## Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Update `admin_cidr` with your current IP:

```bash
curl https://checkip.amazonaws.com
```

If you do not have an SSH key yet:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C reconciliation-academic
```

## Deploy

```bash
cd infra/aws-academic
AWS_PROFILE=reconciliation-academic terraform init
AWS_PROFILE=reconciliation-academic terraform plan
AWS_PROFILE=reconciliation-academic terraform apply
```

## Free-Tier Friendly Manual Deploy

AWS free-tier restrictions may block larger instances. For a stable classroom demo on `t3.small`, use the lightweight bootstrap:

```bash
AWS_PROFILE=reconciliation-academic aws ec2 run-instances \
  --image-id <ubuntu-ami-id> \
  --instance-type t3.small \
  --key-name reconciliation-engine-academic \
  --security-group-ids <security-group-id> \
  --subnet-id <subnet-id> \
  --associate-public-ip-address \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=30,VolumeType=gp3,DeleteOnTermination=true}' \
  --user-data file://user-data-lite.sh
```

The lightweight bootstrap runs:

- EC2
- Security Group
- nftables
- Nginx reverse proxy
- Docker
- Postgres
- NestJS API

The full Kafka/RabbitMQ/Keycloak/Formance platform remains documented in the main platform files, but the lightweight EC2 path is the safer live demo for a small academic instance.

## Test

```bash
terraform output ssh_command
terraform output health_url
```

The academic deployment exposes:

- `http://<ec2-ip>/` for the web app
- `http://<ec2-ip>/api/health` for the API health check

## Destroy

```bash
AWS_PROFILE=reconciliation-academic terraform destroy
```
