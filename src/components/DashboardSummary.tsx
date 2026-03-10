<<<<<<< HEAD
import { AlertCircle, CheckCircle2, DollarSign, Users } from "lucide-react";

interface Props {
  totalPending: number;
  totalPaid: number;
  totalAll: number;
  pendingCount: number;
  paidCount: number;
  totalCount: number;
  expensesTotal?: number;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function DashboardSummary({
  totalPending,
  totalPaid,
  totalAll,
  pendingCount,
  paidCount,
  totalCount,
  expensesTotal = 0,
}: Props) {
  const cards = [
    {
      label: "Total Pending",
      value: fmt(totalPending),
      sub: `${pendingCount} people owe you`,
      icon: AlertCircle,
      iconClass: "text-orange-500",
      bgClass: "bg-orange-500/10",
    },
    {
      label: "Net Balance",
      value: fmt(totalPending - expensesTotal),
      sub: "pending minus expenses",
      icon: CheckCircle2,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      label: "Daily Expenses",
      value: fmt(expensesTotal),
      sub: "your total spending",
      icon: DollarSign,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
    {
      label: "People Count",
      value: String(totalCount),
      sub: `${pendingCount} pending · ${paidCount} paid`,
      icon: Users,
      iconClass: "text-violet-500",
      bgClass: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="stat-card animate-fade-in group cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`${c.bgClass} p-1.5 rounded-lg`}>
                <c.icon className={`w-4 h-4 ${c.iconClass}`} />
              </div>
            </div>
            <div className="text-xl font-bold font-mono leading-tight">
              {c.value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5">
              {c.sub}
            </div>
          </div>
        ))}
      </div>
=======
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
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
    </div>
  );
}
