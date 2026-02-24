import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use different user IDs to avoid hitting the 5-bucket limit across tests
// Start from a high number to avoid conflicts with existing database data
let testUserIdCounter = 10000 + Math.floor(Math.random() * 10000);

function createAuthContext(): { ctx: TrpcContext } {
  const userId = testUserIdCounter++;
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    hasCompletedOnboarding: true,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Buckets API", () => {
  it("should create a new bucket and enforce 5-bucket limit", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first bucket - should succeed
    const result = await caller.buckets.create({
      name: "Test Bucket 1",
      balance: "100.00",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    
    // Try to create 5 more buckets - only 4 more should succeed
    for (let i = 2; i <= 5; i++) {
      await caller.buckets.create({
        name: `Test Bucket ${i}`,
        balance: "0.00",
      });
    }
    
    // 6th bucket should fail
    await expect(
      caller.buckets.create({
        name: "Test Bucket 6",
        balance: "0.00",
      })
    ).rejects.toThrow("Maximum of 5 buckets allowed");
  });

  it("should list user buckets", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.buckets.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update bucket balance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bucket first
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
      balance: "100.00",
    });

    // Update its balance
    const result = await caller.buckets.updateBalance({
      bucketId: bucket.id,
      newBalance: "200.00",
    });

    expect(result.success).toBe(true);
  });
});

describe("Transactions API", () => {
  it("should create a new transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bucket first
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
      balance: "100.00",
    });

    const result = await caller.transactions.create({
      bucketId: bucket.id,
      type: "EXPENSE",
      amount: "50.00",
      category: "Planned",
      description: "Test transaction",
      date: new Date(),
      isRecurring: false,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("should list user transactions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Goals API", () => {
  it("should create a new goal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bucket first
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
      balance: "100.00",
    });

    const result = await caller.goals.create({
      bucketId: bucket.id,
      name: "Test Goal",
      targetAmount: "1000.00",
      currentAmount: "0.00",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("should update goal progress", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bucket and goal first
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
      balance: "100.00",
    });

    const goal = await caller.goals.create({
      bucketId: bucket.id,
      name: "Test Goal",
      targetAmount: "1000.00",
      currentAmount: "0.00",
    });

    const result = await caller.goals.updateProgress({
      goalId: goal.id,
      currentAmount: "500.00",
    });

    expect(result.success).toBe(true);
  });
});

describe("Habits API", () => {
  it("should create a new habit", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a bucket for the habit
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
    });

    const result = await caller.habits.create({
      name: "Test Habit",
      frequency: "daily",
      price: "5.00",
      bucketId: bucket.id,
      type: "EXPENSE",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.price).toBe("5.00");
    expect(result.bucketId).toBe(bucket.id);
    expect(result.type).toBe("EXPENSE");
  });

  it("should complete a habit", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a bucket for the habit
    const bucket = await caller.buckets.create({
      name: "Test Bucket",
    });

    const habit = await caller.habits.create({
      name: "Test Habit",
      frequency: "daily",
      price: "10.00",
      bucketId: bucket.id,
      type: "EXPENSE",
    });

    const result = await caller.habits.complete({
      habitId: habit.id,
      completedAt: new Date(),
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });
});

describe("Journal API", () => {
  it("should create a new journal entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.journal.create({
      content: "Test journal entry",
      financialSnapshot: { buckets: [] },
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("should list user journal entries", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.journal.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
