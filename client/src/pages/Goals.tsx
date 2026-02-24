import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, ArrowLeft, Target, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Goals() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    bucketId: "",
    name: "",
    targetAmount: "",
    targetDate: "",
  });

  const { data: goals, refetch } = trpc.goals.list.useQuery();
  const { data: buckets } = trpc.buckets.list.useQuery();
  
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Goal created successfully!");
      refetch();
      setOpen(false);
      setFormData({ bucketId: "", name: "", targetAmount: "", targetDate: "" });
    },
    onError: (error) => {
      toast.error("Failed to create goal: " + error.message);
    },
  });

  const deleteGoal = trpc.goals.delete.useMutation({
    onSuccess: () => {
      toast.success("Goal deleted");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bucketId || !formData.name || !formData.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createGoal.mutate({
      bucketId: parseInt(formData.bucketId),
      name: formData.name,
      targetAmount: formData.targetAmount,
      targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
    });
  };

  const activeGoals = goals?.filter(g => !g.isCompleted) || [];
  const completedGoals = goals?.filter(g => g.isCompleted) || [];

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
                <h1 className="text-3xl font-bold">Goals</h1>
                <p className="text-muted-foreground mt-1">Set and track your financial targets</p>
              </div>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>
                    Set a financial target to work towards
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Goal Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Emergency Fund, New Laptop"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bucket">Associated Bucket</Label>
                    <Select
                      value={formData.bucketId}
                      onValueChange={(value) => setFormData({ ...formData, bucketId: value })}
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

                  <div className="space-y-2">
                    <Label htmlFor="targetAmount">Target Amount</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date (Optional)</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createGoal.isPending}>
                      {createGoal.isPending ? "Creating..." : "Create Goal"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Goals List */}
      <main className="container py-8">
        {/* Active Goals */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Active Goals</h2>
          {activeGoals.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No active goals yet</p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map((goal, index) => {
                const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                const bucket = buckets?.find(b => b.id === goal.bucketId);
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="shadow-soft hover:shadow-soft-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{goal.name}</CardTitle>
                            <CardDescription>{bucket?.name}</CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGoal.mutate({ goalId: goal.id })}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                ${parseFloat(goal.currentAmount).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                of ${parseFloat(goal.targetAmount).toFixed(2)}
                              </p>
                            </div>
                            {goal.targetDate && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Target Date</p>
                                <p className="text-sm font-medium">
                                  {new Date(goal.targetDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map((goal) => {
                const bucket = buckets?.find(b => b.id === goal.bucketId);
                return (
                  <Card key={goal.id} className="shadow-soft opacity-75">
                    <CardHeader>
                      <CardTitle className="line-through">{goal.name}</CardTitle>
                      <CardDescription>{bucket?.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold text-green-600">
                        ✓ Completed
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
