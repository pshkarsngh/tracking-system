import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <Card className="glass-strong border shadow-2xl shadow-black/20">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 grid size-11 place-items-center rounded-2xl bg-gradient-primary shadow-lg shadow-indigo-500/30">
          <Sparkles className="size-6 text-white" />
        </div>
        <CardTitle className="font-heading text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="justify-center pb-6">{footer}</CardFooter>}
    </Card>
  );
}
