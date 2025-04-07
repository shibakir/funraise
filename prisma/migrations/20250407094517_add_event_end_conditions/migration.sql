-- CreateTable
CREATE TABLE "EventEndCondition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventEndCondition_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EndCondition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "endConditionId" INTEGER NOT NULL,
    "parameterName" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EndCondition_endConditionId_fkey" FOREIGN KEY ("endConditionId") REFERENCES "EventEndCondition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
