"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { updatePreferencesAction } from "@/features/settings/actions";
import type { SettingsData } from "@/features/settings/types";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Auckland",
  "Australia/Sydney",
  "Africa/Cairo",
  "Africa/Nairobi",
];

export function PreferencesSection({ user }: { user: SettingsData["user"] }) {
  const [state, formAction] = useActionState(updatePreferencesAction, {});
  const [timezone, setTimezone] = useState(user.timezone);
  const [darkMode, setDarkMode] = useState(user.darkMode);

  if (state.ok) toast.success("Preferences updated");
  if (state.error) toast.error(state.error);

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">Preferences</h2>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="timezone" value={timezone} />
        <input type="hidden" name="darkMode" value={darkMode ? "on" : "off"} />

        <div className="grid gap-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="grid gap-1">
            <Label>Dark Mode</Label>
            <p className="text-xs text-muted-foreground">
              {darkMode ? "Dark mode is on" : "Light mode is on"}
            </p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>

        <SubmitButton className="w-fit">Save Preferences</SubmitButton>
      </form>
    </div>
  );
}
