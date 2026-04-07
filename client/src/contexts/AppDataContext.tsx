import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as db from "@/lib/localDb";
import type { Bucket, Transaction, Goal, Habit, HabitCompletion, JournalEntry } from "@/lib/localDb";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppDataContextType {
  // Data
  buckets: Bucket[];
  transactions: Transaction[];
  goals: Goal[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  journal: JournalEntry[];

  // Refresh (call after any mutation to re-read from localStorage)
  refresh: () => void;

  // Buckets
  createBuckets: (names: string[]) => Bucket[];

  // Transactions
  createTransaction: (input: Omit<Transaction, "id">) => Transaction;
  deleteTransaction: (id: number) => void;

  // Goals
  createGoal: (input: Omit<Goal, "id" | "isCompleted">) => Goal;
  deleteGoal: (id: number) => void;

  // Habits
  createHabit: (input: Omit<Habit, "id" | "isActive">) => Habit;
  completeHabit: (habitId: number) => HabitCompletion;
  deleteHabit: (id: number) => void;
  deleteHabitCompletion: (completionId: number) => void;

  // Journal
  createJournalEntry: (input: { content: string; financialSnapshot: unknown }) => JournalEntry;
  deleteJournalEntry: (id: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextType | null>(null);

function loadAll() {
  return {
    buckets:          db.getBuckets(),
    transactions:     db.getTransactions(),
    goals:            db.getGoals(),
    habits:           db.getHabits(),
    habitCompletions: db.getHabitCompletions(),
    journal:          db.getJournal(),
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadAll);

  const refresh = useCallback(() => setState(loadAll()), []);

  const createBuckets = useCallback((names: string[]) => {
    const result = db.createBuckets(names);
    refresh();
    return result;
  }, [refresh]);

  const createTransaction = useCallback((input: Omit<Transaction, "id">) => {
    const result = db.createTransaction(input);
    refresh();
    return result;
  }, [refresh]);

  const deleteTransaction = useCallback((id: number) => {
    db.deleteTransaction(id);
    refresh();
  }, [refresh]);

  const createGoal = useCallback((input: Omit<Goal, "id" | "isCompleted">) => {
    const result = db.createGoal(input);
    refresh();
    return result;
  }, [refresh]);

  const deleteGoal = useCallback((id: number) => {
    db.deleteGoal(id);
    refresh();
  }, [refresh]);

  const createHabit = useCallback((input: Omit<Habit, "id" | "isActive">) => {
    const result = db.createHabit(input);
    refresh();
    return result;
  }, [refresh]);

  const completeHabit = useCallback((habitId: number) => {
    const result = db.completeHabit(habitId, new Date());
    refresh();
    return result;
  }, [refresh]);

  const deleteHabit = useCallback((id: number) => {
    db.deleteHabit(id);
    refresh();
  }, [refresh]);

  const deleteHabitCompletion = useCallback((completionId: number) => {
    db.deleteHabitCompletion(completionId);
    refresh();
  }, [refresh]);

  const createJournalEntry = useCallback((input: { content: string; financialSnapshot: unknown }) => {
    const result = db.createJournalEntry(input);
    refresh();
    return result;
  }, [refresh]);

  const deleteJournalEntry = useCallback((id: number) => {
    db.deleteJournalEntry(id);
    refresh();
  }, [refresh]);

  return (
    <AppDataContext.Provider value={{
      ...state,
      refresh,
      createBuckets,
      createTransaction,
      deleteTransaction,
      createGoal,
      deleteGoal,
      createHabit,
      completeHabit,
      deleteHabit,
      deleteHabitCompletion,
      createJournalEntry,
      deleteJournalEntry,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
