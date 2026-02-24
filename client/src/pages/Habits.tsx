import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Plus, Check, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function Habits() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    frequency: "daily",
    price: "",
    bucketId: 0,
    type: "EXPENSE" as "INCOME" | "EXPENSE",
  });

  const { data: habits, refetch } = trpc.habits.list.useQuery();
  const { data: buckets } = trpc.buckets.list.useQuery();
  const createHabit = trpc.habits.create.useMutation({
    onSuccess: () => {
      toast.success("Habit created successfully!");
      refetch();
      setIsDialogOpen(false);
      setNewHabit({ name: "", frequency: "daily", price: "", bucketId: 0, type: "EXPENSE" });
    },
  });
  const completeHabit = trpc.habits.complete.useMutation({
    onSuccess: () => {
      refetch();
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("Great job! Habit completed 🎉");
    },
  });
  const deleteHabit = trpc.habits.delete.useMutation({
    onSuccess: () => {
      toast.success("Habit deleted");
      refetch();
    },
  });

  const handleCreateHabit = () => {
    if (!newHabit.name || !newHabit.price || !newHabit.bucketId) {
      toast.error("Please fill in all fields");
      return;
    }
    
    createHabit.mutate({
      name: newHabit.name,
      frequency: newHabit.frequency,
      price: newHabit.price,
      bucketId: newHabit.bucketId,
      type: newHabit.type,
    });
  };

  const handleCompleteHabit = (habitId: number) => {
    completeHabit.mutate({
      habitId,
      completedAt: new Date(),
    });
  };

  // Group habits by type
  const expenseHabits = habits?.filter(h => h.type === "EXPENSE" && h.isActive) || [];
  const incomeHabits = habits?.filter(h => h.type === "INCOME" && h.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Financial Habits</h1>
                <p className="text-muted-foreground mt-1">
                  Track recurring expenses and income activities
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Financial Habit</DialogTitle>
                  <DialogDescription>
                    Track recurring expenses (coffee, yoga) or income activities (investments, freelance work)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Habit Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Buy morning coffee, Invest in stocks"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newHabit.type}
                      onValueChange={(value: "INCOME" | "EXPENSE") => setNewHabit({ ...newHabit, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXPENSE">Expense (Money Out)</SelectItem>
                        <SelectItem value="INCOME">Income (Money In)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Amount per Completion</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        value={newHabit.price}
                        onChange={(e) => setNewHabit({ ...newHabit, price: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bucket">Bucket</Label>
                    <Select
                      value={newHabit.bucketId.toString()}
                      onValueChange={(value) => setNewHabit({ ...newHabit, bucketId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bucket" />
                      </SelectTrigger>
                      <SelectContent>
                        {buckets?.map((bucket) => (
                          <SelectItem key={bucket.id} value={bucket.id.toString()}>
                            {bucket.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newHabit.frequency}
                      onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={handleCreateHabit} className="w-full" disabled={createHabit.isPending}>
                    {createHabit.isPending ? "Creating..." : "Create Habit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Expense Habits */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h2 className="text-2xl font-bold">Expense Habits</h2>
          </div>
          
          {expenseHabits.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No expense habits yet. Add one to start tracking!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseHabits.map((habit, index) => {
                const bucket = buckets?.find(b => b.id === habit.bucketId);
                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="shadow-soft hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{habit.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteHabit.mutate({ habitId: habit.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardTitle>
                        <CardDescription>
                          ${parseFloat(habit.price).toFixed(2)} • {bucket?.name} • {habit.frequency}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleCompleteHabit(habit.id)}
                            disabled={completeHabit.isPending}
                            className="w-full"
                            variant="outline"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                          <Link href={`/habits/${habit.id}/history`}>
                            <Button variant="ghost" className="w-full text-xs">
                              View History
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Habits */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-2xl font-bold">Income Habits</h2>
          </div>
          
          {incomeHabits.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No income habits yet. Add one to track positive activities!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeHabits.map((habit, index) => {
                const bucket = buckets?.find(b => b.id === habit.bucketId);
                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="shadow-soft hover:shadow-md transition-shadow border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{habit.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteHabit.mutate({ habitId: habit.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          +${parseFloat(habit.price).toFixed(2)} • {bucket?.name} • {habit.frequency}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleCompleteHabit(habit.id)}
                            disabled={completeHabit.isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                          <Link href={`/habits/${habit.id}/history`}>
                            <Button variant="ghost" className="w-full text-xs">
                              View History
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
