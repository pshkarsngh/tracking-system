import { prisma } from "@/lib/db";
import { xpIntoLevel, xpForLevelUp, levelTitle, levelProgress } from "@/lib/domain/gamification";
import type { GamificationData } from "./types";

export type { GamificationData, XpHistoryEntry, BadgeDTO, ChallengeDTO } from "./types";

export async function getGamificationData(userId: string): Promise<GamificationData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, coins: true, level: true, currentStreak: true, bestStreak: true },
  });

  const [xpTransactions, earnedBadges, allBadges, activeChallenges, completedUserChallenges] = await Promise.all([
    prisma.xpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, xp: true, coins: true, source: true, note: true, createdAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
    prisma.badge.findMany(),
    prisma.challenge.findMany({
      where: { status: "ACTIVE" },
      include: { userChallenges: { where: { userId } } },
    }),
    prisma.userChallenge.findMany({
      where: { userId, completedAt: { not: null } },
      include: { challenge: true },
    }),
  ]);

  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));
  const earnedAtMap = new Map(earnedBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

  const badges = allBadges.map((b) => ({
    id: b.id,
    key: b.key,
    name: b.name,
    description: b.description,
    icon: b.icon,
    tier: b.tier,
    earned: earnedBadgeIds.has(b.id),
    earnedAt: earnedAtMap.get(b.id) ?? null,
  }));

  const challenges = [
    ...activeChallenges.map((c) => {
      const uc = c.userChallenges[0];
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        target: c.target,
        rewardXp: c.rewardXp,
        rewardCoins: c.rewardCoins,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        progress: uc?.progress ?? 0,
        claimed: uc?.claimed ?? false,
        completed: (uc?.progress ?? 0) >= c.target,
      };
    }),
    ...completedUserChallenges.map((uc) => ({
      id: uc.challenge.id,
      title: uc.challenge.title,
      description: uc.challenge.description,
      type: uc.challenge.type,
      target: uc.challenge.target,
      rewardXp: uc.challenge.rewardXp,
      rewardCoins: uc.challenge.rewardCoins,
      startsAt: uc.challenge.startsAt,
      endsAt: uc.challenge.endsAt,
      progress: uc.progress,
      claimed: uc.claimed,
      completed: true,
    })),
  ];

  return {
    xp: user.xp,
    coins: user.coins,
    level: user.level,
    levelTitle: levelTitle(user.level),
    levelProgress: Math.round(levelProgress(user.xp) * 100),
    xpIntoLevel: xpIntoLevel(user.xp),
    xpForNextLevel: xpForLevelUp(user.level),
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    xpHistory: xpTransactions,
    badges,
    challenges,
  };
}
