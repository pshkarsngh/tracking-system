import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const hash = await bcrypt.hash("TestPass123!", 10);
  const u = await prisma.user.upsert({
    where: { email: "test@momentum.dev" },
    update: {},
    create: {
      name: "Test User",
      email: "test@momentum.dev",
      password: hash,
      xp: 150,
      coins: 20,
      currentStreak: 2,
      bestStreak: 5,
    },
  });

  const habits = [
    { name: "LeetCode", frequency: "DAILY" as const, color: "#6366f1" },
    { name: "Meditation", frequency: "DAILY" as const, color: "#22c55e" },
  ];
  for (const h of habits) {
    await prisma.habit.upsert({
      where: { id: `${u.id}-${h.name}` },
      update: {},
      create: { id: `${u.id}-${h.name}`, userId: u.id, name: h.name, frequency: h.frequency, color: h.color },
    });
  }

  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    await prisma.habitLog.upsert({
      where: { habitId_userId_date: { habitId: `${u.id}-LeetCode`, userId: u.id, date: d } },
      update: {},
      create: { habitId: `${u.id}-LeetCode`, userId: u.id, date: d, count: i < 7 ? 1 : 0 },
    });
  }

  const tx = await prisma.xpTransaction.create({
    data: { userId: u.id, xp: 60, coins: 3, type: "EARN", source: "STUDY_SESSION", note: "test session" },
  });
  console.log("user:", u.id, u.name, "| xpTx:", tx.id);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
