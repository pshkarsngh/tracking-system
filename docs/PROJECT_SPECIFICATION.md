# Personal Productivity Tracking System — Project Specification

> **Single source of truth.** Every feature, schema, API, and UI decision must trace back to this document.
> If there is a conflict between this document and any other source, this document wins.

---

## 1. Product Vision

A production-ready, SaaS-quality **Personal Productivity Operating System** — not a CRUD app.

It combines the best ideas from:
| Product | Idea borrowed |
|---|---|
| Notion | Flexible pages, clean information hierarchy, block-like modularity |
| GitHub | Contribution heatmap, streak psychology, clean data display |
| Habitica | Gamification: XP, levels, coins, quests, rewards |
| Google Calendar | Time-blocking, daily/weekly/monthly calendar views |
| LeetCode | Problem tracking, difficulty-based progress, consistency scoring |
| Duolingo | Streaks, leagues, bite-sized daily goals, motivation loops |
| Forest | Focus sessions, time discipline, rewarding deep work |
| TickTick | Task/project management, daily planning, smart lists |

**Target user:** a college student preparing for placements while managing:
college academics, projects, DSA, web development, AI/ML, communication (English
speaking), aptitude, resume, portfolio, and mock interviews — all in one place.

**Roadmap:** used daily for years by the individual, eventually released as a premium SaaS product.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth / Auth.js (credentials + OAuth-ready) |
| Forms | React Hook Form |
| Validation | Zod |
| Server state | TanStack Query |
| Charts | Recharts |
| Calendar | React Big Calendar |
| Hosting | Vercel |

---

## 3. Architecture

### 3.1 Principles
- **Clean Architecture** — domain, application, infrastructure, presentation layers.
- **Feature-first modular design** — every module is self-contained (own route, components, schema, actions).
- **Server Components first** — data fetching on the server; interactive islands (client components) only where needed.
- **Reusable component library** — shadcn/ui primitives + shared feature components.
- **TypeScript everywhere** — shared types for API contracts, Zod schemas, Prisma models.
- **Never generate placeholder code.** Every file is production-ready and documented.
- **Performance & accessibility first** — semantic HTML, ARIA, keyboard navigation, lazy-loading, caching, optimistic UI.

### 3.2 Folder structure (feature-first)
```
src/
├── app/                 # Next.js App Router (routes = pages)
│   ├── (auth)/          # login/register layouts
│   ├── (app)/           # authenticated app shell (sidebar, topbar)
│   │   ├── dashboard/
│   │   ├── daily/
│   │   ├── calendar/
│   │   ├── habits/
│   │   ├── trackers/    # dsa, webdev, aiml, english, aptitude, college, projects
│   │   ├── placement/   # resume, portfolio, interview-prep, applications
│   │   ├── analytics/
│   │   ├── goals/
│   │   ├── gamification/
│   │   ├── ai-coach/
│   │   ├── reports/
│   │   └── settings/
├── components/
│   ├── ui/              # shadcn primitives
│   ├── shared/          # cross-feature components (StatCard, Heatmap, ProgressRing…)
│   └── features/        # feature-specific components
│       ├── dashboard/
│       ├── habits/
│       ├── analytics/
│       └── ... (one folder per module)
├── lib/
│   ├── db.ts            # Prisma client singleton
│   ├── auth.ts          # NextAuth config
│   ├── utils.ts         # cn(), date helpers
│   ├── validation/      # Zod schemas
│   ├── domain/          # pure domain logic (scoring, XP, streaks)
│   ├── server/          # server-only helpers (actions, queries)
│   └── constants/       # enums, config
├── features/            # feature modules (types, api, hooks, stores)
│   ├── dashboard/
│   ├── habits/
│   ├── gamification/
│   └── ...
└── types/               # global shared types
```

### 3.3 Data-flow pattern
```
Route (Server Component)
  → Server Action / Route Handler (validation via Zod, auth guard)
    → Prisma (PostgreSQL)
    → return serialized DTO
  → Client component (TanStack Query for mutation-heavy UI)
    → optimistic updates, error boundaries
```

---

## 4. Authentication (NextAuth / Auth.js)

- **Credentials provider** (email + password, bcrypt hashing) for MVP.
- OAuth (Google/GitHub) enabled for SaaS release.
- Session strategy: **database sessions** via Prisma adapter.
- Middleware guards all `/app` routes; redirects unauthenticated users to `/login`.
- Server-side auth in every Server Action (`requireUser()`).
- Email verification & password reset on the SaaS roadmap.

---

## 5. Core Domain Entities

| Entity | Description |
|---|---|
| User | profile, settings, timezone, plan |
| Session | study/focus session (start, end, duration, category, notes) |
| Habit | recurring habit with frequency, target, unit |
| HabitLog | daily check-in for a habit |
| Goal | outcome goal with deadline, milestones, priority |
| GoalProgress | progress snapshot for a goal |
| Project | major project / portfolio project (scope, repo, status) |
| Topic | trackable topic within a tracker (DSA, AI/ML, Web…) |
| TopicLog | completion/effort log for a topic |
| Problem | coding problem (DSA) with difficulty, tags, status |
| ProblemAttempt | attempt history for a problem |
| StudySession | per-topic study session with duration + notes |
| CollegeTask | assignment / attendance / class record |
| Application | job application pipeline entry |
| MockInterview | interview simulation record with ratings |
| SpeakingLog | English speaking practice record |
| AptitudeAttempt | aptitude test/practice record |
| XPTransaction | gamification ledger (XP/coins earned or spent) |
| Badge | achievement definition |
| UserBadge | earned badge (join table) |
| Challenge | gamified challenge definition |
| UserChallenge | user's progress in a challenge |
| Review | daily/weekly/monthly/yearly review |
| AIPrompt | AI coach conversation / generated feedback history |
| Notification | in-app notification |
| CalendarEvent | calendar entries (time blocks, events) |

