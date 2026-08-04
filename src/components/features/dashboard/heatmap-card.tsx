import { Flame } from "lucide-react";
import { Heatmap, type HeatmapLevel } from "@/components/shared/heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HeatmapCard({
  data,
  streak,
}: {
  data: Map<string, HeatmapLevel>;
  streak: number;
}) {
  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Activity heatmap</CardTitle>
        <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
          <Flame className="size-3.5" /> {streak} day streak
        </span>
      </CardHeader>
      <CardContent>
        <Heatmap data={data} weeks={26} />
      </CardContent>
    </Card>
  );
}
