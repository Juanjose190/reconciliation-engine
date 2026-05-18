output "public_ip" {
  value = aws_instance.academic.public_ip
}

output "public_dns" {
  value = aws_instance.academic.public_dns
}

output "ssh_command" {
  value = "ssh -i ${var.ssh_private_key_path} ubuntu@${aws_instance.academic.public_ip}"
}

output "health_url" {
  value = "http://${aws_instance.academic.public_ip}/api/health"
}
