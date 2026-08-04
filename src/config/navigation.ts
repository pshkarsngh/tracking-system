import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  CheckSquare,
  Code2,
  Globe,
  Brain,
  MessageSquare,
  Calculator,
  GraduationCap,
  FolderGit2,
  Briefcase,
  FileText,
  Palette,
  Mic,
  BarChart3,
  Target,
  Trophy,
  Sparkles,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Plan",
    items: [
      { title: "Daily Planner", href: "/daily", icon: ListTodo },
      { title: "Calendar", href: "/calendar", icon: CalendarDays },
      { title: "Habits", href: "/habits", icon: CheckSquare },
    ],
  },
  {
    title: "Trackers",
    items: [
      { title: "DSA", href: "/trackers/dsa", icon: Code2 },
      { title: "Web Dev", href: "/trackers/webdev", icon: Globe },
      { title: "AI / ML", href: "/trackers/aiml", icon: Brain },
      { title: "English", href: "/trackers/english", icon: MessageSquare },
      { title: "Aptitude", href: "/trackers/aptitude", icon: Calculator },
      { title: "College", href: "/trackers/college", icon: GraduationCap },
      { title: "Projects", href: "/trackers/projects", icon: FolderGit2 },
    ],
  },
  {
    title: "Placement",
    items: [
      { title: "Applications", href: "/placement", icon: Briefcase },
      { title: "Resume", href: "/placement/resume", icon: FileText },
      { title: "Portfolio", href: "/placement/portfolio", icon: Palette },
      { title: "Interview Prep", href: "/placement/interview", icon: Mic },
    ],
  },
  {
    title: "Insights",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Reports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Level Up",
    items: [
      { title: "Goals", href: "/goals", icon: Target },
      { title: "Gamification", href: "/gamification", icon: Trophy },
      { title: "AI Coach", href: "/ai-coach", icon: Sparkles },
    ],
  },
  {
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
