-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMMANDER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commanderAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
