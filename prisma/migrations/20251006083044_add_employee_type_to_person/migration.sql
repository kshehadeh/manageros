-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'CONSULTANT');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "employeeType" "EmployeeType";
