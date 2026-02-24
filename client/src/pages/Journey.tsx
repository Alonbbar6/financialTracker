import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, BookOpen, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

const reflectionPrompts = [
  "How did your spending today align with your values?",
  "What triggered your impulse purchase?",
  "What are you proud of financially this week?",
  "How are you feeling about your financial progress?",
  "What habit are you most committed to building?",
  "What would your future self thank you for doing today?",
];

export default function Journey() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const { data: entries, refetch } = trpc.journal.list.useQuery();
  const { data: buckets } = trpc.buckets.list.useQuery();
  
  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      toast.success("Journal entry saved!");
      refetch();
      setOpen(false);
      setContent("");
      setSelectedPrompt(null);
    },
    onError: (error) => {
      toast.error("Failed to save entry: " + error.message);
    },
  });

  const deleteEntry = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    // Capture financial snapshot
    const financialSnapshot = {
      buckets: buckets?.map(b => ({
        name: b.name,
        balance: parseFloat(b.balance),
      })) || [],
      timestamp: new Date().toISOString(),
    };

    createEntry.mutate({
      content,
      financialSnapshot,
    });
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
                <h1 className="text-3xl font-bold">Journey</h1>
                <p className="text-muted-foreground mt-1">Reflect on your financial growth</p>
              </div>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>New Journal Entry</DialogTitle>
                  <DialogDescription>
                    Reflect on your financial journey and behavioral patterns
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Reflection Prompts */}
                  <div className="space-y-2">
                    <Label>Reflection Prompts (Optional)</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {reflectionPrompts.slice(0, 3).map((prompt, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={selectedPrompt === prompt ? "default" : "outline"}
                          className="w-full justify-start text-left text-sm h-auto py-2"
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            setContent(prompt + "\n\n");
                          }}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Your Reflection</Label>
                    <Textarea
                      id="content"
                      placeholder="Write about your financial journey, decisions, feelings, or insights..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px]"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createEntry.isPending}>
                      {createEntry.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <main className="container py-8">
        {!entries || entries.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Your journey starts here</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Journaling helps you connect your emotions and behaviors to your financial outcomes. 
                Start reflecting on your progress today.
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Line */}
                  {index !== entries.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <Card className="shadow-soft hover:shadow-soft-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Timeline Dot */}
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </CardTitle>
                            <CardDescription>
                              {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntry.mutate({ entryId: entry.id })}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                      
                      {/* Financial Snapshot */}
                      {entry.financialSnapshot && typeof entry.financialSnapshot === 'object' && (entry.financialSnapshot as any).buckets && (
                        <div className="mt-6 pt-6 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Financial Snapshot
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {((entry.financialSnapshot as any).buckets as Array<{name: string, balance: number}>).map((bucket, i) => (
                              <div key={i} className="bg-accent/20 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">{bucket.name}</p>
                                <p className="text-sm font-semibold">${bucket.balance.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
