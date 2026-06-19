-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('verify', 'reset');

-- AlterTable
ALTER TABLE "EmailOtp" ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'verify';
