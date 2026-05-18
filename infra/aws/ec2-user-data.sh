#!/usr/bin/env bash
set -euo pipefail

apt-get update
apt-get install -y nftables nginx rsyslog docker.io docker-compose-plugin

install -m 0644 /opt/reconciliation/infra/nftables/reconciliation.nft /etc/nftables.conf
install -m 0644 /opt/reconciliation/infra/nftables/rsyslog-nftables.conf /etc/rsyslog.d/30-nftables-denied.conf

systemctl enable --now nftables
systemctl restart rsyslog
systemctl enable --now docker

cd /opt/reconciliation
docker compose -f docker-compose.yml -f docker-compose.platform.yml up -d postgres formance-ledger kafka rabbitmq api-manager
