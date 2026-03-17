import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useExpenses } from "@/hooks/useExpenses";
import { useMemo } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { expenses } = useExpenses();

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const COLORS = ['#F97316', '#0EA5E9', '#8B5CF6', '#10B981', '#F43F5E', '#EAB308', '#64748B'];

  return (
    <div className="container py-8 space-y-8 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="rounded-xl hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">Deep dive into your financial flow and spending habits</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Flow Trends */}
        <div className="space-y-4">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Historical Flow</div>
          <AnalyticsDashboard />
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Spending Categories</div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 800 }}
                  />
                  <Legend 
                    layout="horizontal" 
                    align="center" 
                    verticalAlign="bottom" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '30px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
