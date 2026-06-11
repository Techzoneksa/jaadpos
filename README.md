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
- Platform Admin dashboard.

## Outside MVP

- Offline POS.
- Direct ZATCA Phase 2 integration.
- Automatic invoice reporting to Fatoora.
- OTP, CSID, CSR, XML signing, clearance, and reporting APIs.
- Native mobile app.
- Real payment gateway.

## Development

```bash
npm install
npm run prisma:generate
npm run typecheck
npm run lint
npm run build
```

## Prisma

```bash
npm run prisma:dev
npm run seed
```

Seed passwords are read from environment variables only. See `.env.example`.

## Demo Accounts

- Platform Admin: `admin@jaadpos.com`
- Tenant Owner: `owner@jaadpos.com`
- Cashier: `cashier@jaadpos.com`
- Accountant: `accountant@jaadpos.com`

Passwords should be set through seed environment variables and shared only in deployment reports.

## Deployment

See `docs/hostinger-deploy.md`.
