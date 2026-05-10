import { prisma } from "./prisma";

export const DEMO_USER_EMAIL = "you@queue.local";

export async function getDemoUser() {
  return prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      games: {
        include: { game: true }
      },
      profile: true
    }
  });
}

export async function getDemoUserId() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true }
  });

  return user?.id ?? null;
}
