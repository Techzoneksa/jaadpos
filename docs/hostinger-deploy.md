# Hostinger Deploy

JAADPOS is prepared for Hostinger Node.js hosting with Next.js standalone output.

## Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET`: long random secret used to sign secure sessions.
- `NEXT_PUBLIC_APP_URL`: production application URL, for example `https://your-domain.com`.
- `SEED_ADMIN_PASSWORD`: seed password for `admin@jaadpos.com`.
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
3. Add the environment variables above in Hostinger.
4. Provision PostgreSQL and set `DATABASE_URL`.
5. Run the install, Prisma generate, migration, seed, and build commands.
6. Start the app with `npm run start`.

The project does not use fixed development callback URLs. Public URLs must be read from `NEXT_PUBLIC_APP_URL`.
