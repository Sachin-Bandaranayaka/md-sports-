/*
  Warnings:

  - You are about to drop the column `cost` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `Shop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_PermissionToRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[manager_id]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_PermissionToRole` will be added. If there are existing duplicate values, this will fail.
  - Made the column `location` on table `Shop` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_shopId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryTransfer" DROP CONSTRAINT "InventoryTransfer_fromShopId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryTransfer" DROP CONSTRAINT "InventoryTransfer_toShopId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_shopId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_shopId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "contactPersonPhone" TEXT,
ADD COLUMN     "creditLimit" DOUBLE PRECISION,
ADD COLUMN     "creditPeriod" INTEGER,
ADD COLUMN     "customerType" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "shopspecificcost" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "shopId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "InventoryTransfer" ALTER COLUMN "fromShopId" SET DATA TYPE TEXT,
ALTER COLUMN "toShopId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "invoiceDate" DATE,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'Cash',
ADD COLUMN     "profitMargin" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "shopId" TEXT,
ADD COLUMN     "totalProfit" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "costPrice" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "profit" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "cost",
ADD COLUMN     "weightedaveragecost" DOUBLE PRECISION,
ALTER COLUMN "shopId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN     "date" DATE,
ADD COLUMN     "distributions" JSONB,
ADD COLUMN     "dueDate" DATE;

-- AlterTable
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_pkey",
ADD COLUMN     "address_line1" TEXT,
ADD COLUMN     "address_line2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "closing_time" TIME,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Malaysia',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DECIMAL(65,30),
ADD COLUMN     "longitude" DECIMAL(65,30),
ADD COLUMN     "manager_id" INTEGER,
ADD COLUMN     "opening_date" DATE,
ADD COLUMN     "opening_time" TIME,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "tax_rate" DECIMAL(65,30) DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "location" SET NOT NULL,
ADD CONSTRAINT "Shop_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Shop_id_seq";

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "roleName" TEXT,
ALTER COLUMN "roleId" DROP NOT NULL,
ALTER COLUMN "shopId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_AB_pkey";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" DATE NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "chequeNumber" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "confirmedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "toAccountId" INTEGER,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "transaction_toAccountId_idx" ON "Transaction"("toAccountId");

-- CreateIndex
CREATE INDEX "transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_paymentMethod_idx" ON "Invoice"("paymentMethod");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_shopId_idx" ON "Invoice"("shopId");

-- CreateIndex
CREATE INDEX "Invoice_status_createdAt_idx" ON "Invoice"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_paymentMethod_createdAt_idx" ON "Invoice"("paymentMethod", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_status_paymentMethod_createdAt_idx" ON "Invoice"("status", "paymentMethod", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_updatedAt_status_idx" ON "Invoice"("updatedAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_manager_id_key" ON "Shop"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromShopId_fkey" FOREIGN KEY ("fromShopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toShopId_fkey" FOREIGN KEY ("toShopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