---

## 6. Gamification Design

- **XP** — earned from tracked activity. Source → rate:
  - Study session minute → 1 XP
  - Habit completed → 10 XP
  - DSA problem solved → 30–100 XP (by difficulty)
  - Goal milestone → 100–500 XP
  - Mock interview → 150 XP
- **Levels** — `level = floor(0.05 * sqrt(xp))` or a tiered curve; level-up reward + coins.
- **Coins** — earned alongside XP; spendable on rewards (self-defined).
- **Badges** — milestone-based (e.g., "7-day streak", "100 problems", "First mock interview").
- **Challenges** — time-boxed (e.g., "Solve 10 problems this week").
- **Streaks** — daily, weekly, per-habit; longest-streak records.
- All gamification events are recorded as **XPTransactions** (auditable ledger).

---

## 7. Analytics & Scores

Computed from domain events (pure functions in `lib/domain`):

| Score | Definition |
|---|---|
| Consistency Score | % of days in period with any tracked activity |
| Discipline Score | planned vs. executed study minutes (schedule adherence) |
| Productivity Score | weighted XP earned vs. target, normalized |
| Placement Readiness Score | composite of DSA, aptitude, communication, projects, resume, interview readiness |

- **Heatmaps** — GitHub-style contribution heatmap (daily intensity).
- **Charts** — Recharts: line/area for trends, bar for weekly distribution, radar for subject balance, pie for time allocation.
- **KPIs** — today's focus, streak, XP, hours, problems solved, etc.

---

## 8. Generated Reports (Reviews)

Automatically generated, human-readable + data:
- **Daily Review** — what was done, wins, misses, tomorrow's plan.
- **Weekly Review** — summary stats, weak areas, next-week targets.
- **Monthly Review** — trends, score deltas, highlights.
- **Yearly Review** — long-term trajectory, yearly totals, reflections.

---

## 9. AI Coach

Goals:
- Analyze study habits → insights
- Detect weak subjects → from analytics
- Recommend study plans → weekly plans
- Generate mock interviews → question sets
- Recommend coding problems → by weak tags
- Recommend AI/ML & Web projects → by skill level
- Track placement readiness → score + gap analysis
- Act as English speaking partner → conversation practice
- Generate personalized feedback → from reviews

Implementation:
- API route `/api/ai/coach` (server-only, rate-limited).
- Prompt templates live in `lib/ai/prompts`.
- Responses stored in `AIPrompt` (history + context).
- Provider-agnostic interface (OpenAI-compatible); `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` in env.

---

## 10. Design System

- **Dark mode first**, with light-mode support via a theme provider.
- **Glassmorphism** — translucent cards, subtle borders, backdrop blur.
- **Apple-level polish** — refined spacing scale, rounded corners, micro-interactions.
- **Duolingo motivation** — streak badges, celebratory toasts, XP counters in the topbar.
- **Animated** — Framer Motion for page transitions, number count-ups, list enter/exit.
- **Responsive** — desktop sidebar; mobile bottom-nav + hamburger drawer.
- **Accessible** — WCAG AA contrast, focus rings, semantic HTML, reduced-motion support.

### Color tokens (dark first)
```
Background: #0a0a0f (near-black), surface glass: rgba(255,255,255,0.04)
Accent: indigo/violet gradient (#6366f1 → #a855f7)
Success: emerald #10b981 · Warning: amber #f59e0b · Danger: rose #f43f5e
```

---

## 11. Module Registry

| # | Module | Route | Core entities |
|---|---|---|---|
| 1 | Dashboard | `/dashboard` | aggregates all modules |
| 2 | Daily Planner | `/daily` | Session, StudySession |
| 3 | Calendar | `/calendar` | CalendarEvent |
| 4 | Habit Tracker | `/habits` | Habit, HabitLog |
| 5 | DSA Tracker | `/trackers/dsa` | Topic, Problem, ProblemAttempt |
| 6 | Web Dev Tracker | `/trackers/webdev` | Topic, Project |
| 7 | AI/ML Tracker | `/trackers/aiml` | Topic, Project |
| 8 | English Tracker | `/trackers/english` | Topic, SpeakingLog |
| 9 | Aptitude Tracker | `/trackers/aptitude` | Topic, AptitudeAttempt |
| 10 | College Tracker | `/trackers/college` | CollegeTask |
| 11 | Major Project Tracker | `/trackers/projects` | Project |
| 12 | Placement Tracker | `/placement` | Application |
| 13 | Resume Tracker | `/placement/resume` | Project, User profile |
| 14 | Portfolio Tracker | `/placement/portfolio` | Project |
| 15 | Interview Prep | `/placement/interview` | MockInterview |
| 16 | Analytics | `/analytics` | scores, heatmaps, charts |
| 17 | Goals | `/goals` | Goal, GoalProgress |
| 18 | Gamification | `/gamification` | XP, badges, challenges |
| 19 | AI Coach | `/ai-coach` | AIPrompt |
| 20 | Reports | `/reports` | Review |
| 21 | Settings | `/settings` | User settings |

---

## 12. Development Rules (must always follow)

1. Never skip architecture.
2. Never generate placeholder code — production-ready only.
3. Always explain design choices.
4. Reusable components over copy-paste.
5. Modular files; feature-first.
6. Server Components whenever appropriate; client islands only where needed.
7. Optimize for scalability (pagination, indexes, caching).
8. Do not move to the next feature until the current one is complete.
9. Every feature ships: folder structure, DB schema, API/actions, backend logic,
   frontend UI, validation, authentication, state management, error handling, testing notes.
10. Types everywhere; Zod schemas as the contract between client and server.
