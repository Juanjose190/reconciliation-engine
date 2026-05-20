# Demo Commands

## AWS / EC2

```bash
AWS_PROFILE=reconciliation-academic aws sts get-caller-identity
```

Verifica que el perfil de AWS esté autenticado.

```bash
AWS_PROFILE=reconciliation-academic aws ec2 describe-instances --region us-east-2 --instance-ids i-08116297f31fd4122
```

Muestra información de la instancia EC2 de la demo.

```bash
AWS_PROFILE=reconciliation-academic aws ec2 describe-instance-status --region us-east-2 --instance-ids i-08116297f31fd4122
```

Muestra el estado de salud de la instancia.

```bash
AWS_PROFILE=reconciliation-academic aws ec2 describe-security-groups --region us-east-2 --group-ids sg-09b84a0772def0d9a
```

Muestra las reglas del Security Group.

## Public Endpoints

```bash
curl http://18.118.163.195/
```

Prueba la página base servida por Nginx.

```bash
curl http://18.118.163.195/api/health
```

Prueba el endpoint público de salud de la API pasando por Nginx.

```bash
curl -i http://18.118.163.195/api/health
```

Prueba el health check mostrando headers HTTP.

## SSH

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@18.118.163.195
```

Entra por SSH a la instancia EC2.

```bash
exit
```

Sale de la sesión SSH.

## Docker

```bash
sudo docker ps
```

Lista los contenedores activos.

```bash
sudo docker ps -a
```

Lista todos los contenedores, activos y detenidos.

```bash
sudo docker logs --tail 40 reconciliation-api
```

Muestra los últimos logs del contenedor de la API.

```bash
sudo docker logs -f reconciliation-api
```

Sigue los logs de la API en tiempo real.

```bash
sudo docker restart reconciliation-api
```

Reinicia el contenedor de la API.

```bash
sudo docker restart reconciliation-postgres
```

Reinicia el contenedor de Postgres.

## API Local Inside EC2

```bash
curl http://localhost:3001/health
```

Prueba la API directamente desde dentro de la instancia.

```bash
curl http://127.0.0.1:3001/health
```

Prueba la API usando loopback.

## Nginx

```bash
sudo systemctl is-active nginx
```

Verifica si Nginx está activo.

```bash
sudo systemctl status nginx --no-pager
```

Muestra el estado detallado de Nginx.

```bash
sudo cat /etc/nginx/sites-enabled/reconciliation.conf
```

Muestra la configuración de Nginx para la demo.

```bash
sudo nginx -t
```

Valida la configuración de Nginx.

```bash
sudo systemctl restart nginx
```

Reinicia Nginx.

```bash
sudo tail -n 50 /var/log/nginx/access.log
```

Muestra los últimos accesos recibidos por Nginx.

```bash
sudo tail -n 50 /var/log/nginx/error.log
```

Muestra los últimos errores de Nginx.

## nftables

```bash
sudo systemctl is-active nftables
```

Verifica si nftables está activo.

```bash
sudo systemctl status nftables --no-pager
```

Muestra el estado detallado de nftables.

```bash
sudo nft list ruleset
```

Muestra todas las reglas activas de nftables.

```bash
sudo nft list table inet reconciliation_filter
```

Muestra solo la tabla personalizada del proyecto.

```bash
sudo tail -n 50 /var/log/nftables-denied.log
```

Muestra logs de paquetes denegados por nftables.

```bash
sudo systemctl restart nftables
```

Reinicia nftables.

## System Health

```bash
uptime
```

Muestra tiempo encendido y carga del sistema.

```bash
free -h
```

Muestra uso de memoria.

```bash
df -h
```

Muestra uso de disco.

```bash
docker stats
```

Muestra consumo de recursos de contenedores en tiempo real.

## Postgres Container

```bash
sudo docker exec -it reconciliation-postgres psql -U formance -d reconciliation
```

Entra a la consola de Postgres.

```sql
\dt
```

Lista tablas dentro de Postgres.

```sql
select * from tenants;
```

Consulta tenants guardados.

```sql
select * from users;
```

Consulta usuarios guardados.

```sql
select * from transaction_requests;
```

Consulta solicitudes de transacción.

```sql
select * from discrepancies;
```

Consulta discrepancias.

```sql
\q
```

Sale de la consola de Postgres.

## Local Project

```bash
git pull
```

Trae los últimos cambios del repositorio.

```bash
npm run build --workspace api
```

Compila el backend.

```bash
npm run lint --workspace api
```

Ejecuta lint del backend.

```bash
npm run build --workspace web
```

Compila el frontend.

```bash
npm run lint --workspace web
```

Ejecuta typecheck del frontend.

```bash
docker compose up -d postgres formance-ledger
```

Levanta Postgres y Formance localmente.

```bash
docker compose -f docker-compose.yml -f docker-compose.platform.yml up -d postgres formance-ledger kafka rabbitmq keycloak-db keycloak api-manager
```

Levanta la plataforma local completa.

```bash
npm run dev --workspace api
```

Levanta el backend local.

```bash
npm run dev --workspace web
```

Levanta el frontend local.

## Cleanup AWS

```bash
AWS_PROFILE=reconciliation-academic aws ec2 terminate-instances --region us-east-2 --instance-ids i-08116297f31fd4122
```

Termina la instancia EC2 para evitar costos.

```bash
AWS_PROFILE=reconciliation-academic aws ec2 describe-instances --region us-east-2 --instance-ids i-08116297f31fd4122 --query 'Reservations[0].Instances[0].State.Name' --output text
```

Verifica si la instancia está `running`, `shutting-down` o `terminated`.
