variable "aws_profile" {
  type    = string
  default = "reconciliation-academic"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "reconciliation-engine"
}

variable "repository_url" {
  type    = string
  default = "https://github.com/Juanjose190/reconciliation-engine.git"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519.pub"
}

variable "ssh_private_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519"
}

variable "admin_cidr" {
  type        = string
  description = "CIDR allowed to SSH into the academic EC2 instance."
}

variable "create_private_dns" {
  type    = bool
  default = false
}

variable "private_zone_name" {
  type    = string
  default = "reconciliation.internal"
}
