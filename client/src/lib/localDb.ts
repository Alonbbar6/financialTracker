/**
 * Local-only database using localStorage.
 * All financial data stays on device — no server required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bucket {
  id: number;
  name: string;
  balance: string;
  allocated: string;
}

export interface Transaction {
  id: number;
  bucketId: number;
  type: "INCOME" | "EXPENSE";
  amount: string;
  category: "Planned" | "Unplanned" | "Impulse";
  description?: string;
  date: string; // ISO date string
  isRecurring: boolean;
}

export interface Goal {
  id: number;
  bucketId: number;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string;
  isCompleted: boolean;
}

export interface Habit {
  id: number;
  name: string;
  frequency: string;
  price: string;
  bucketId: number;
  type: "INCOME" | "EXPENSE";
  isActive: boolean;
}

export interface HabitCompletion {
  id: number;
  habitId: number;
  completedAt: string;
  amount: string;
  transactionId: number;
}

export interface JournalEntry {
  id: number;
  content: string;
  financialSnapshot: unknown;
  createdAt: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const K = {
  buckets:     "qt_local_buckets",
  transactions:"qt_local_transactions",
  goals:       "qt_local_goals",
  habits:      "qt_local_habits",
  completions: "qt_local_habit_completions",
  journal:     "qt_local_journal",
  counters:    "qt_local_id_counters",
} as const;

// ─── ID generator ─────────────────────────────────────────────────────────────

function nextId(entity: string): number {
  const raw = localStorage.getItem(K.counters);
  const counters: Record<string, number> = raw ? JSON.parse(raw) : {};
  counters[entity] = (counters[entity] ?? 0) + 1;
  localStorage.setItem(K.counters, JSON.stringify(counters));
  return counters[entity];
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ─── Buckets ──────────────────────────────────────────────────────────────────

export function getBuckets(): Bucket[] {
  return load<Bucket>(K.buckets);
}

export function createBuckets(names: string[]): Bucket[] {
  const existing = getBuckets();
  if (existing.length > 0) return existing; // already created
  const buckets: Bucket[] = names.map(name => ({
    id: nextId("bucket"),
    name,
    balance: "0.00",
    allocated: "0.00",
  }));
  save(K.buckets, buckets);
  return buckets;
}

function updateBucket(id: number, patch: Partial<Bucket>): void {
  const buckets = getBuckets().map(b => b.id === id ? { ...b, ...patch } : b);
  save(K.buckets, buckets);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function getTransactions(): Transaction[] {
  return load<Transaction>(K.transactions);
}

export function createTransaction(input: Omit<Transaction, "id">): Transaction {
  const tx: Transaction = { ...input, id: nextId("transaction") };
  const all = getTransactions();
  save(K.transactions, [tx, ...all]);

  // Update bucket allocations
  const buckets = getBuckets();
  if (input.type === "INCOME" && buckets.length > 0) {
    const perBucket = parseFloat(input.amount) / buckets.length;
    buckets.forEach(b => {
      updateBucket(b.id, {
        allocated: (parseFloat(b.allocated) + perBucket).toFixed(2),
      });
    });
  }

  return tx;
}

export function deleteTransaction(id: number): void {
  const all = getTransactions();
  const tx = all.find(t => t.id === id);
  if (!tx) return;

  save(K.transactions, all.filter(t => t.id !== id));

  // Reverse bucket allocation for income
  if (tx.type === "INCOME") {
    const buckets = getBuckets();
    const perBucket = parseFloat(tx.amount) / buckets.length;
    buckets.forEach(b => {
      updateBucket(b.id, {
        allocated: Math.max(0, parseFloat(b.allocated) - perBucket).toFixed(2),
      });
    });
  }
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function getGoals(): Goal[] {
  return load<Goal>(K.goals);
}

export function createGoal(input: Omit<Goal, "id" | "isCompleted">): Goal {
  const goal: Goal = { ...input, id: nextId("goal"), isCompleted: false };
  save(K.goals, [...getGoals(), goal]);
  return goal;
}

export function deleteGoal(id: number): void {
  save(K.goals, getGoals().filter(g => g.id !== id));
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export function getHabits(): Habit[] {
  return load<Habit>(K.habits);
}

export function createHabit(input: Omit<Habit, "id" | "isActive">): Habit {
  const habit: Habit = { ...input, id: nextId("habit"), isActive: true };
  save(K.habits, [...getHabits(), habit]);
  return habit;
}

export function deleteHabit(id: number): void {
  save(K.habits, getHabits().filter(h => h.id !== id));
}

// ─── Habit completions ────────────────────────────────────────────────────────

export function getHabitCompletions(): HabitCompletion[] {
  return load<HabitCompletion>(K.completions);
}

export function getHabitHistory(habitId: number): HabitCompletion[] {
  return getHabitCompletions().filter(c => c.habitId === habitId);
}

export function completeHabit(habitId: number, completedAt: Date): HabitCompletion {
  const habit = getHabits().find(h => h.id === habitId);
  if (!habit) throw new Error("Habit not found");

  // Create a transaction for this completion
  const tx = createTransaction({
    bucketId: habit.bucketId,
    type: habit.type,
    amount: habit.price,
    category: "Planned",
    description: `${habit.name} (Habit)`,
    date: completedAt.toISOString(),
    isRecurring: false,
  });

  const completion: HabitCompletion = {
    id: nextId("completion"),
    habitId,
    completedAt: completedAt.toISOString(),
    amount: habit.price,
    transactionId: tx.id,
  };
  save(K.completions, [...getHabitCompletions(), completion]);
  return completion;
}

export function deleteHabitCompletion(completionId: number): void {
  const all = getHabitCompletions();
  const completion = all.find(c => c.id === completionId);
  if (!completion) return;

  // Delete the associated transaction (reverses bucket effects)
  deleteTransaction(completion.transactionId);
  save(K.completions, all.filter(c => c.id !== completionId));
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export function getJournal(): JournalEntry[] {
  return load<JournalEntry>(K.journal);
}

export function createJournalEntry(input: { content: string; financialSnapshot: unknown }): JournalEntry {
  const entry: JournalEntry = {
    id: nextId("journal"),
    content: input.content,
    financialSnapshot: input.financialSnapshot,
    createdAt: new Date().toISOString(),
  };
  save(K.journal, [entry, ...getJournal()]);
  return entry;
}

export function deleteJournalEntry(id: number): void {
  save(K.journal, getJournal().filter(e => e.id !== id));
}
