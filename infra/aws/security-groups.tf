variable "vpc_id" {
  type = string
}

variable "admin_cidr" {
  type = string
}

variable "app_cidr" {
  type = string
}

resource "aws_security_group" "reconciliation_edge" {
  name        = "reconciliation-edge"
  description = "Public edge ingress for Nginx only"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Admin SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "reconciliation_internal" {
  name        = "reconciliation-internal"
  description = "Private service-to-service traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "Core API from edge"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = [var.app_cidr]
  }

  ingress {
    description = "Kafka internal"
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = [var.app_cidr]
  }

  ingress {
    description = "RabbitMQ internal"
    from_port   = 5672
    to_port     = 5672
    protocol    = "tcp"
    cidr_blocks = [var.app_cidr]
  }

  ingress {
    description = "Postgres internal"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.app_cidr]
  }
}
