import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";

export default function HabitHistory() {
  const [, params] = useRoute("/habits/:id/history");
  const habitId = parseInt(params?.id || "0");

  const { data: habits } = trpc.habits.list.useQuery();
  const { data: history } = trpc.habits.getHistory.useQuery({ habitId });
  const { data: buckets } = trpc.buckets.list.useQuery();
  const utils = trpc.useUtils();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const deleteCompletion = trpc.habits.deleteCompletion.useMutation({
    onSuccess: () => {
      toast.success("Completion deleted");
      utils.habits.getHistory.invalidate({ habitId });
      utils.habits.list.invalidate();
      utils.buckets.list.invalidate();
      utils.transactions.list.invalidate();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete completion");
      console.error(error);
      setDeletingId(null);
    },
  });
  
  const handleDelete = (completionId: number) => {
    setDeletingId(completionId);
    deleteCompletion.mutate({ completionId });
  };

  const habit = habits?.find(h => h.id === habitId);
  const bucket = buckets?.find(b => b.id === habit?.bucketId);

  if (!habit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground">Habit not found</p>
            <Link href="/habits">
              <Button className="mt-4">Back to Habits</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = history?.reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0;
  const completionCount = history?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/habits">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{habit.name}</h1>
              <p className="text-muted-foreground mt-1">
                {bucket?.name} • {habit.frequency}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completionCount}</div>
              <p className="text-xs text-muted-foreground mt-1">times completed</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {habit.type === "INCOME" ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <div className={`text-3xl font-bold ${habit.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {habit.type === "INCOME" ? "+" : "-"}${totalAmount.toFixed(2)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {habit.type === "INCOME" ? "earned" : "spent"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Per Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">${parseFloat(habit.price).toFixed(2)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">each time</p>
            </CardContent>
          </Card>
        </div>

        {/* History Timeline */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Completion History</CardTitle>
            <CardDescription>
              All times you've completed this habit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!history || history.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completions yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete this habit to start tracking your progress
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent">
                        <Calendar className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(entry.completedAt), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.completedAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-lg font-bold ${habit.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {habit.type === "INCOME" ? "+" : "-"}${parseFloat(entry.amount).toFixed(2)}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deletingId === entry.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this completion?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the completion from your history and delete the associated transaction. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
