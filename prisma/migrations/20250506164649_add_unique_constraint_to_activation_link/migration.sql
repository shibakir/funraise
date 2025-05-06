/*
  Warnings:

  - A unique constraint covering the columns `[activationLink]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_activationLink_key" ON "User"("activationLink");
