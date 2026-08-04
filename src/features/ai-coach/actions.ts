"use server";

import { prisma } from "@/lib/db";
import { requireUserAction } from "@/lib/server/auth";
import { getCoachData } from "./server";

function generateMockResponse(message: string, stats: { focusMinutes: number; problemsSolved: number; habitsDone: number; streak: number }): string {
  const lower = message.toLowerCase();

  if (lower.includes("streak") || lower.includes("consistent")) {
    return `Great question about consistency! You're currently on a ${stats.streak}-day streak. That's a solid foundation. To keep building, try to maintain at least some activity each day — even 15 minutes of focused study counts. The key is showing up, not the duration.`;
  }

  if (lower.includes("focus") || lower.includes("study") || lower.includes("time")) {
    return `You've logged ${stats.focusMinutes} minutes of focus today. ${stats.focusMinutes < 60 ? "That's a good start — try to push for at least 60 minutes of deep focus daily." : "That's excellent focused work! Remember to take short breaks every 25-30 minutes to maintain quality."} Consider using the Pomodoro technique if you haven't already.`;
  }

  if (lower.includes("problem") || lower.includes("dsa") || lower.includes("code")) {
    return `You've solved ${stats.problemsSolved} problems today. ${stats.problemsSolved === 0 ? "Time to get some practice in! Start with a problem you're comfortable with to build momentum." : stats.problemsSolved < 3 ? "Good progress! Try to gradually increase difficulty as you warm up." : "Impressive work! Make sure you're also reviewing problems you've solved before to reinforce patterns."} Consistency beats intensity.`;
  }

  if (lower.includes("habit")) {
    return `You've completed ${stats.habitsDone} habits today. ${stats.habitsDone === 0 ? "Don't forget your habits — they're the building blocks of your routine!" : "Nice work checking those off! Habits compound over time. Keep the chain going."} Remember, it takes about 66 days on average to form a new habit.`;
  }

  if (lower.includes("plan") || lower.includes("schedule") || lower.includes("routine")) {
    return `Here's a suggested daily routine based on your activity: Morning (9-12): Deep focus work — DSA problems or project work. Afternoon (2-5): Learning — courses, reading, or skill building. Evening (7-9): Review and habits. You've shown ${stats.focusMinutes} minutes of focus today — try to distribute it across these blocks for better retention.`;
  }

  if (lower.includes("motivat") || lower.includes("tired") || lower.includes("burnout") || lower.includes("help")) {
    return `Feeling unmotivated is normal — even the best have off days. Remember: you're on a ${stats.streak}-day streak and have already invested ${stats.focusMinutes} minutes today. That's real progress! Try breaking your next task into a tiny 5-minute step. Action creates motivation, not the other way around.`;
  }

  if (lower.includes("goal") || lower.includes("target")) {
    return `Setting clear goals is key. Based on your stats: you've focused ${stats.focusMinutes}min, solved ${stats.problemsSolved} problems, and completed ${stats.habitsDone} habits today. Consider setting specific, measurable targets like "Solve 3 DSA problems" or "Study for 90 minutes" rather than vague goals like "study more."`;
  }

  return `Thanks for reaching out! Here's a quick snapshot of your day: ${stats.focusMinutes} minutes of focus, ${stats.problemsSolved} problems solved, ${stats.habitsDone} habits completed, and a ${stats.streak}-day streak going. ${stats.streak > 7 ? "Your consistency is really paying off!" : stats.streak > 0 ? "Keep that streak alive!" : "Today is a fresh start — what would you like to work on?"} What specific area would you like coaching on?`;
}

interface CoachActionResult {
  ok?: boolean;
  error?: string;
  response?: string;
}

export async function sendCoachMessage(
  _prev: CoachActionResult,
  formData: FormData
): Promise<CoachActionResult> {
  const user = await requireUserAction();
  const message = formData.get("message")?.toString().trim();
  if (!message) return { error: "Please enter a message" };

  const data = await getCoachData(user.id);

  const prompt = `User stats: ${data.recentActivity.focusMinutes}min focus today, ${data.recentActivity.problemsSolved} problems solved, ${data.recentActivity.habitsDone} habits done, ${data.recentActivity.streak}-day streak.\n\nUser message: ${message}`;

  const response = generateMockResponse(message, data.recentActivity);

  await prisma.aIPrompt.create({
    data: {
      userId: user.id,
      kind: "COACH",
      prompt,
      response,
      model: "mock-coach-v1",
    },
  });

  return { ok: true, response };
}
