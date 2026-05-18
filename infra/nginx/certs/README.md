# Local mTLS Certificates

Generate local-only certificates for Nginx mTLS:

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt -subj "/CN=reconciliation-local-ca"

openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=reconciliation.local"
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 825 -sha256

openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr -subj "/CN=ops-client"
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 825 -sha256
```

These files are ignored by git. Do not commit real private keys.
