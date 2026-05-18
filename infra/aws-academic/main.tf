terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "academic" {
  key_name   = "${var.project_name}-academic"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_security_group" "academic" {
  name        = "${var.project_name}-academic"
  description = "Academic reconciliation demo EC2 ingress"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from current admin IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  ingress {
    description = "HTTPS demo"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Temporary HTTP demo"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "academic" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.academic.id]
  key_name                    = aws_key_pair.academic.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    repository_url = var.repository_url
  })

  tags = {
    Name    = "${var.project_name}-academic"
    Project = var.project_name
    Purpose = "academic-demo"
  }
}

resource "aws_route53_zone" "private" {
  count = var.create_private_dns ? 1 : 0
  name  = var.private_zone_name

  vpc {
    vpc_id = data.aws_vpc.default.id
  }
}

resource "aws_route53_record" "core" {
  count   = var.create_private_dns ? 1 : 0
  zone_id = aws_route53_zone.private[0].zone_id
  name    = "core.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = [aws_instance.academic.private_ip]
}

resource "aws_route53_record" "kafka" {
  count   = var.create_private_dns ? 1 : 0
  zone_id = aws_route53_zone.private[0].zone_id
  name    = "kafka.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = [aws_instance.academic.private_ip]
}

resource "aws_route53_record" "rabbitmq" {
  count   = var.create_private_dns ? 1 : 0
  zone_id = aws_route53_zone.private[0].zone_id
  name    = "rabbitmq.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = [aws_instance.academic.private_ip]
}

resource "aws_route53_record" "postgres" {
  count   = var.create_private_dns ? 1 : 0
  zone_id = aws_route53_zone.private[0].zone_id
  name    = "postgres.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = [aws_instance.academic.private_ip]
}
