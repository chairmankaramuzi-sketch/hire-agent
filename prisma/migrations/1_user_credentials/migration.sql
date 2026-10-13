-- Adds real login credentials to application users
ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "job_title" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "app_user_username_key" ON "app_user"("username");
