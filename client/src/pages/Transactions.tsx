import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function Transactions() {
  const { buckets, transactions, createTransaction } = useAppData();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    bucketId: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    category: "Planned" as "Planned" | "Unplanned" | "Impulse",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => setFormData({
    bucketId: "", type: "EXPENSE", amount: "", category: "Planned",
    description: "", date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === "EXPENSE" && !formData.bucketId) {
      toast.error("Please select a bucket for this expense");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsPending(true);
    try {
      createTransaction({
        bucketId: formData.type === "EXPENSE" ? parseInt(formData.bucketId) : (buckets[0]?.id || 0),
        type: formData.type,
        amount: parseFloat(formData.amount).toFixed(2),
        category: formData.category,
        description: formData.description || undefined,
        date: new Date(formData.date).toISOString(),
        isRecurring: false,
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ["#4B82C5", "#86A8E7", "#9AF0F7"] });
      toast.success("Transaction logged! 🎉");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to add transaction");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card safe-area-top">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">Transactions</h1>
                <p className="text-muted-foreground text-sm">Track your income and expenses</p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0"><Plus className="h-4 w-4 mr-1" />Add</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>Log a new income or expense transaction</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v: "INCOME" | "EXPENSE") => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "EXPENSE" && (
                    <div className="space-y-2">
                      <Label>Bucket</Label>
                      <Select value={formData.bucketId} onValueChange={(v) => setFormData({ ...formData, bucketId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select a bucket" /></SelectTrigger>
                        <SelectContent>
                          {buckets.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Choose which envelope this expense comes from</p>
                    </div>
                  )}

                  {formData.type === "INCOME" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-100">💡 Income will automatically split 20% across all {buckets.length} buckets</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number" step="0.01" min="0.01" placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace("-", "") })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Behavioral Category</Label>
                    <Select value={formData.category} onValueChange={(v: "Planned" | "Unplanned" | "Impulse") => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="Unplanned">Unplanned</SelectItem>
                        <SelectItem value="Impulse">Impulse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea placeholder="What was this for?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Transaction"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>Your complete transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First Transaction</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const bucket = buckets.find(b => b.id === transaction.bucketId);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.category === "Planned" ? "bg-green-500" :
                            transaction.category === "Unplanned" ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                          <div>
                            <p className="font-medium">{transaction.description || "Transaction"}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{bucket?.name}</span>
                              <span>•</span>
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${transaction.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "INCOME" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
