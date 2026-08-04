"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

/**
 * Button that shows a spinner while its surrounding <form> server action is pending.
 * Use with <form action={serverAction}>.
 */
export function SubmitButton({ children, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn(className)} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
