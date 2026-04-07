import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar as CalendarIcon, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths } from "date-fns";
import { motion } from "framer-motion";

export default function Timeline() {
  const { transactions, buckets } = useAppData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  const getFilteredTransactions = () => {
    if (viewMode === "day") return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
    if (viewMode === "week") {
      const s = startOfWeek(selectedDate), e = endOfWeek(selectedDate);
      return transactions.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    const s = startOfMonth(selectedDate), e = endOfMonth(selectedDate);
    return transactions.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
  };

  const filtered = getFilteredTransactions();
  const totalIncome   = filtered.filter(t => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = filtered.filter(t => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
  const net = totalIncome - totalExpenses;

  const groupedByDate = filtered.reduce((acc, t) => {
    const k = format(new Date(t.date), "yyyy-MM-dd");
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {} as Record<string, typeof filtered>);
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const navigatePrev = () => {
    if (viewMode === "day") setSelectedDate(subDays(selectedDate, 1));
    else if (viewMode === "week") setSelectedDate(subWeeks(selectedDate, 1));
    else setSelectedDate(subMonths(selectedDate, 1));
  };
  const navigateNext = () => {
    if (viewMode === "day") setSelectedDate(addDays(selectedDate, 1));
    else if (viewMode === "week") setSelectedDate(addWeeks(selectedDate, 1));
    else setSelectedDate(addMonths(selectedDate, 1));
  };

  const getBucketName = (bucketId: number) => buckets.find(b => b.id === bucketId)?.name || "Unknown";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card safe-area-top">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">Timeline</h1>
                <p className="text-muted-foreground text-sm">Daily, weekly &amp; monthly view</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"><CalendarIcon className="h-4 w-4 mr-1" />{format(selectedDate, "MMM d")}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="day">Daily</TabsTrigger>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="icon" onClick={navigatePrev}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {viewMode === "day" && format(selectedDate, "EEEE, MMMM dd, yyyy")}
              {viewMode === "week" && `Week of ${format(startOfWeek(selectedDate), "MMM dd")} - ${format(endOfWeek(selectedDate), "MMM dd, yyyy")}`}
              {viewMode === "month" && format(selectedDate, "MMMM yyyy")}
            </h2>
          </div>
          <Button variant="outline" size="icon" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ArrowDown className="h-4 w-4 text-green-600" />Money In</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</div></CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ArrowUp className="h-4 w-4 text-red-600" />Money Out</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div></CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle></CardHeader>
              <CardContent><div className={`text-3xl font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>${net.toFixed(2)}</div></CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Day view */}
        {viewMode === "day" && (
          filtered.length === 0 ? (
            <Card className="shadow-soft"><CardContent className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions on this date</p>
            </CardContent></Card>
          ) : (
            <Card className="shadow-soft">
              <CardHeader><CardTitle>Transactions</CardTitle><CardDescription>{filtered.length} transaction(s)</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filtered.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${t.type === "INCOME" ? "bg-green-500" : "bg-red-500"}`} />
                          <div>
                            <p className="font-medium">{t.description || "Transaction"}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{getBucketName(t.bucketId)}</span><span>•</span><span className="capitalize">{t.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "INCOME" ? "+" : "-"}${parseFloat(t.amount).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Week view */}
        {viewMode === "week" && (
          <div className="space-y-4">
            {eachDayOfInterval({ start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }).map((day, i) => {
              const dayTx = transactions.filter(t => isSameDay(new Date(t.date), day));
              const inc = dayTx.filter(t => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
              const exp = dayTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
              return (
                <motion.div key={day.toISOString()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="shadow-soft hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => { setSelectedDate(day); setViewMode("day"); }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{format(day, "EEEE, MMM dd")}</CardTitle>
                        <span className="text-sm text-muted-foreground">{dayTx.length} transaction(s)</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6">
                          <div><p className="text-xs text-muted-foreground">Income</p><p className="text-lg font-semibold text-green-600">${inc.toFixed(2)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-semibold text-red-600">${exp.toFixed(2)}</p></div>
                        </div>
                        <div><p className="text-xs text-muted-foreground">Net</p><p className={`text-lg font-semibold ${inc - exp >= 0 ? "text-green-600" : "text-red-600"}`}>${(inc - exp).toFixed(2)}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Month view */}
        {viewMode === "month" && (
          <Card className="shadow-soft">
            <CardHeader><CardTitle>Monthly Summary</CardTitle><CardDescription>{filtered.length} transaction(s) this month</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedDates.map((dateKey, i) => {
                  const dayTx = groupedByDate[dateKey];
                  const inc = dayTx.filter(t => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
                  const exp = dayTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);
                  return (
                    <motion.div key={dateKey} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow cursor-pointer"
                      onClick={() => { setSelectedDate(new Date(dateKey)); setViewMode("day"); }}>
                      <div>
                        <p className="font-medium">{format(new Date(dateKey), "EEEE, MMMM dd")}</p>
                        <p className="text-sm text-muted-foreground">{dayTx.length} transaction(s)</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right"><p className="text-xs text-muted-foreground">Income</p><p className="text-sm font-semibold text-green-600">${inc.toFixed(2)}</p></div>
                        <div className="text-right"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-sm font-semibold text-red-600">${exp.toFixed(2)}</p></div>
                        <div className="text-right"><p className="text-xs text-muted-foreground">Net</p><p className={`text-sm font-semibold ${inc - exp >= 0 ? "text-green-600" : "text-red-600"}`}>${(inc - exp).toFixed(2)}</p></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
