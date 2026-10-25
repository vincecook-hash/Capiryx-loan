-- Run in Supabase: SQL Editor, AFTER `npx prisma migrate deploy`.
-- The app reaches the database only through server-side Prisma. Turning on Row Level Security
-- with no policies blocks Supabase's public API from reading these tables with the anon key.
alter table "User"        enable row level security;
alter table "OtpCode"     enable row level security;
alter table "Application" enable row level security;
alter table "Offer"       enable row level security;
alter table "BankAccount" enable row level security;
alter table "Review"      enable row level security;
alter table "AuditLog"    enable row level security;
alter table "_prisma_migrations" enable row level security;
