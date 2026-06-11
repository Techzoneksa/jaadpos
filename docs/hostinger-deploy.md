# Hostinger Deploy

JAADPOS is prepared for Hostinger Node.js hosting with Next.js standalone output and three approved domains.

## Approved Domains

- Marketing Website: `https://jaadsa.com`
- Customer Console: `https://console.jaadsa.com`
- JAAD Dashboard: `https://dash.jaadsa.com`

## Required Environment Variables

- `NEXT_PUBLIC_MARKETING_URL`: public marketing URL.
- `NEXT_PUBLIC_CONSOLE_URL`: customer console URL.
- `NEXT_PUBLIC_DASH_URL`: JAAD internal dashboard URL.
- `APP_BASE_DOMAIN`: root domain, `jaadsa.com`.
- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: long random secret used to sign secure sessions.
- `SEED_PLATFORM_OWNER_PASSWORD`: seed password for `platform@jaadpos.com`.
- `SEED_OWNER_PASSWORD`: seed password for `owner@jaadpos.com`.
- `SEED_CASHIER_PASSWORD`: seed password for `cashier@jaadpos.com`.
- `SEED_ACCOUNTANT_PASSWORD`: seed password for `accountant@jaadpos.com`.

## Build Commands

```bash
npm install
npm run prisma:generate
npm run build
```

## Database Commands

```bash
npm run prisma:migrate
npm run seed
```

## Start Command

```bash
npm run start
```

## Hostinger Steps

1. Push the repository to GitHub.
2. Create a Node.js application in Hostinger and connect it to the GitHub repository.
3. Attach `jaadsa.com`, `console.jaadsa.com`, and `dash.jaadsa.com` to the same Node.js app or equivalent Hostinger routing.
4. Add the environment variables above in Hostinger.
5. Provision PostgreSQL and set `DATABASE_URL`.
6. Run the install, Prisma generate, migration, seed, and build commands.
7. Start the app with `npm run start`.

The project does not use fixed development callback URLs. Marketing CTAs and auth redirects are resolved from the domain environment variables.
