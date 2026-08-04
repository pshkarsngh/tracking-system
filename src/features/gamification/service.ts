import { prisma } from "@/lib/db";
import { levelFromXp, coinsForXp } from "@/lib/domain/gamification";
import type { Prisma as PrismaNS } from "@/generated/prisma/client";

type PrismaTx = PrismaNS.TransactionClient;

export interface AwardResult {
  xp: number;
  coins: number;
  level: number;
  leveledUp: boolean;
}

/**
 * Award XP + coins to a user, update gamification totals atomically,
 * write an auditable ledger entry, and detect level-ups.
 */
export async function awardXp(opts: {
  userId: string;
  xp: number;
  source: string;
  sourceId?: string;
  note?: string;
  tx?: PrismaTx;
}): Promise<AwardResult> {
  const { userId, xp, source, sourceId, note, tx } = opts;
  const coins = coinsForXp(xp);

  const client = (tx ?? prisma) as unknown as {
    user: typeof prisma.user;
    xpTransaction: typeof prisma.xpTransaction;
    notification: typeof prisma.notification;
  };

  const prev = await client.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  const nextXp = prev.xp + xp;
  const nextLevel = levelFromXp(nextXp);
  const leveledUp = nextLevel > prev.level;

  const [updatedUser] = await Promise.all([
    client.user.update({
      where: { id: userId },
      data: { xp: { increment: xp }, coins: { increment: coins }, level: nextLevel },
      select: { xp: true, coins: true, level: true },
    }),
    client.xpTransaction.create({
      data: { userId, type: "EARN", xp, coins, source, sourceId, note },
    }),
    leveledUp
      ? client.notification.create({
          data: {
            userId,
            type: "XP",
            title: `Level up! You're now level ${nextLevel}`,
            body: "Keep the momentum going.",
            link: "/gamification",
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    xp: updatedUser.xp,
    coins: updatedUser.coins,
    level: updatedUser.level,
    leveledUp,
  };
}

/**
 * Run a domain mutation and award XP together in one transaction.
 * `mutate` returns the mutation payload plus optional gamification metadata
 * ({ xp, source, sourceId?, note? }) that is rewarded atomically.
 */
export async function withGamification<T extends Record<string, unknown>>(
  userId: string,
  mutate: (tx: PrismaTx) => Promise<T & { xp?: number; source?: string; sourceId?: string; note?: string }>
): Promise<{ result: T; award?: AwardResult }> {
  let award: AwardResult | undefined;

  const payload = await prisma.$transaction(async (tx) => {
    const res = await mutate(tx as unknown as PrismaTx);
    const { xp, source, sourceId, note, ...result } = res as T & {
      xp?: number;
      source?: string;
      sourceId?: string;
      note?: string;
    };
    if (typeof xp === "number" && xp > 0 && source) {
      award = await awardXp({ userId, xp, source, sourceId, note, tx: tx as unknown as PrismaTx });
    }
    return result as T;
  });

  return { result: payload, award };
}
