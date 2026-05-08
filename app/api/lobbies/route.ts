import { NextResponse } from "next/server";

import { prisma } from "../../lib/prisma";

export async function GET() {
  const lobbies = await prisma.lobby.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(lobbies);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mode?: string;
    region?: string;
    micRequired?: boolean;
    maxPlayers?: number;
    note?: string;
  };

  const lobby = await prisma.lobby.create({
    data: {
      mode: body.mode?.trim() || "Ranked stack",
      region: body.region?.trim() || "TR/EU",
      micRequired: body.micRequired ?? true,
      maxPlayers: Math.max(2, Math.min(Number(body.maxPlayers) || 5, 5)),
      currentPlayers: 1,
      note: body.note?.trim() || "Looking for a clean session.",
      expiresAt: new Date(Date.now() + 45 * 60 * 1000)
    }
  });

  return NextResponse.json(lobby, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: number;
    action?: "join";
  };

  if (!body.id || body.action !== "join") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const lobby = await prisma.lobby.findUnique({ where: { id: body.id } });

  if (!lobby) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  const updatedLobby = await prisma.lobby.update({
    where: { id: body.id },
    data: {
      currentPlayers: Math.min(lobby.currentPlayers + 1, lobby.maxPlayers)
    }
  });

  return NextResponse.json(updatedLobby);
}
