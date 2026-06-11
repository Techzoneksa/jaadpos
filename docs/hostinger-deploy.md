# Hostinger Production Deploy

This checklist prepares JAADPOS for Hostinger production or staging deployment from GitHub.

## Repository

- Repository: `https://github.com/Techzoneksa/jaadpos.git`
- Branch: `main`
- Runtime: Node.js `>=20.9.0`
- Framework: Next.js standalone output

## Approved Domains

- Marketing Website: `https://jaadsa.com`
- Customer Console: `https://console.jaadsa.com`
- JAAD Dashboard: `https://dash.jaadsa.com`

No admin subdomain is used. The internal JAAD interface is served through `dash.jaadsa.com`.

## Environment Variables

Set these in Hostinger. Do not commit real secrets.

```env
NEXT_PUBLIC_MARKETING_URL=https://jaadsa.com
NEXT_PUBLIC_CONSOLE_URL=https://console.jaadsa.com
NEXT_PUBLIC_DASH_URL=https://dash.jaadsa.com
APP_BASE_DOMAIN=jaadsa.com
NODE_ENV=production

DATABASE_URL=
AUTH_SECRET=

SEED_PLATFORM_OWNER_PASSWORD=
SEED_OWNER_PASSWORD=
SEED_CASHIER_PASSWORD=
SEED_ACCOUNTANT_PASSWORD=
```

`AUTH_SECRET` must be a long random value. `DATABASE_URL` must be the Hostinger PostgreSQL connection string.

## Install And Build

Use `npm ci` on Hostinger because this repository includes `package-lock.json`.

```bash
npm ci
npm run prisma:generate
npm run build
```

## Start Command

```bash
npm run start
```

The start script binds Next.js to `0.0.0.0`, which is suitable for managed Node.js hosting.

## Database

Production deployments must use Prisma deploy migrations, not development migrations.

```bash
npm run prisma:migrate:deploy
```

To create demo data after the database is ready:

```bash
npm run prisma:seed
```

Seed passwords are read from environment variables only.

## Hostinger Steps

1. Create or open the Hostinger Node.js app.
2. Connect the app to `https://github.com/Techzoneksa/jaadpos.git`.
3. Select branch `main`.
4. Choose Node.js `20.9.0` or newer.
5. Add the environment variables above.
6. Provision PostgreSQL and paste its connection string into `DATABASE_URL`.
7. Run `npm ci`.
8. Run `npm run prisma:generate`.
9. Run `npm run prisma:migrate:deploy`.
10. Run `npm run prisma:seed` only when demo data is desired.
11. Run `npm run build`.
12. Start the app with `npm run start`.

## DNS

Point these domains and subdomains to the Hostinger application according to Hostinger's DNS instructions:

- `jaadsa.com`
- `console.jaadsa.com`
- `dash.jaadsa.com`

All redirects and CTA links are resolved through environment variables. No fixed development URL is required.

## Post-Deploy Verification

- Open `https://jaadsa.com` and verify the marketing page loads.
- Click `ابدأ التجربة المجانية` and verify it goes to `https://console.jaadsa.com/signup`.
- Click `تسجيل الدخول` and verify it goes to `https://console.jaadsa.com/login`.
- Open `https://console.jaadsa.com/login`.
- Open `https://console.jaadsa.com/signup`.
- Open `https://dash.jaadsa.com` and verify it routes to the JAAD internal dashboard.
- Verify customer console navigation does not show JAAD dashboard links.
- Verify `https://console.jaadsa.com/jaad` is blocked or redirected to the forbidden page.
- Log in with demo accounts if seed was run.
- Open POS and confirm a shift is required before sale.
- Create or review a demo order flow and inspect the basic QR invoice view.
- Open the VAT report and confirm it states that VAT filing is done through ZATCA by the business or accountant.
- Confirm invoices do not claim direct ZATCA Phase 2 reporting.

## Production Quality Commands

Run these before each deployment:

```bash
npm ci
npm run prisma:generate
npx prisma validate
npm run typecheck
npm run lint
npm run build
npm run check:production-urls
```
