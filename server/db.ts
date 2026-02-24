import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users,
  buckets, InsertBucket, Bucket,
  transactions, InsertTransaction, Transaction,
  goals, InsertGoal, Goal,
  habits, InsertHabit, Habit,
  habitCompletions, InsertHabitCompletion, HabitCompletion,
  journalEntries, InsertJournalEntry, JournalEntry
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Use a connection pool so dropped connections (ECONNRESET from Railway)
      // are automatically replaced instead of crashing the request.
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 5,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserOnboarding(userId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ hasCompletedOnboarding: completed })
    .where(eq(users.id, userId));
}

export async function markUserPurchased(
  userId: number,
  revenueCatAppUserId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({
      hasPurchased: true,
      purchasedAt: new Date(),
      revenueCatAppUserId,
    })
    .where(eq(users.id, userId));
}

export async function getUserByRevenueCatId(revenueCatAppUserId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.revenueCatAppUserId, revenueCatAppUserId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ BUCKET OPERATIONS ============

export async function getUserBuckets(userId: number): Promise<Bucket[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(buckets).where(eq(buckets.userId, userId));
}

export async function createBucket(bucket: InsertBucket): Promise<Bucket> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(buckets).values(bucket);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) throw new Error("Failed to get insert ID");
  const [newBucket] = await db.select().from(buckets).where(eq(buckets.id, insertId));
  if (!newBucket) throw new Error("Failed to retrieve created bucket");
  return newBucket;
}

export async function updateBucketBalance(bucketId: number, newBalance: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(buckets)
    .set({ balance: newBalance })
    .where(eq(buckets.id, bucketId));
}

export async function updateBucketAllocation(bucketId: number, newAllocated: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(buckets)
    .set({ allocated: newAllocated })
    .where(eq(buckets.id, bucketId));
}

export async function getBucketById(bucketId: number): Promise<Bucket | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const [bucket] = await db.select().from(buckets).where(eq(buckets.id, bucketId));
  return bucket;
}

// ============ TRANSACTION OPERATIONS ============

export async function getUserTransactions(userId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date));
}

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(transaction);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) throw new Error("Failed to get insert ID");
  const [newTransaction] = await db.select().from(transactions).where(eq(transactions.id, insertId));
  if (!newTransaction) throw new Error("Failed to retrieve created transaction");
  return newTransaction;
}

export async function deleteTransaction(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(transactions).where(eq(transactions.id, transactionId));
}

export async function getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    )
    .orderBy(desc(transactions.date));
}

// ============ GOAL OPERATIONS ============

export async function getUserGoals(userId: number): Promise<Goal[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
}

export async function createGoal(goal: InsertGoal): Promise<Goal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(goals).values(goal);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) throw new Error("Failed to get insert ID");
  const [newGoal] = await db.select().from(goals).where(eq(goals.id, insertId));
  if (!newGoal) throw new Error("Failed to retrieve created goal");
  return newGoal;
}

export async function updateGoalProgress(goalId: number, currentAmount: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(goals)
    .set({ currentAmount })
    .where(eq(goals.id, goalId));
}

export async function deleteGoal(goalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(goals).where(eq(goals.id, goalId));
}

// ============ HABIT OPERATIONS ============
export async function getUserHabits(userId: number): Promise<Habit[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(habits)
    .where(eq(habits.userId, userId));
}

export async function getHabitById(habitId: number): Promise<Habit | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createHabit(habit: InsertHabit): Promise<Habit> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(habits).values(habit);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) throw new Error("Failed to get insert ID");
  const [newHabit] = await db.select().from(habits).where(eq(habits.id, insertId));
  if (!newHabit) throw new Error("Failed to retrieve created habit");
  return newHabit;
}

export async function deleteHabit(habitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(habits).where(eq(habits.id, habitId));
}

// ============ HABIT COMPLETION OPERATIONS ============

export async function getHabitCompletions(habitId: number): Promise<HabitCompletion[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(habitCompletions)
    .where(eq(habitCompletions.habitId, habitId))
    .orderBy(desc(habitCompletions.completedAt));
}

export async function createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(habitCompletions).values(completion);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) throw new Error("Failed to get insert ID");
  const [newCompletion] = await db.select().from(habitCompletions).where(eq(habitCompletions.id, insertId));
  if (!newCompletion) throw new Error("Failed to retrieve created completion");
  return newCompletion;
}

export async function deleteHabitCompletion(completionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the completion to find the associated transaction
  const [completion] = await db.select().from(habitCompletions)
    .where(eq(habitCompletions.id, completionId))
    .limit(1);
  
  if (completion && completion.transactionId) {
    // Delete the associated transaction first
    await db.delete(transactions).where(eq(transactions.id, completion.transactionId));
  }
  
  // Delete the habit completion
  await db.delete(habitCompletions).where(eq(habitCompletions.id, completionId));
}

// ============ JOURNAL OPERATIONS ============

export async function getUserJournalEntries(userId: number): Promise<JournalEntry[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));
}

export async function createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(journalEntries).values(entry);
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId);
  if (!insertId || isNaN(insertId)) {
    throw new Error("Failed to get insert ID");
  }
  const [newEntry] = await db.select().from(journalEntries).where(eq(journalEntries.id, insertId));
  if (!newEntry) {
    throw new Error("Failed to retrieve created entry");
  }
  return newEntry;
}

export async function deleteJournalEntry(entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
}
