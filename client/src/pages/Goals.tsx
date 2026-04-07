import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
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
  const { buckets, goals, createGoal, deleteGoal } = useAppData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ bucketId: "", name: "", targetAmount: "", targetDate: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bucketId || !formData.name || !formData.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    createGoal({
      bucketId: parseInt(formData.bucketId),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount).toFixed(2),
      currentAmount: "0.00",
      targetDate: formData.targetDate || undefined,
    });
    toast.success("Goal created successfully!");
    setOpen(false);
    setFormData({ bucketId: "", name: "", targetAmount: "", targetDate: "" });
  };

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card safe-area-top">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">Goals</h1>
                <p className="text-muted-foreground text-sm">Set and track your financial targets</p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0"><Plus className="h-4 w-4 mr-1" />New Goal</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>Set a financial target to work towards</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Goal Name</Label>
                    <Input placeholder="e.g., Emergency Fund, New Laptop" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Associated Bucket</Label>
                    <Select value={formData.bucketId} onValueChange={(v) => setFormData({ ...formData, bucketId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a bucket" /></SelectTrigger>
                      <SelectContent>
                        {buckets.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date (Optional)</Label>
                    <Input type="date" value={formData.targetDate} onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Goal</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Active Goals</h2>
          {activeGoals.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No active goals yet</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Goal</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map((goal, index) => {
                const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                const bucket = buckets.find(b => b.id === goal.bucketId);
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className="shadow-soft hover:shadow-soft-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{goal.name}</CardTitle>
                            <CardDescription>{bucket?.name}</CardDescription>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => { deleteGoal(goal.id); toast.success("Goal deleted"); }}>
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
                              <p className="text-2xl font-bold text-primary">${parseFloat(goal.currentAmount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">of ${parseFloat(goal.targetAmount).toFixed(2)}</p>
                            </div>
                            {goal.targetDate && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Target Date</p>
                                <p className="text-sm font-medium">{new Date(goal.targetDate).toLocaleDateString()}</p>
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

        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map((goal) => {
                const bucket = buckets.find(b => b.id === goal.bucketId);
                return (
                  <Card key={goal.id} className="shadow-soft opacity-75">
                    <CardHeader>
                      <CardTitle className="line-through">{goal.name}</CardTitle>
                      <CardDescription>{bucket?.name}</CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-lg font-semibold text-green-600">✓ Completed</p></CardContent>
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
