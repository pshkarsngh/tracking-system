"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateProfileAction } from "@/features/settings/actions";
import type { SettingsData } from "@/features/settings/types";

export function ProfileSection({ user }: { user: SettingsData["user"] }) {
  const [state, formAction] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.ok) toast.success("Profile updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">Profile</h2>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            {user.image ? (
              <img src={user.image} alt={user.name} className="size-16 rounded-full object-cover" />
            ) : (
              <User className="size-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" name="name" defaultValue={user.name} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" defaultValue={user.email} disabled />
        </div>

        <SubmitButton className="w-fit">Save Profile</SubmitButton>
      </form>
    </div>
  );
}
