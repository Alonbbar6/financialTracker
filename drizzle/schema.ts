import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  hasCompletedOnboarding: boolean("hasCompletedOnboarding").default(false).notNull(),
  // One-time IAP purchase tracking
  hasPurchased: boolean("hasPurchased").default(false).notNull(),
  purchasedAt: timestamp("purchasedAt"),
  revenueCatAppUserId: varchar("revenueCatAppUserId", { length: 128 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Virtual money buckets for organizing funds
 */
export const buckets = mysqlTable("buckets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  allocated: decimal("allocated", { precision: 10, scale: 2 }).default("0.00").notNull(), // Total allocated from income (20% each)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bucket = typeof buckets.$inferSelect;
export type InsertBucket = typeof buckets.$inferInsert;

/**
 * Income and expense transactions
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bucketId: int("bucketId").notNull(),
  type: mysqlEnum("type", ["INCOME", "EXPENSE"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["Planned", "Unplanned", "Impulse"]).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringFrequency: varchar("recurringFrequency", { length: 50 }), // daily, weekly, monthly
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Financial goals tied to buckets
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bucketId: int("bucketId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  targetDate: timestamp("targetDate"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * User-defined habits for building financial discipline
 */
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(), // daily, weekly, custom
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Amount spent/earned per completion
  bucketId: int("bucketId").notNull(), // Which bucket this habit affects
  type: mysqlEnum("type", ["INCOME", "EXPENSE"]).notNull(), // Is this a spending or earning habit
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

/**
 * Habit completion records for streak tracking
 */
export const habitCompletions = mysqlTable("habitCompletions", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  completedAt: timestamp("completedAt").notNull(),
  transactionId: int("transactionId"), // Link to the transaction created when completing the habit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = typeof habitCompletions.$inferInsert;

/**
 * Journal entries with financial snapshots
 */
export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  financialSnapshot: json("financialSnapshot"), // JSON blob of bucket balances and habit streaks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;
