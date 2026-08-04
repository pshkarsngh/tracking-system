import type { Metadata } from "next";
import {
  Trophy,
  Flame,
  Star,
  Coins,
  Zap,
  Lock,
  Target,
  Code2,
  Mic,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getGamificationData } from "@/features/gamification/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ScoreBar } from "@/components/shared/score-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SubmitButton } from "@/components/shared/submit-button";
import { claimChallengeAction } from "@/features/gamification/actions";
import type { BadgeDTO, ChallengeDTO, XpHistoryEntry } from "@/features/gamification/types";

export const metadata: Metadata = { title: "Gamification" };
export const dynamic = "force-dynamic";

const TIER_LABELS: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum" };
const TIER_COLORS: Record<number, string> = {
  1: "bg-orange-500/15 text-orange-400",
  2: "bg-slate-300/15 text-slate-300",
  3: "bg-yellow-500/15 text-yellow-400",
  4: "bg-violet-500/15 text-violet-400",
};

function BadgeIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "flame":
      return <Flame className="size-5" />;
    case "code":
      return <Code2 className="size-5" />;
    case "target":
      return <Target className="size-5" />;
    case "mic":
      return <Mic className="size-5" />;
    case "check":
      return <CheckCircle2 className="size-5" />;
    case "clock":
      return <Clock className="size-5" />;
    case "star":
      return <Star className="size-5" />;
    default:
      return <Award className="size-5" />;
  }
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function GamificationPage() {
  const user = await requireUser();
  const data = await getGamificationData(user.id);

  const earnedBadges = data.badges.filter((b) => b.earned);
  const unearnedBadges = data.badges.filter((b) => !b.earned);
  const activeChallenges = data.challenges.filter((c) => !c.completed);
  const completedChallenges = data.challenges.filter((c) => c.completed);

  return (
    <>
      <PageHeader title="Gamification" description="Track your progress, earn badges, and complete challenges." />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Level"
            value={`${data.level} — ${data.levelTitle}`}
            icon={Trophy}
            iconClassName="bg-yellow-500/15 text-yellow-400"
          />
          <StatCard label="XP" value={data.xp.toLocaleString()} icon={Zap} iconClassName="bg-sky-500/15 text-sky-400" />
          <StatCard label="Coins" value={data.coins.toLocaleString()} icon={Coins} iconClassName="bg-amber-500/15 text-amber-400" />
          <StatCard
            label="Current Streak"
            value={`${data.currentStreak} days`}
            icon={Flame}
            iconClassName="bg-orange-500/15 text-orange-400"
          />
          <StatCard
            label="Best Streak"
            value={`${data.bestStreak} days`}
            icon={Star}
            iconClassName="bg-violet-500/15 text-violet-400"
          />
        </div>

        <div className="glass rounded-2xl p-5">
          <ScoreBar
            label="Level Progress"
            value={data.levelProgress}
            hint={`${data.xpIntoLevel} / ${data.xpForNextLevel} XP`}
            color="violet"
          />
        </div>

        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">Badges</h2>
          {data.badges.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No badges yet"
              description="Complete streaks, solve problems, and reach milestones to earn badges."
            />
          ) : (
            <>
              {earnedBadges.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Earned</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {earnedBadges.map((b: BadgeDTO) => (
                      <div key={b.id} className="glass rounded-2xl p-4 flex items-start gap-3">
                        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${TIER_COLORS[b.tier] ?? "bg-primary/15 text-primary"}`}>
                          <BadgeIcon icon={b.icon} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading text-sm font-semibold">{b.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{TIER_LABELS[b.tier] ?? `Tier ${b.tier}`}</Badge>
                            {b.earnedAt && <span className="text-[10px] text-muted-foreground">{formatDate(b.earnedAt)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {unearnedBadges.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Locked</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {unearnedBadges.map((b: BadgeDTO) => (
                      <div key={b.id} className="glass rounded-2xl p-4 flex items-start gap-3 opacity-60">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                          <Lock className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading text-sm font-semibold">{b.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                          <Badge variant="outline" className="mt-1.5 text-[10px]">{TIER_LABELS[b.tier] ?? `Tier ${b.tier}`}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">Challenges</h2>
          {data.challenges.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No challenges yet"
              description="Challenges will appear here when available."
            />
          ) : (
            <div className="space-y-4">
              {activeChallenges.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Active</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeChallenges.map((c: ChallengeDTO) => {
                      const pct = c.target > 0 ? Math.min(100, Math.round((c.progress / c.target) * 100)) : 0;
                      return (
                        <div key={c.id} className="glass rounded-2xl p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <p className="font-heading text-sm font-semibold">{c.title}</p>
                              {c.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">{c.type.replace(/_/g, " ")}</Badge>
                          </div>
                          <div className="mb-3">
                            <Progress value={pct} className="h-2" />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {c.progress} / {c.target}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Zap className="size-3" /> {c.rewardXp} XP</span>
                              <span className="flex items-center gap-1"><Coins className="size-3" /> {c.rewardCoins}</span>
                            </div>
                            {c.completed && !c.claimed && (
                              <form action={claimChallengeAction}>
                                <input type="hidden" name="challengeId" value={c.id} />
                                <SubmitButton size="sm" className="gap-1">
                                  Claim <ChevronRight className="size-3" />
                                </SubmitButton>
                              </form>
                            )}
                            {c.claimed && <Badge variant="secondary" className="text-[10px]">Claimed</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {completedChallenges.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Completed</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {completedChallenges.map((c: ChallengeDTO) => (
                      <div key={c.id} className="glass rounded-2xl p-5 opacity-70">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-heading text-sm font-semibold">{c.title}</p>
                            {c.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">{c.claimed ? "Claimed" : "Completed"}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{c.progress} / {c.target}</span>
                          <span className="flex items-center gap-1"><Zap className="size-3" /> {c.rewardXp} XP</span>
                          <span className="flex items-center gap-1"><Coins className="size-3" /> {c.rewardCoins}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">XP History</h2>
          {data.xpHistory.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No XP transactions yet"
              description="Start studying, completing habits, or solving problems to earn XP."
            />
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {data.xpHistory.map((tx: XpHistoryEntry) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.source.replace(/_/g, " ")}</p>
                      {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</span>
                      <span className="font-heading text-sm font-semibold text-emerald-500 tabular-nums">+{tx.xp} XP</span>
                      <span className="text-xs text-muted-foreground tabular-nums">+{tx.coins}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
