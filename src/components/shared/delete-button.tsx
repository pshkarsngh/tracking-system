"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icon-only delete submit button for use inside a <form action={serverAction}>.
 * Shows a spinner while pending and asks for confirmation on click.
 */
export function DeleteButton({ className, confirmText }: { className?: string; confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label="Delete"
      disabled={pending}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
        className
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
