"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Briefcase, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationDTO } from "@/features/placement/types";
import { STATUS_ORDER_LABEL } from "@/features/placement/types";
import {
  createApplicationAction,
  updateApplicationAction,
  setApplicationStatusAction,
  deleteApplicationAction,
} from "@/features/placement/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const STATUSES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

const STATUS_META: Record<string, { cls: string; dot: string }> = {
  APPLIED: { cls: "bg-sky-500/10 text-sky-500 border-sky-500/30", dot: "bg-sky-500" },
  SCREENING: { cls: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30", dot: "bg-indigo-500" },
  INTERVIEW: { cls: "bg-amber-500/10 text-amber-500 border-amber-500/30", dot: "bg-amber-500" },
  OFFER: { cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", dot: "bg-emerald-500" },
  REJECTED: { cls: "bg-rose-500/10 text-rose-500 border-rose-500/30", dot: "bg-rose-500" },
  WITHDRAWN: { cls: "bg-muted/60 text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ApplicationDialog({ application }: { application?: ApplicationDTO | null }) {
  const [open, setOpen] = useState(false);
  const action = application ? updateApplicationAction : createApplicationAction;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(application ? "Application updated" : "Application added");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state, application]);

  const isEdit = Boolean(application);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" /> New application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit application" : "Track an application"}</DialogTitle>
          <DialogDescription>Every application is a data point in your placement pipeline.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={application!.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-company">Company</Label>
              <Input id="ap-company" name="company" defaultValue={application?.company ?? ""} placeholder="Acme Corp" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-role">Role</Label>
              <Input id="ap-role" name="role" defaultValue={application?.role ?? ""} placeholder="SDE Intern" required maxLength={120} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-status">Status</Label>
              <Select name="status" defaultValue={application?.status ?? "APPLIED"}>
                <SelectTrigger id="ap-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_ORDER_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-location">Location</Label>
              <Input id="ap-location" name="location" defaultValue={application?.location ?? ""} placeholder="Remote / Bengaluru" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-applied">Applied on</Label>
              <Input id="ap-applied" name="appliedAt" type="date" defaultValue={application ? toDateInput(application.appliedAt) : new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-next">Next round</Label>
              <Input id="ap-next" name="nextRoundAt" type="datetime-local" defaultValue={application?.nextRoundAt ? application.nextRoundAt.toISOString().slice(0, 16) : ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-url">Job URL</Label>
              <Input id="ap-url" name="url" type="url" defaultValue={application?.url ?? ""} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-salary">Salary / CTC</Label>
              <Input id="ap-salary" name="salary" defaultValue={application?.salary ?? ""} placeholder="₹12 LPA" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-notes">Notes</Label>
            <Textarea id="ap-notes" name="notes" rows={2} defaultValue={application?.notes ?? ""} placeholder="Referral, prep focus, contacts…" />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            {isEdit ? "Save changes" : "Add application"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const NEXT_STEP: Record<string, string> = {
  APPLIED: "SCREENING",
  SCREENING: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: "OFFER",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

export function ApplicationPipeline({ applications, counts }: { applications: ApplicationDTO[]; counts: Record<string, number> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATUSES.map((status) => (
          <div key={status} className={cn("glass rounded-2xl p-4")}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", STATUS_META[status].dot)} />
                <h3 className="text-sm font-semibold">{STATUS_ORDER_LABEL[status]}</h3>
              </div>
              <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-semibold tabular-nums">{counts[status] ?? 0}</span>
            </div>
            <div className="space-y-2">
              {applications
                .filter((a) => a.status === status)
                .map((a) => (
                  <div key={a.id} className={cn("rounded-xl border bg-background/40 p-3", STATUS_META[status].cls.replace(/\/\d+$/, ""))}>
                    <p className="text-sm font-semibold">{a.company}</p>
                    <p className="text-xs text-muted-foreground">{a.role}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      {a.location && <span>{a.location}</span>}
                      {a.nextRoundAt && (
                        <span>· next {a.nextRoundAt.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {a.status !== "OFFER" && a.status !== "REJECTED" && a.status !== "WITHDRAWN" && (
                        <form action={setApplicationStatusAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value={NEXT_STEP[a.status]} />
                          <SubmitButton variant="outline" size="sm" className="h-6 px-2 text-[11px]">
                            Advance →
                          </SubmitButton>
                        </form>
                      )}
                      <div className="flex items-center gap-1">
                        <ApplicationDialog application={a} />
                        <form action={deleteApplicationAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <DeleteButton confirmText="Remove this application?" />
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              {counts[status] === 0 && (
                <p className="rounded-xl border border-dashed py-4 text-center text-xs text-muted-foreground">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {applications.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-semibold">
            <Briefcase className="size-4 text-indigo-400" /> All applications
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Company</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Applied</th>
                  <th className="py-2 pr-3">Next round</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{a.company}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.role}</td>
                    <td className="py-2 pr-3">
                      <span className={cn("rounded-full border px-2 py-px text-[11px] font-semibold", STATUS_META[a.status].cls)}>
                        {STATUS_ORDER_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.appliedAt.toLocaleDateString([], { month: "short", day: "numeric" })}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {a.nextRoundAt ? a.nextRoundAt.toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
