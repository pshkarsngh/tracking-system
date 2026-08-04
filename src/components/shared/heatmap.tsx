import { cn } from "@/lib/utils";

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

interface HeatmapProps {
  /** Map of "YYYY-MM-DD" → activity level 0..4 */
  data: Map<string, HeatmapLevel>;
  weeks?: number;
  endDate?: Date;
  className?: string;
}

const LEVEL_STYLES: Record<HeatmapLevel, string> = {
  0: "bg-muted/25",
  1: "bg-indigo-900/50",
  2: "bg-indigo-700/70",
  3: "bg-indigo-500",
  4: "bg-gradient-to-br from-indigo-400 to-violet-500",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Wed", "Fri"];

/** GitHub-style contribution heatmap. Columns = weeks (left→right), rows = weekdays. */
export function Heatmap({ data, weeks = 26, endDate = new Date(), className }: HeatmapProps) {
  // Build week columns starting Monday
  const day = 86_400_000;
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const endDay = end.getDay() === 0 ? 7 : end.getDay();
  const endMonday = new Date(end.getTime() - (endDay - 1) * day);

  const columns: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    const colStart = new Date(endMonday.getTime() - (weeks - 1 - w) * 7 * day);
    const col: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(colStart.getTime() + d * day);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;
      col.push(key);
    }
    columns.push(col);
  }

  // Month labels for columns that begin a new month
  const monthLabels: (string | null)[] = columns.map((col, i) => {
    const prevCol = i > 0 ? columns[i - 1] : null;
    const thisKey = col[0];
    const thisMonth = thisKey.slice(5, 7);
    const prevMonth = prevCol ? prevCol[0].slice(5, 7) : null;
    if (prevMonth === null || thisMonth !== prevMonth) {
      return MONTHS[Number(thisMonth) - 1];
    }
    return null;
  });

  return (
    <div className={cn("overflow-x-auto no-scrollbar", className)}>
      <div className="min-w-[640px]">
        <div className="mb-1 flex gap-[3px]">
          {columns.map((_, i) => (
            <div key={i} className="w-[11px] flex-1 text-center text-[9px] text-muted-foreground">
              {monthLabels[i] ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="mr-1 grid w-6 grid-rows-7 gap-[3px] text-[9px] leading-[11px] text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <span key={d} className="h-[11px]">{d}</span>
            ))}
          </div>
          {columns.map((col, i) => (
            <div key={i} className="grid flex-1 grid-rows-7 gap-[3px]">
              {col.map((key) => (
                <div
                  key={key}
                  title={key}
                  className={cn("size-[11px] rounded-[3px]", LEVEL_STYLES[data.get(key) ?? 0])}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {(Object.keys(LEVEL_STYLES) as unknown as HeatmapLevel[]).map((lvl) => (
            <span key={lvl} className={cn("size-[10px] rounded-[2px]", LEVEL_STYLES[lvl])} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
