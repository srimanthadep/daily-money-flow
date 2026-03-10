import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  pendingByPerson: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
}

const PENDING_COLOR = "hsl(25, 95%, 58%)";
const PAID_COLOR    = "hsl(160, 84%, 39%)";

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

export function RotationCharts({ pendingByPerson, statusData }: Props) {
  const hasPending = pendingByPerson.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
      {/* Top Pending Amounts */}
      <div className="glass rounded-xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Top Pending Amounts
        </h3>
        {hasPending ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pendingByPerson} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={fmt}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
              />
              <Bar dataKey="value" fill={PENDING_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No pending entries 🎉</p>
          </div>
        )}
      </div>

      {/* Paid vs Pending Pie */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Pending vs Paid
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="45%"
              outerRadius={80}
              innerRadius={50}
              dataKey="value"
              paddingAngle={3}
              label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
              labelLine={false}
            >
              <Cell fill={PENDING_COLOR} />
              <Cell fill={PAID_COLOR} />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [v, "people"]}
            />
            <Legend
              formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
