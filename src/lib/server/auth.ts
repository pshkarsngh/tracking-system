import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/**
 * Server-side auth guard. Must be called from Server Components / Server Actions.
 * Returns the authenticated user or redirects to /login.
 */
export async function requireUser(): Promise<AuthUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login");
  return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null };
}

/**
 * Optional auth — returns null instead of redirecting.
 * Used on pages that render differently for guests.
 */
export async function optionalUser(): Promise<AuthUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null };
}

/**
 * Loads the full user row (with gamification state) for the current session.
 */
export async function requireUserWithStats() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { userBadges: true, notifications: { where: { read: false } } } } },
  });
  if (!user) redirect("/login");
  return user;
}

/** Throw inside a Server Action when unauthenticated (caught by the form handler). */
export async function requireUserAction(): Promise<AuthUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    const error = new Error("You must be signed in to do that.");
    error.name = "UnauthorizedError";
    throw error;
  }
  return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null };
}
