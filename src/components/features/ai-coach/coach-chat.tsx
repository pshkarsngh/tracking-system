"use client";

import { useActionState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendCoachMessage } from "@/features/ai-coach/actions";
import type { CoachMessage } from "@/features/ai-coach/types";

interface CoachChatProps {
  history: CoachMessage[];
  recentActivity: {
    focusMinutes: number;
    problemsSolved: number;
    habitsDone: number;
    streak: number;
  };
}

export function CoachChat({ history, recentActivity }: CoachChatProps) {
  const [state, formAction, isPending] = useActionState(sendCoachMessage, {});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state, history.length]);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const displayMessages = [
    ...history.map((m) => ({ role: "user" as const, content: m.prompt.split("\n\nUser message: ")[1] ?? m.prompt, id: m.id })),
    ...(state.ok && state.response ? [{ role: "assistant" as const, content: state.response, id: "pending" }] : []),
  ];

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{recentActivity.focusMinutes}m</p>
            <p className="text-xs text-muted-foreground">Focus Today</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{recentActivity.problemsSolved}</p>
            <p className="text-xs text-muted-foreground">Problems Solved</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{recentActivity.habitsDone}</p>
            <p className="text-xs text-muted-foreground">Habits Done</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{recentActivity.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border bg-muted/20 p-4">
        {displayMessages.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Ask your AI Coach anything about your study habits, goals, or routine.
          </div>
        )}
        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground ring-1 ring-foreground/10"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-card px-4 py-2 text-sm ring-1 ring-foreground/10">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form ref={formRef} action={formAction} className="flex gap-2">
        <Input
          name="message"
          placeholder="Ask your AI coach..."
          required
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
