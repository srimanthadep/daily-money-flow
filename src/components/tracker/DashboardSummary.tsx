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
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-slate-100 p-3 md:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] animate-fade-in group cursor-default hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {c.label}
              </span>
              <div className={`${c.bgClass} p-1.5 md:p-2 rounded-xl`}>
                <c.icon className={`w-3.5 h-3.5 md:w-5 md:h-5 ${c.iconClass}`} />
              </div>
            </div>
            <div className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {c.value}
            </div>
            <div className="text-[10px] md:text-[12px] text-slate-400 mt-2 font-medium">
              {c.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
