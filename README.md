# JAADPOS

JAADPOS is an Arabic-first SaaS Online POS MVP for restaurants and cafes in Saudi Arabia.

## MVP Scope

- Multi-Tenant SaaS architecture.
- 14-day trial subscription.
- Starter, Growth, and Pro internal plans.
- Online POS interface.
- Basic electronic tax invoices with QR.
- 15% VAT calculations.
- Refund records without deleting original invoices.
- Shift opening and closing structure.
- VAT, sales, payments, refunds, cashier, invoices, and shift report surfaces.
- JAAD internal dashboard on the approved dash domain.

## Outside MVP

- Offline POS.
- No direct ZATCA Phase 2 integration in this MVP.
- No automatic invoice reporting to Fatoora in this MVP.
- OTP, CSID, CSR, XML signing, clearance, and reporting APIs.
- Native mobile app.
- Real payment gateway.

## Development

```bash
npm ci
npm run prisma:generate
npm run typecheck
npm run lint
npm run build
```

## Prisma

```bash
npm run prisma:dev
npm run prisma:migrate:deploy
npm run prisma:seed
```

Seed passwords are read from environment variables only. See `.env.example`.

## Demo Accounts

- Platform Owner: `admin@jaadpos.com`
- Tenant Owner: `owner@jaadpos.com`
- Cashier: `cashier@jaadpos.com`
- Accountant: `accountant@jaadpos.com`

Passwords should be set through seed environment variables and shared only in deployment reports.

## Domain Architecture

- Marketing: `NEXT_PUBLIC_MARKETING_URL`, normally `https://jaadsa.com`.
- Customer Console: `NEXT_PUBLIC_CONSOLE_URL`, normally `https://console.jaadsa.com`.
- JAAD Dashboard: `NEXT_PUBLIC_DASH_URL`, normally `https://dash.jaadsa.com`.
- Root domain: `APP_BASE_DOMAIN`, normally `jaadsa.com`.

## Deployment

See `docs/hostinger-deploy.md`.
