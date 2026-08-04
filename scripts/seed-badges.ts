import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const badges = [
  { key: "first-streak", name: "First Streak", description: "Complete a 3-day streak", icon: "flame", tier: 1, condition: { type: "STREAK", threshold: 3 } },
  { key: "week-warrior", name: "Week Warrior", description: "Complete a 7-day streak", icon: "flame", tier: 2, condition: { type: "STREAK", threshold: 7 } },
  { key: "streak-master", name: "Streak Master", description: "Complete a 30-day streak", icon: "flame", tier: 3, condition: { type: "STREAK", threshold: 30 } },
  { key: "problem-solver", name: "Problem Solver", description: "Solve 10 DSA problems", icon: "code", tier: 1, condition: { type: "PROBLEMS_SOLVED", threshold: 10 } },
  { key: "century-coder", name: "Century Coder", description: "Solve 100 DSA problems", icon: "code", tier: 3, condition: { type: "PROBLEMS_SOLVED", threshold: 100 } },
  { key: "first-goal", name: "Goal Setter", description: "Complete your first goal", icon: "target", tier: 1, condition: { type: "GOALS_COMPLETED", threshold: 1 } },
  { key: "interview-ready", name: "Interview Ready", description: "Complete 5 mock interviews", icon: "mic", tier: 2, condition: { type: "MOCK_INTERVIEWS", threshold: 5 } },
  { key: "habit-streak-7", name: "Habit Formed", description: "Maintain any habit for 7 days", icon: "check", tier: 1, condition: { type: "HABIT_STREAK", threshold: 7 } },
  { key: "focus-100h", name: "Deep Focus", description: "Accumulate 100 hours of study", icon: "clock", tier: 3, condition: { type: "STUDY_HOURS", threshold: 100 } },
  { key: "level-5", name: "Rising Star", description: "Reach level 5", icon: "star", tier: 1, condition: { type: "LEVEL", threshold: 5 } },
  { key: "level-10", name: "Achiever", description: "Reach level 10", icon: "star", tier: 2, condition: { type: "LEVEL", threshold: 10 } },
  { key: "level-25", name: "Expert", description: "Reach level 25", icon: "star", tier: 3, condition: { type: "LEVEL", threshold: 25 } },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const result = await prisma.badge.createMany({
    data: badges,
    skipDuplicates: true,
  });

  console.log(`Seeded ${result.count} badges`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
