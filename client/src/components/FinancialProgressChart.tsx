import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function FinancialProgressChart() {
  const { transactions } = useAppData();
  const [timeRange, setTimeRange] = useState(30);

  const now = new Date();
  const startDate = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);

  // Build a map of all dates in range
  const dailyMap = new Map<string, { date: string; moneyIn: number; moneyOut: number; net: number }>();
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { date: key, moneyIn: 0, moneyOut: 0, net: 0 });
  }

  for (const t of transactions) {
    const key = new Date(t.date).toISOString().split("T")[0];
    if (dailyMap.has(key)) {
      const day = dailyMap.get(key)!;
      if (t.type === "INCOME") day.moneyIn += parseFloat(t.amount);
      else day.moneyOut += parseFloat(t.amount);
    }
  }

  let cumulative = 0;
  const chartData = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => {
      cumulative += d.moneyIn - d.moneyOut;
      return {
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        "Money In": d.moneyIn,
        "Money Out": d.moneyOut,
        "Net Balance": cumulative,
      };
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Progress</CardTitle>
            <CardDescription>Track your money in and money out over time</CardDescription>
          </div>
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} />
            <Legend />
            <Line type="monotone" dataKey="Money In" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Money Out" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Net Balance" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
