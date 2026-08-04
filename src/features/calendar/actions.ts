"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import type { ActionState } from "@/lib/server/action";

const CATEGORIES = ["STUDY", "COLLEGE", "INTERVIEW", "MEETING", "PERSONAL"] as const;

const eventSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    startsAt: z.string().min(1, "Start time is required"),
    endsAt: z.string().min(1, "End time is required"),
    allDay: z.string().optional().or(z.literal("")),
    category: z.enum(CATEGORIES).default("STUDY"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => new Date(d.endsAt).getTime() > new Date(d.startsAt).getTime(), {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    allDay: formData.get("allDay"),
    category: formData.get("category"),
    color: formData.get("color"),
    notes: formData.get("notes"),
  });
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const parsed = parseEventForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid event" };
  const { title, startsAt, endsAt, allDay, category, color, notes } = parsed.data;

  await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      allDay: allDay === "on",
      category,
      color,
      notes: notes || null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return { error: "Missing event id" };

  const parsed = parseEventForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid event" };
  const { title, startsAt, endsAt, allDay, category, color, notes } = parsed.data;

  const event = await prisma.calendarEvent.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!event) return { error: "Event not found" };

  await prisma.calendarEvent.update({
    where: { id },
    data: { title, startsAt: new Date(startsAt), endsAt: new Date(endsAt), allDay: allDay === "on", category, color, notes: notes || null },
  });

  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const user = await requireUserAction();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const event = await prisma.calendarEvent.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!event) return;

  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

/**
 * Combined create/update dispatch used by the calendar dialog.
 * Presence of an "id" field routes to update; otherwise create.
 */
export async function saveEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get("id")?.toString();
  return id ? updateEventAction(_prev, formData) : createEventAction(_prev, formData);
}

/** Metadata shared with the client for rendering colors per category. */
export const CATEGORY_META: Record<(typeof CATEGORIES)[number], { label: string; color: string }> = {
  STUDY: { label: "Study", color: "#6366f1" },
  COLLEGE: { label: "College", color: "#0ea5e9" },
  INTERVIEW: { label: "Interview", color: "#f43f5e" },
  MEETING: { label: "Meeting", color: "#f59e0b" },
  PERSONAL: { label: "Personal", color: "#22c55e" },
};

export const CALENDAR_CATEGORIES = CATEGORIES;
