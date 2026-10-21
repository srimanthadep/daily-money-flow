import { AlertCircle, Users } from "lucide-react";

interface Props {
  totalPending: number;
  pendingCount: number;
  paidCount?: number;
  totalCount: number;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function DashboardSummary({
  totalPending,
  pendingCount,
  paidCount = 0,
  totalCount,
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
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 md:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] animate-fade-in group cursor-default hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-[9px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {c.label}
              </span>
              <div className={`${c.bgClass} p-1.5 md:p-2 rounded-xl`}>
                <c.icon className={`w-3.5 h-3.5 md:w-5 md:h-5 ${c.iconClass}`} />
              </div>
            </div>
            <div className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {c.value}
            </div>
            <div className="text-[10px] md:text-[12px] text-slate-400 dark:text-slate-400 mt-2 font-medium">
              {c.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
