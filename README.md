# Pest control site and job reports

One Next.js app with three areas:

| Route     | Who       | What                                                                            |
| --------- | --------- | ------------------------------------------------------------------------------- |
| `/`       | Public    | Landing page and enquiry form (emails the business, also saved to the database) |
| `/portal` | Customers | Their own finalised job reports, with photos                                    |
| `/admin`  | You       | Create jobs, fill in the form with photos, finalise, reopen                     |

Stack: Next.js, TypeScript, Tailwind v4, Prisma, Postgres (Neon), Better Auth (magic links), Vercel Blob (private store), Resend.

## First-time setup

1. **Install:** `npm install`
2. **Create the Vercel project** and link it: `npx vercel link`
3. **Add a database:** Vercel dashboard → Storage → add **Neon** from the Marketplace and connect it to the project.
4. **Add photo storage:** Storage → Create → **Blob**, choose **Private** access, connect it to the project.
5. **Pull the env vars into `.env`** (Prisma reads `.env`, not `.env.local`):
   `npx vercel env pull .env`
6. **Add the remaining variables** from `.env.example` to `.env` (and to Vercel → Settings → Environment Variables):
   `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `BUSINESS_EMAIL`, `ADMIN_EMAIL`.
7. **Create the tables:** `npx prisma migrate dev --name init`
8. **Create your admin account:** `npm run db:seed`
9. **Run it:** `npm run dev`, go to `/login` and enter your `ADMIN_EMAIL`.
   With `RESEND_API_KEY` left empty, emails (including sign-in links) print to the terminal.

## Deploying

Push to GitHub and import the repo in Vercel (or `npx vercel --prod`). The build runs
`prisma migrate deploy`, so new migrations apply automatically.
In production set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your real domain, and
verify that domain in Resend so emails can go to any address.

## Changing the job form

Everything lives in `src/lib/job-form.ts`. Add sections and fields there; `photos: true`
gives a field photo uploads and `internal: true` hides it from the customer report.
Answers are stored by `key`, so don't rename keys once real jobs use them.

## How access control works

- Customers can only sign in if you've created a job with their email (`disableSignUp`).
- Every protected page and server action calls `requireUser()` / `requireAdmin()`.
  Layouts aren't enough on their own because they don't re-run on every navigation.
- Customer queries always filter by `customerId` **and** `status: FINALISED`.
- Photos live in a private Blob store and are only served through `/api/photos/[id]`,
  which repeats the same ownership check. Uploads are admin-only and limited to the job's folder.

## Not built yet

- Cloudflare Turnstile on the enquiry form (a honeypot field is in place)
- PDF export of a report (`@react-pdf/renderer`)
- Deleting jobs, editing customer details, admin enquiry inbox
- Error monitoring (Sentry) and scheduled database backups
