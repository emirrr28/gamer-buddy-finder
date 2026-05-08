import { PrismaClient } from "@prisma/client";
import { DatabaseSync } from "node:sqlite";

const prisma = new PrismaClient();

const now = new Date();
const database = new DatabaseSync("prisma/dev.db");

database.exec(`
  CREATE TABLE IF NOT EXISTS Lobby (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    region TEXT NOT NULL,
    micRequired BOOLEAN NOT NULL DEFAULT true,
    maxPlayers INTEGER NOT NULL,
    currentPlayers INTEGER NOT NULL DEFAULT 1,
    note TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL
  );
`);

database.close();

const lobbies = [
  {
    mode: "CS2 Premier",
    region: "TR/EU",
    micRequired: true,
    maxPlayers: 5,
    currentPlayers: 3,
    note: "Clean five-stack, calm comms, no tilt.",
    expiresAt: new Date(now.getTime() + 45 * 60 * 1000)
  },
  {
    mode: "Valorant Ranked",
    region: "EU West",
    micRequired: true,
    maxPlayers: 5,
    currentPlayers: 4,
    note: "Need one flex player for late queue.",
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000)
  },
  {
    mode: "Helldivers 2 Co-op",
    region: "TR",
    micRequired: false,
    maxPlayers: 4,
    currentPlayers: 2,
    note: "Quick mission run, text first is fine.",
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000)
  }
];

await prisma.lobby.deleteMany();
await prisma.lobby.createMany({ data: lobbies });
await prisma.$disconnect();
