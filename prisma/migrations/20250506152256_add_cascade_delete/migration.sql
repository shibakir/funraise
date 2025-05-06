-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "activationLink" TEXT
);
INSERT INTO "new_User" ("activationLink", "createdAt", "email", "id", "image", "isActivated", "password", "updatedAt", "username") SELECT "activationLink", "createdAt", "email", "id", "image", "isActivated", "password", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_UserAchievement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "unlockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserAchievement" ("achievementId", "createdAt", "id", "status", "unlockedAt", "updatedAt", "userId") SELECT "achievementId", "createdAt", "id", "status", "unlockedAt", "updatedAt", "userId" FROM "UserAchievement";
DROP TABLE "UserAchievement";
ALTER TABLE "new_UserAchievement" RENAME TO "UserAchievement";
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE TABLE "new_UserCriterionProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userAchievementId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCriterionProgress_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AchievementCriterion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCriterionProgress_userAchievementId_fkey" FOREIGN KEY ("userAchievementId") REFERENCES "UserAchievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserCriterionProgress" ("completedAt", "createdAt", "criterionId", "currentValue", "id", "isCompleted", "updatedAt", "userAchievementId") SELECT "completedAt", "createdAt", "criterionId", "currentValue", "id", "isCompleted", "updatedAt", "userAchievementId" FROM "UserCriterionProgress";
DROP TABLE "UserCriterionProgress";
ALTER TABLE "new_UserCriterionProgress" RENAME TO "UserCriterionProgress";
CREATE UNIQUE INDEX "UserCriterionProgress_userAchievementId_criterionId_key" ON "UserCriterionProgress"("userAchievementId", "criterionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
