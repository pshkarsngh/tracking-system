"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw: RegisterInput = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email,
      password: passwordHash,
    },
  });

  // Auto sign-in (throws a redirect to /dashboard on success).
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // NextAuth uses thrown errors for redirects; re-throw them.
    if (error instanceof Error && "digest" in error) throw error;
    return { error: "Account created, but automatic sign-in failed. Please sign in manually." };
  }

  return {};
}
