import { TrendingUp, TrendingDown, DollarSign, Calendar, Hash } from "lucide-react";

interface Props {
  todayTotal: number;
  yesterdayTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  totalEntries: number;
  selectedDateTotal: number;
  selectedDate: string;
}

export function DashboardSummary({ todayTotal, yesterdayTotal, weeklyTotal, monthlyTotal, totalEntries, selectedDateTotal, selectedDate }: Props) {
  const stats = [
    { label: "Today", value: todayTotal, icon: DollarSign, trend: todayTotal >= yesterdayTotal },
    { label: "Yesterday", value: yesterdayTotal, icon: Calendar, trend: null },
    { label: "This Week", value: weeklyTotal, icon: TrendingUp, trend: true },
    { label: "This Month", value: monthlyTotal, icon: TrendingUp, trend: true },
    { label: "Total Entries", value: totalEntries, icon: Hash, isCount: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card animate-fade-in group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            <stat.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono animate-count-up">
              {stat.isCount ? stat.value.toLocaleString() : `$${stat.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </span>
            {stat.trend !== null && stat.trend !== undefined && (
              <span className={`text-xs flex items-center gap-0.5 ${stat.trend ? "text-accent" : "text-destructive"}`}>
                {stat.trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
