variable "private_zone_name" {
  type    = string
  default = "reconciliation.internal"
}

resource "aws_route53_zone" "private" {
  name = var.private_zone_name

  vpc {
    vpc_id = var.vpc_id
  }
}

resource "aws_route53_record" "core" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "core.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = ["10.0.10.10"]
}

resource "aws_route53_record" "kafka" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "kafka.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = ["10.0.10.20"]
}

resource "aws_route53_record" "rabbitmq" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "rabbitmq.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = ["10.0.10.30"]
}

resource "aws_route53_record" "postgres" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "postgres.${var.private_zone_name}"
  type    = "A"
  ttl     = 30
  records = ["10.0.10.40"]
}
