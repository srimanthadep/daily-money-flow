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
    </div>
  );
}
