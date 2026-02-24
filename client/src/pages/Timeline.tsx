import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar as CalendarIcon, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths } from "date-fns";
import { motion } from "framer-motion";

export default function Timeline() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: buckets } = trpc.buckets.list.useQuery();

  // Filter transactions by view mode
  const getFilteredTransactions = () => {
    if (!transactions) return [];

    if (viewMode === "day") {
      return transactions.filter(t => 
        isSameDay(new Date(t.date), selectedDate)
      );
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= weekStart && tDate <= weekEnd;
      });
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const net = totalIncome - totalExpenses;

  // Group transactions by date for daily view
  const groupedByDate = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = format(new Date(transaction.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === "day") {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === "week") {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === "week") {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get bucket name by ID
  const getBucketName = (bucketId: number) => {
    return buckets?.find(b => b.id === bucketId)?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Timeline</h1>
                <p className="text-muted-foreground mt-1">Track your daily, weekly, and monthly expenses</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="day">Daily</TabsTrigger>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {viewMode === "day" && format(selectedDate, "EEEE, MMMM dd, yyyy")}
              {viewMode === "week" && `Week of ${format(startOfWeek(selectedDate), "MMM dd")} - ${format(endOfWeek(selectedDate), "MMM dd, yyyy")}`}
              {viewMode === "month" && format(selectedDate, "MMMM yyyy")}
            </h2>
          </div>

          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-green-600" />
                  Money In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${totalIncome.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-red-600" />
                  Money Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${net.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions Timeline */}
        {viewMode === "day" && (
          <div className="space-y-6">
            {filteredTransactions.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions on this date</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Log your first transaction to start tracking
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>{filteredTransactions.length} transaction(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.type === "INCOME" ? "bg-green-500" : "bg-red-500"
                            }`} />
                            <div>
                              <p className="font-medium">{transaction.description || "Transaction"}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{getBucketName(transaction.bucketId)}</span>
                                <span>•</span>
                                <span className="capitalize">{transaction.category}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "INCOME" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Weekly View */}
        {viewMode === "week" && (
          <div className="space-y-4">
            {eachDayOfInterval({
              start: startOfWeek(selectedDate),
              end: endOfWeek(selectedDate)
            }).map((day, index) => {
              const dayTransactions = transactions?.filter(t => 
                isSameDay(new Date(t.date), day)
              ) || [];
              
              const dayIncome = dayTransactions
                .filter(t => t.type === "INCOME")
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
              
              const dayExpenses = dayTransactions
                .filter(t => t.type === "EXPENSE")
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-soft hover:shadow-soft-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode("day");
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{format(day, "EEEE, MMM dd")}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {dayTransactions.length} transaction(s)
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground">Income</p>
                            <p className="text-lg font-semibold text-green-600">${dayIncome.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Expenses</p>
                            <p className="text-lg font-semibold text-red-600">${dayExpenses.toFixed(2)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net</p>
                          <p className={`text-lg font-semibold ${
                            dayIncome - dayExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(dayIncome - dayExpenses).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Monthly View */}
        {viewMode === "month" && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transaction(s) this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedDates.map((dateKey, index) => {
                  const dayTransactions = groupedByDate[dateKey];
                  const dayIncome = dayTransactions
                    .filter(t => t.type === "INCOME")
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                  
                  const dayExpenses = dayTransactions
                    .filter(t => t.type === "EXPENSE")
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                  return (
                    <motion.div
                      key={dateKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedDate(new Date(dateKey));
                        setViewMode("day");
                      }}
                    >
                      <div>
                        <p className="font-medium">{format(new Date(dateKey), "EEEE, MMMM dd")}</p>
                        <p className="text-sm text-muted-foreground">{dayTransactions.length} transaction(s)</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Income</p>
                          <p className="text-sm font-semibold text-green-600">${dayIncome.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Expenses</p>
                          <p className="text-sm font-semibold text-red-600">${dayExpenses.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Net</p>
                          <p className={`text-sm font-semibold ${
                            dayIncome - dayExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(dayIncome - dayExpenses).toFixed(2)}
                          </p>
                        </div>
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
