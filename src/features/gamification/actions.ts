"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import { XP_RULES } from "@/lib/domain/gamification";
import { awardXp } from "@/features/gamification/service";

export async function claimChallengeAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const challengeId = formData.get("challengeId")?.toString();
  if (!challengeId) return;

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, rewardXp: true, rewardCoins: true, status: true },
  });
  if (!challenge || challenge.status !== "ACTIVE") return;

  const userChallenge = await prisma.userChallenge.findFirst({
    where: { userId: user.id, challengeId },
    select: { id: true, progress: true, claimed: true, challenge: { select: { target: true } } },
  });
  if (!userChallenge || userChallenge.claimed || userChallenge.progress < userChallenge.challenge.target) return;

  await prisma.$transaction(async (tx) => {
    await tx.userChallenge.update({
      where: { id: userChallenge.id },
      data: { claimed: true },
    });
    await awardXp({
      userId: user.id,
      xp: challenge.rewardXp,
      source: "CHALLENGE",
      sourceId: challengeId,
      note: "Claimed challenge reward",
      tx,
    });
  });

  revalidatePath("/gamification");
  revalidatePath("/dashboard");
}
