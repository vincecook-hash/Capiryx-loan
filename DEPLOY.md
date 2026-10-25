# Deploying Capiryx

One Next.js project: landing page, applicant dashboard, admin dashboard, and API.

## 1. Put it in your repo
Copy this folder's contents to the root of your repo (`package.json` at the top level) and push. `.env` is git-ignored, so secrets never get committed.

## 2. Set up Supabase (database and ID storage)
1. **Database:** in your project, open Project Settings > Database > Connection string. Copy the **Transaction pooler** string (port 6543) into `DATABASE_URL`, adding `?pgbouncer=true&connection_limit=1` at the end. Copy the **Session/Direct** string (port 5432) into `DIRECT_URL`. Replace `[YOUR-PASSWORD]` in both.
2. **Storage bucket:** Storage > New bucket, name it `id-documents`, leave **Public bucket off**, set the file size limit to 5 MB and allowed types to `image/jpeg, image/png, application/pdf`.
3. **S3 keys:** Project Settings > Storage > S3 Connection. Copy the endpoint, region, and create an access key pair into `S3_ENDPOINT`, `S3_REGION`, `S3_KEY`, `S3_SECRET`. These keys are server-only; never put them in a `NEXT_PUBLIC_` variable.
4. **Lock down the tables:** after step 3 below, run `supabase.sql` in the SQL Editor so Supabase's public API cannot read your tables.
5. **Other services:** Resend (email), Twilio or a regional gateway (SMS), and Persona (identity checks, webhook to `https://YOUR-DOMAIN/api/kyc/webhook`).

## 3. Create the database tables (once, from your computer)
```
npm install
cp .env.example .env     # fill in DATABASE_URL at least
npx prisma migrate dev --name init
```
This uses `DIRECT_URL` to create the tables in Supabase.
Commit the generated `prisma/migrations/` folder. On later schema changes, run `npm run migrate` against production.

## 4. Deploy (Vercel shown; Railway, Render, or Fly also work)
1. Import the repo in Vercel (framework: Next.js, nothing else to set).
2. Add every variable from `.env.example` in Project Settings, Environment Variables. Set `APP_URL` to your live domain.
3. Deploy, then add your domain.

## 5. Create your admin login (from your computer, with production `DATABASE_URL`)
```
ADMIN_EMAIL=you@yourdomain.com ADMIN_PASSWORD='a-long-passphrase-14+' npm run create-admin
```
Scan the printed `otpauth://` link into an authenticator app, then sign in at `/admin/login`.

## 6. Before taking real applications
- Fill in `NEXT_PUBLIC_LEGAL_ENTITY` and `NEXT_PUBLIC_CONTACT_EMAIL` with real, true details (registered name, number, country, licences). Do not claim a licence or affiliation you do not hold.
- Have a lawyer replace the draft Terms and Privacy pages and confirm which lending and payment licences each country requires.
- Sign agreements with your licensed lender or escrow partner. They move the money; this app records it.
- Test the full flow with test accounts: sign-up, password reset, application, offer, KYC, acceptance, disbursement, review moderation.
- Replace the in-memory limiter in `middleware.ts` with Upstash Redis (serverless instances do not share memory).
- Turn on database backups and error monitoring.
