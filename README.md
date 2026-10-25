# Capiryx backend (Phase 2a)

Next.js 14 (App Router) + Prisma + PostgreSQL.

See DEPLOY.md for setup and deployment.

## Rules baked into the code
- No endpoint takes a fee, crypto, or gift card from applicants. Any lender fee is a disclosed field on the Offer, deducted from proceeds.
- Bank details are collected only when an applicant accepts an offer, and only after identity verification. The account must be in the applicant's own name.
- Admin login needs password + TOTP, a 2-hour session, lockout after 3 failures. Every admin action, including viewing an ID or bank details, is written to AuditLog.
- Reviews are public only when APPROVED, and only funded users can submit.
- Auth responses never reveal whether an account exists. State-changing API calls check Origin.

## Before real launch
Legal review per country (lending and money-transmission licences, data protection), a security test, backups, monitoring, and a public contact page. Cuba stays disabled until you have legal advice on sanctions.
