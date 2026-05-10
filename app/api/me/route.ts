import { NextResponse } from "next/server";

import { getDemoUser } from "../../lib/demo-user";
import { prisma } from "../../lib/prisma";

type PreferencesBody = {
  games?: string[];
  platforms?: string[];
  styles?: string[];
  voice?: string[];
  hours?: string[];
};

export async function GET() {
  const user = await getDemoUser();

  if (!user || !user.profile) {
    return NextResponse.json({ error: "Demo kullanici bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    displayName: user.displayName,
    preferences: {
      games: user.games.map((entry) => entry.game.name),
      platforms: splitList(user.profile.platforms),
      styles: splitList(user.profile.playStyles),
      voice: [user.profile.voicePreference],
      hours: [user.profile.availabilityWindow]
    }
  });
}

export async function PATCH(request: Request) {
  const user = await getDemoUser();

  if (!user || !user.profile) {
    return NextResponse.json({ error: "Demo kullanici bulunamadi." }, { status: 404 });
  }

  const body = (await request.json()) as PreferencesBody;
  const games = cleanList(body.games);
  const platforms = cleanList(body.platforms, splitList(user.profile.platforms));
  const styles = cleanList(body.styles, splitList(user.profile.playStyles));
  const voice = cleanList(body.voice, [user.profile.voicePreference]);
  const hours = cleanList(body.hours, [user.profile.availabilityWindow]);

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      platforms: platforms.join(","),
      playStyles: styles.join(","),
      voicePreference: voice[0],
      availabilityWindow: hours[0]
    }
  });

  if (games.length > 0) {
    await prisma.userGame.deleteMany({ where: { userId: user.id } });

    for (let index = 0; index < games.length; index += 1) {
      const name = games[index];
      const game = await prisma.game.upsert({
        where: { slug: toSlug(name) },
        update: { name },
        create: {
          name,
          slug: toSlug(name)
        }
      });

      await prisma.userGame.create({
        data: {
          userId: user.id,
          gameId: game.id,
          isPrimary: index === 0
        }
      });
    }
  }

  const refreshed = await getDemoUser();

  return NextResponse.json({
    id: refreshed?.id,
    displayName: refreshed?.displayName,
    preferences: {
      games: refreshed?.games.map((entry) => entry.game.name) ?? [],
      platforms: refreshed?.profile ? splitList(refreshed.profile.platforms) : platforms,
      styles: refreshed?.profile ? splitList(refreshed.profile.playStyles) : styles,
      voice: refreshed?.profile ? [refreshed.profile.voicePreference] : voice,
      hours: refreshed?.profile ? [refreshed.profile.availabilityWindow] : hours
    }
  });
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanList(value: string[] | undefined, fallback: string[] = []) {
  const cleaned = Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean)));
  return cleaned.length > 0 ? cleaned : fallback;
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
