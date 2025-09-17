-- Add SSO fields to User table
ALTER TABLE "User" ADD COLUMN "auth0Id" TEXT;
ALTER TABLE "User" ADD COLUMN "ssoProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "ssoMetadata" JSONB;

-- Create unique index for auth0Id
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");
