#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git nftables nginx rsyslog docker.io

systemctl enable --now docker
usermod -aG docker ubuntu

mkdir -p /opt/reconciliation
git clone "https://github.com/Juanjose190/reconciliation-engine.git" /opt/reconciliation/app

cat > /etc/nftables.conf <<'NFT'
table inet reconciliation_filter {
  chain input {
    type filter hook input priority filter; policy drop;
    ct state established,related accept
    iif "lo" accept
    tcp dport { 22, 80, 443 } ct state new accept
    icmp type echo-request limit rate 5/second accept
    ip6 nexthdr ipv6-icmp accept
    log prefix "NFT_RECONCILIATION_DENY input " flags all counter drop
  }
  chain forward {
    type filter hook forward priority filter; policy accept;
  }
  chain output {
    type filter hook output priority filter; policy accept;
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
    proxy_pass http://127.0.0.1:3001/;
  }

  location / {
    return 200 'Reconciliation Engine academic EC2 demo. API health: /api/health\n';
    add_header Content-Type text/plain;
  }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/reconciliation.conf /etc/nginx/sites-enabled/reconciliation.conf
nginx -t
systemctl restart nginx

docker network create reconciliation || true
docker run -d --name reconciliation-postgres --restart unless-stopped \
  --network reconciliation \
  --network-alias postgres \
  -e POSTGRES_USER=formance \
  -e POSTGRES_PASSWORD=formance \
  -e POSTGRES_DB=reconciliation \
  postgres:16-alpine

cat > /opt/reconciliation/app/apps/api/.env <<'ENV'
PORT=3001
DATABASE_URL=postgres://formance:formance@postgres:5432/reconciliation
FORMANCE_BASE_URL=http://formance-ledger:3068
FAKE_CHAIN_SETTLEMENT_SECONDS=30
FAKE_CHAIN_FAILURE_RATE=0.1
FAKE_CHAIN_DRIFT_RATE=0.2
SEED_DEMO=true
AUTH_REQUIRED=false
KAFKA_BROKERS=
RABBITMQ_URL=
NOVU_API_KEY=
ENV

docker run --rm \
  -v /opt/reconciliation/app:/app \
  -w /app \
  node:22-alpine npm ci

docker run -d --name reconciliation-api --restart unless-stopped \
  --network reconciliation \
  --network-alias core \
  --env-file /opt/reconciliation/app/apps/api/.env \
  -e PORT=3001 \
  -p 127.0.0.1:3001:3001 \
  -v /opt/reconciliation/app:/app \
  -w /app \
  node:22-alpine sh -c "npm run build --workspace api && npm run start:prod --workspace api"
