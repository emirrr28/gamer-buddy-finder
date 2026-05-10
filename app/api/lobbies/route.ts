import { NextResponse } from "next/server";

import { getDemoUserId } from "../../lib/demo-user";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const lobbies = await prisma.lobby.findMany({
    where: {
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      members: {
        orderBy: { joinedAt: "asc" }
      },
      owner: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(lobbies);
}

export async function POST(request: Request) {
  const demoUserId = await getDemoUserId();

  if (!demoUserId) {
    return NextResponse.json({ error: "Demo kullanici bulunamadi." }, { status: 500 });
  }

  const body = (await request.json()) as {
    mode?: string;
    region?: string;
    micRequired?: boolean;
    maxPlayers?: number;
    note?: string;
  };

  const lobby = await prisma.lobby.create({
    data: {
      ownerId: demoUserId,
      mode: body.mode?.trim() || "Ranked stack",
      region: body.region?.trim() || "TR/EU",
      micRequired: body.micRequired ?? true,
      maxPlayers: Math.max(2, Math.min(Number(body.maxPlayers) || 5, 5)),
      currentPlayers: 1,
      note: body.note?.trim() || "Looking for a clean session.",
      expiresAt: new Date(Date.now() + 45 * 60 * 1000),
      members: {
        create: {
          userId: demoUserId,
          label: "You"
        }
      }
    },
    include: {
      members: {
        orderBy: { joinedAt: "asc" }
      },
      owner: true
    }
  });

  return NextResponse.json(lobby, { status: 201 });
}

export async function PATCH(request: Request) {
  const demoUserId = await getDemoUserId();

  if (!demoUserId) {
    return NextResponse.json({ error: "Demo kullanici bulunamadi." }, { status: 500 });
  }

  const body = (await request.json()) as {
    id?: number;
    action?: "join";
  };

  if (!body.id || body.action !== "join") {
    return NextResponse.json({ error: "Gecersiz lobi istegi." }, { status: 400 });
  }

  const lobby = await prisma.lobby.findUnique({
    where: { id: body.id },
    include: { members: true }
  });

  if (!lobby) {
    return NextResponse.json({ error: "Lobi bulunamadi." }, { status: 404 });
  }

  if (lobby.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Bu lobinin suresi doldu." }, { status: 410 });
  }

  if (lobby.currentPlayers >= lobby.maxPlayers) {
    return NextResponse.json({ error: "Bu lobi dolu." }, { status: 409 });
  }

  const alreadyJoined = lobby.members.some((member) => member.userId === demoUserId);

  if (alreadyJoined) {
    return NextResponse.json({ error: "Bu lobiye zaten katildin." }, { status: 409 });
  }

  const updatedLobby = await prisma.$transaction(async (tx) => {
    await tx.lobbyMember.create({
      data: {
        lobbyId: lobby.id,
        userId: demoUserId,
        label: "You"
      }
    });

    return tx.lobby.update({
      where: { id: body.id },
      data: {
        currentPlayers: lobby.currentPlayers + 1
      },
      include: {
        members: {
          orderBy: { joinedAt: "asc" }
        },
        owner: true
      }
    });
  });

  return NextResponse.json(updatedLobby);
}
