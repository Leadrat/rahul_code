-- Create the Invites table for the game backend
-- Execute this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS "Invites" (
    "Id" SERIAL PRIMARY KEY,
    "FromUserId" INTEGER NOT NULL,
    "ToEmail" TEXT NOT NULL,
    "GameId" INTEGER,
    "Status" TEXT NOT NULL DEFAULT 'pending',
    "Message" TEXT,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Invites_FromUserId" ON "Invites"("FromUserId");
CREATE INDEX IF NOT EXISTS "IX_Invites_ToEmail" ON "Invites"("ToEmail");
CREATE INDEX IF NOT EXISTS "IX_Invites_Status" ON "Invites"("Status");
