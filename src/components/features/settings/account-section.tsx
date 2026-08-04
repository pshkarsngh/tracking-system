"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Zap, Coins, Flame, Trophy, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { deleteAccountAction } from "@/features/settings/actions";
import type { SettingsData } from "@/features/settings/types";

export function AccountSection({ user }: { user: SettingsData["user"] }) {
  const [state, formAction] = useActionState(deleteAccountAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Account deleted");
      window.location.href = "/login";
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15">
              <Trophy className="size-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="font-semibold">{user.plan === "FREE" ? "Free" : "Pro"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15">
              <Zap className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">XP</p>
              <p className="font-semibold">{user.xp.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-500/15">
              <Coins className="size-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coins</p>
              <p className="font-semibold">{user.coins.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15">
              <Flame className="size-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Level {user.level}</p>
              <p className="font-semibold">{user.currentStreak} day streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-destructive/30 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="font-heading text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              name="confirm"
              placeholder="Type DELETE"
              className="max-w-xs"
            />
          </div>
          <SubmitButton variant="destructive" className="w-fit">
            Delete Account
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
