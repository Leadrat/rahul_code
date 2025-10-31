CREATE TABLE IF NOT EXISTS "Games" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Name" TEXT,
    "Players" TEXT[],
    "HumanPlayer" TEXT,
    "Moves" JSONB,
    "Winner" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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
