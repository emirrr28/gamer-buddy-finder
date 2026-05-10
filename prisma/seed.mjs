import { PrismaClient } from "@prisma/client";
import { existsSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const prisma = new PrismaClient();
const now = new Date();

if (existsSync("prisma/dev.db")) {
  rmSync("prisma/dev.db");
}

const database = new DatabaseSync("prisma/dev.db");

database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    displayName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    region TEXT NOT NULL,
    languages TEXT NOT NULL,
    platforms TEXT NOT NULL,
    playStyles TEXT NOT NULL,
    voicePreference TEXT NOT NULL,
    availabilityWindow TEXT NOT NULL,
    rankLabel TEXT NOT NULL,
    isVisible BOOLEAN NOT NULL DEFAULT true,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS UserGame (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    gameId INTEGER NOT NULL,
    rank TEXT,
    isPrimary BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (gameId) REFERENCES Game(id) ON DELETE CASCADE,
    UNIQUE(userId, gameId)
  );

  CREATE TABLE IF NOT EXISTS Swipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromUserId INTEGER NOT NULL,
    toUserId INTEGER NOT NULL,
    decision TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fromUserId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (toUserId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(fromUserId, toUserId)
  );

  CREATE TABLE IF NOT EXISTS Match (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userAId INTEGER NOT NULL,
    userBId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userAId, userBId)
  );

  CREATE TABLE IF NOT EXISTS Message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchId INTEGER NOT NULL,
    senderId INTEGER NOT NULL,
    text TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matchId) REFERENCES Match(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Lobby (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER,
    mode TEXT NOT NULL,
    region TEXT NOT NULL,
    micRequired BOOLEAN NOT NULL DEFAULT true,
    maxPlayers INTEGER NOT NULL,
    currentPlayers INTEGER NOT NULL DEFAULT 1,
    note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    closedAt DATETIME,
    successfulAt DATETIME,
    FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS LobbyMember (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lobbyId INTEGER NOT NULL,
    userId INTEGER,
    label TEXT NOT NULL,
    joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lobbyId) REFERENCES Lobby(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
    UNIQUE(lobbyId, userId)
  );

  CREATE TABLE IF NOT EXISTS Report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporterUserId INTEGER NOT NULL,
    reportedUserId INTEGER NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporterUserId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (reportedUserId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Block (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blockerUserId INTEGER NOT NULL,
    blockedUserId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blockerUserId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (blockedUserId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(blockerUserId, blockedUserId)
  );
`);

database.close();

await prisma.message.deleteMany();
await prisma.match.deleteMany();
await prisma.swipe.deleteMany();
await prisma.report.deleteMany();
await prisma.block.deleteMany();
await prisma.lobbyMember.deleteMany();
await prisma.lobby.deleteMany();
await prisma.userGame.deleteMany();
await prisma.game.deleteMany();
await prisma.profile.deleteMany();
await prisma.user.deleteMany();

const games = await Promise.all(
  [
    ["CS2", "cs2"],
    ["Valorant", "valorant"],
    ["Helldivers 2", "helldivers-2"],
    ["League", "league"],
    ["Apex", "apex"]
  ].map(([name, slug]) => prisma.game.create({ data: { name, slug } }))
);

const [you, mira, deniz, selin] = await Promise.all([
  prisma.user.create({
    data: {
      email: "you@queue.local",
      displayName: "You",
      profile: {
        create: {
          bio: "Competitive but calm. Looking for clean sessions.",
          region: "TR/EU",
          languages: "TR,EN",
          platforms: "PC,Steam,Discord",
          playStyles: "Competitive,Ranked,Late night",
          voicePreference: "Mic on",
          availabilityWindow: "20:00 - 00:00",
          rankLabel: "Gold Nova - MG"
        }
      }
    }
  }),
  prisma.user.create({
    data: {
      email: "mira@queue.local",
      displayName: "Mira",
      profile: {
        create: {
          bio: "Calm shotcaller, short comms, no round-three tilt.",
          region: "TR/EU",
          languages: "TR,EN",
          platforms: "PC,Riot,Discord",
          playStyles: "Competitive,Ranked,Late night",
          voicePreference: "Mic on",
          availabilityWindow: "20:00 - 00:00",
          rankLabel: "Ascendant II"
        }
      }
    }
  }),
  prisma.user.create({
    data: {
      email: "deniz@queue.local",
      displayName: "Deniz",
      profile: {
        create: {
          bio: "Objective first. Wants people who can lose without making it weird.",
          region: "TR/EU",
          languages: "TR,EN",
          platforms: "PC,Steam,Discord",
          playStyles: "Competitive,Co-op,Ranked",
          voicePreference: "Mic on",
          availabilityWindow: "20:00 - 00:00",
          rankLabel: "Faceit 7"
        }
      }
    }
  }),
  prisma.user.create({
    data: {
      email: "selin@queue.local",
      displayName: "Selin",
      profile: {
        create: {
          bio: "Chill competitive. Ranked on weeknights, cozy servers later.",
          region: "TR",
          languages: "TR",
          platforms: "PC,Riot",
          playStyles: "Casual,Ranked,Co-op",
          voicePreference: "Text first",
          availabilityWindow: "18:00 - 22:00",
          rankLabel: "Emerald IV"
        }
      }
    }
  })
]);

await prisma.userGame.createMany({
  data: [
    { userId: you.id, gameId: games[0].id, rank: "Gold Nova - MG", isPrimary: true },
    { userId: you.id, gameId: games[1].id, rank: "Diamond", isPrimary: false },
    { userId: mira.id, gameId: games[1].id, rank: "Ascendant II", isPrimary: true },
    { userId: deniz.id, gameId: games[0].id, rank: "Faceit 7", isPrimary: true },
    { userId: deniz.id, gameId: games[2].id, rank: "Any", isPrimary: false },
    { userId: selin.id, gameId: games[3].id, rank: "Emerald IV", isPrimary: true }
  ]
});

const lobbySeeds = [
  {
    ownerId: deniz.id,
    mode: "CS2 Premier",
    region: "TR/EU",
    micRequired: true,
    maxPlayers: 5,
    currentPlayers: 3,
    note: "Clean five-stack, calm comms, no tilt.",
    expiresAt: new Date(now.getTime() + 45 * 60 * 1000),
    members: ["Deniz", "Mira", "Ece"]
  },
  {
    ownerId: mira.id,
    mode: "Valorant Ranked",
    region: "EU West",
    micRequired: true,
    maxPlayers: 5,
    currentPlayers: 4,
    note: "Need one flex player for late queue.",
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    members: ["Mira", "Noah", "Kai", "Jules"]
  },
  {
    ownerId: selin.id,
    mode: "Helldivers 2 Co-op",
    region: "TR",
    micRequired: false,
    maxPlayers: 4,
    currentPlayers: 2,
    note: "Quick mission run, text first is fine.",
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    members: ["Selin", "Can"]
  }
];

for (const lobbySeed of lobbySeeds) {
  const { members, ...data } = lobbySeed;
  const lobby = await prisma.lobby.create({ data });

  await prisma.lobbyMember.createMany({
    data: members.map((label, index) => ({
      lobbyId: lobby.id,
      userId: index === 0 ? lobbySeed.ownerId : null,
      label
    }))
  });
}

await prisma.swipe.create({
  data: {
    fromUserId: mira.id,
    toUserId: you.id,
    decision: "LIKE"
  }
});

const match = await prisma.match.create({
  data: {
    userAId: you.id,
    userBId: mira.id
  }
});

await prisma.message.createMany({
  data: [
    {
      matchId: match.id,
      senderId: mira.id,
      text: "I am queueing later tonight. Want to lock a game first?"
    },
    {
      matchId: match.id,
      senderId: you.id,
      text: "Works for me. Let's pick the least chaotic option."
    }
  ]
});

await prisma.$disconnect();
