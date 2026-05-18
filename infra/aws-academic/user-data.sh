#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git nftables nginx rsyslog docker.io docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu

mkdir -p /opt/reconciliation
git clone "${repository_url}" /opt/reconciliation/app

cd /opt/reconciliation/app

cp apps/api/.env.example apps/api/.env
sed -i 's#DATABASE_URL=.*#DATABASE_URL=postgres://formance:formance@postgres:5432/reconciliation#' apps/api/.env
sed -i 's#FORMANCE_BASE_URL=.*#FORMANCE_BASE_URL=http://formance-ledger:3068#' apps/api/.env
sed -i 's#KAFKA_BROKERS=.*#KAFKA_BROKERS=kafka:9092#' apps/api/.env
sed -i 's#RABBITMQ_URL=.*#RABBITMQ_URL=amqp://reconciliation:reconciliation@rabbitmq:5672/reconciliation#' apps/api/.env

cat > /etc/nftables.conf <<'NFT'
flush ruleset
table inet reconciliation_filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif "lo" accept
    tcp dport { 22, 80, 443 } ct state new accept
    icmp type echo-request limit rate 5/second accept
    ip6 nexthdr ipv6-icmp accept
    log prefix "NFT_RECONCILIATION_DENY input " flags all counter drop
  }
  chain forward {
    type filter hook forward priority 0; policy accept;
  }
  chain output {
    type filter hook output priority 0; policy accept;
  }
}
NFT

cat > /etc/rsyslog.d/30-nftables-denied.conf <<'RSYSLOG'
:msg, contains, "NFT_RECONCILIATION_DENY" /var/log/nftables-denied.log
& stop
RSYSLOG

systemctl enable --now nftables
systemctl restart rsyslog

cat > /etc/nginx/sites-available/reconciliation.conf <<'NGINX'
server {
  listen 80 default_server;
  server_name _;

  location /api/ {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:8000;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:3000;
  }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/reconciliation.conf /etc/nginx/sites-enabled/reconciliation.conf
nginx -t
systemctl restart nginx

docker compose -f docker-compose.yml -f docker-compose.platform.yml up -d postgres formance-ledger kafka rabbitmq api-manager keycloak-db keycloak

docker run -d --name reconciliation-api --restart unless-stopped \
  --network app_default \
  --env-file /opt/reconciliation/app/apps/api/.env \
  -e PORT=3001 \
  -p 127.0.0.1:3001:3001 \
  -v /opt/reconciliation/app:/app \
  -w /app \
  node:22-alpine sh -c "npm ci && npm run build --workspace api && npm run start:prod --workspace api"

docker run -d --name reconciliation-web --restart unless-stopped \
  --network app_default \
  -e NEXT_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api \
  -p 127.0.0.1:3000:3000 \
  -v /opt/reconciliation/app:/app \
  -w /app \
  node:22-alpine sh -c "npm ci && npm run build --workspace web && npm run start --workspace web"
