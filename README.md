# Formance Reconciliation Engine

Multi-tenant reconciliation engine using NestJS, TypeORM, PostgreSQL, NextJS, and Formance Ledger v2.

## Local Run

```bash
docker compose up -d postgres formance-ledger
npm install
cp apps/api/.env.example apps/api/.env
npm run dev --workspace api
npm run dev --workspace web
```

API: `http://localhost:3001`

Web: `http://localhost:3000`

Development requests use `X-Tenant-Id`. Seed data is created by the API bootstrap when `SEED_DEMO=true`.

The Docker Postgres service is exposed on local port `55432` to avoid conflicts with an existing Postgres running on `5432`.

## Troubleshooting

If the API logs `role "formance" does not exist`, it is connecting to a Postgres instance that was not created by this Compose file. Run:

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres formance-ledger
npm run dev --workspace api
```

For an old local Compose volume with the wrong credentials, reset only the dev database volume:

```bash
docker compose down -v
docker compose up -d postgres formance-ledger
```

If you intentionally want to use your own local Postgres, update `DATABASE_URL` in `apps/api/.env` to match that database user, password, host, port, and database name.

## Useful Commands

```bash
npm run build
npm run lint
```

## Manual Verification

1. Start Postgres and Formance with Docker Compose.
2. Start the API and web apps.
3. Open the dashboard and confirm demo alerts/balances load.
4. Create deposits and withdrawals through the API.
5. Force fake blockchain settlement using `/fake-blockchain/transactions/:id/settle`.
6. Run `/reconciliation/run`.
7. Review `/reconciliation/alerts`.
8. Book a correction from an alert detail.
