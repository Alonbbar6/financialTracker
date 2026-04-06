import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Bucket operations
  buckets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBuckets(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        balance: z.string().default("0.00"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Safety check: only allow 5 buckets per user
        const existingBuckets = await db.getUserBuckets(ctx.user.id);
        if (existingBuckets.length >= 5) {
          throw new Error("Maximum of 5 buckets allowed");
        }
        
        return await db.createBucket({
          userId: ctx.user.id,
          name: input.name,
          balance: input.balance,
        });
      }),
    
    updateBalance: protectedProcedure
      .input(z.object({
        bucketId: z.number(),
        newBalance: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateBucketBalance(input.bucketId, input.newBalance);
        return { success: true };
      }),
  }),

  // Transaction operations
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTransactions(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bucketId: z.number(),
        type: z.enum(["INCOME", "EXPENSE"]),
        amount: z.string(),
        category: z.enum(["Planned", "Unplanned", "Impulse"]),
        description: z.string().optional(),
        date: z.date(),
        isRecurring: z.boolean().default(false),
        recurringFrequency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const transaction = await db.createTransaction({
          userId: ctx.user.id,
          ...input,
        });
        
        // Handle envelope budgeting
        if (input.type === "INCOME") {
          // When income is added, split 20% across all 5 buckets
          const userBuckets = await db.getUserBuckets(ctx.user.id);
          const amount = parseFloat(input.amount);
          const perBucketAllocation = amount / 5; // 20% each
          
          for (const bucket of userBuckets) {
            const currentAllocated = parseFloat(bucket.allocated || "0");
            const newAllocated = currentAllocated + perBucketAllocation;
            await db.updateBucketAllocation(bucket.id, newAllocated.toFixed(2));
          }
        } else {
          // When expense is added, track spending against bucket
          const bucket = await db.getBucketById(input.bucketId);
          if (bucket) {
            const currentBalance = parseFloat(bucket.balance);
            const amount = parseFloat(input.amount);
            const newBalance = currentBalance - amount;
            await db.updateBucketBalance(input.bucketId, newBalance.toFixed(2));
          }
        }
        
        return transaction;
      }),
    
    delete: protectedProcedure
      .input(z.object({
        transactionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteTransaction(input.transactionId);
        return { success: true };
      }),
  }),

  // Goal operations
  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserGoals(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bucketId: z.number(),
        name: z.string(),
        targetAmount: z.string(),
        currentAmount: z.string().default("0.00"),
        targetDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createGoal({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    updateProgress: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        currentAmount: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateGoalProgress(input.goalId, input.currentAmount);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        goalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteGoal(input.goalId);
        return { success: true };
      }),
  }),

  // Habit operations
  habits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserHabits(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        frequency: z.string(),
        price: z.string(),
        bucketId: z.number(),
        type: z.enum(["INCOME", "EXPENSE"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createHabit({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    complete: protectedProcedure
      .input(z.object({
        habitId: z.number(),
        completedAt: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get habit details to create transaction
        const habit = await db.getHabitById(input.habitId);
        if (!habit) {
          throw new Error("Habit not found");
        }
        
        // Automatically create transaction first
        const transaction = await db.createTransaction({
          userId: ctx.user.id,
          bucketId: habit.bucketId,
          type: habit.type,
          amount: habit.price,
          category: "Planned", // Habits are planned activities
          description: `${habit.name} (Habit)`,
          date: input.completedAt,
          isRecurring: false,
        });
        
        // Create habit completion record with transactionId
        const completion = await db.createHabitCompletion({
          habitId: input.habitId,
          completedAt: input.completedAt,
          transactionId: transaction.id,
        });
        
        // Update bucket allocation if it's income
        if (habit.type === "INCOME") {
          const buckets = await db.getUserBuckets(ctx.user.id);
          const incomeAmount = parseFloat(habit.price);
          const allocationPerBucket = incomeAmount / buckets.length;
          
          for (const bucket of buckets) {
            const currentAllocated = parseFloat(bucket.allocated || "0");
            const newAllocated = (currentAllocated + allocationPerBucket).toFixed(2);
            await db.updateBucketAllocation(bucket.id, newAllocated);
          }
        }
        
        return completion;
      }),
    
    getCompletions: protectedProcedure
      .input(z.object({
        habitId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getHabitCompletions(input.habitId);
      }),
    
    getHistory: protectedProcedure
      .input(z.object({
        habitId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const habit = await db.getHabitById(input.habitId);
        if (!habit) {
          throw new Error("Habit not found");
        }
        
        const completions = await db.getHabitCompletions(input.habitId);
        
        // Return completions with habit details
        return completions.map(completion => ({
          ...completion,
          amount: habit.price,
          habitName: habit.name,
          bucketId: habit.bucketId,
          type: habit.type,
        }));
      }),
    
    delete: protectedProcedure
      .input(z.object({
        habitId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteHabit(input.habitId);
        return { success: true };
      }),
    
    deleteCompletion: protectedProcedure
      .input(z.object({
        completionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Delete the habit completion and its associated transaction
        await db.deleteHabitCompletion(input.completionId);
        return { success: true };
      }),
  }),

  // Journal operations
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserJournalEntries(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        content: z.string(),
        financialSnapshot: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createJournalEntry({
          userId: ctx.user.id,
          content: input.content,
          financialSnapshot: input.financialSnapshot,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({
        entryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteJournalEntry(input.entryId);
        return { success: true };
      }),
  }),

  // Onboarding
  onboarding: router({
    complete: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUserOnboarding(ctx.user.id, true);
      return { success: true };
    }),
  }),

  // Analytics
  analytics: router({
    financialProgress: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        const transactions = await db.getUserTransactions(ctx.user.id);
        
        // Group transactions by date
        const dailyData = new Map<string, { date: string; moneyIn: number; moneyOut: number; net: number }>();
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        
        // Initialize all dates in range with 0 values
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dailyData.set(dateStr, { date: dateStr, moneyIn: 0, moneyOut: 0, net: 0 });
        }
        
        // Aggregate transactions by date
        for (const transaction of transactions) {
          const dateStr = new Date(transaction.date).toISOString().split('T')[0];
          if (dailyData.has(dateStr)) {
            const day = dailyData.get(dateStr)!;
            const amount = parseFloat(transaction.amount);
            
            if (transaction.type === 'INCOME') {
              day.moneyIn += amount;
            } else {
              day.moneyOut += amount;
            }
          }
        }
        
        // Calculate cumulative net balance
        let cumulativeBalance = 0;
        const result = Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
        
        for (const day of result) {
          cumulativeBalance += day.moneyIn - day.moneyOut;
          day.net = cumulativeBalance;
        }
        
        return result;
      }),
  }),

  // Demo / screenshot seed data
  demo: router({
    seed: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;

      const userBuckets = await db.getUserBuckets(userId);
      if (userBuckets.length === 0) throw new Error("No buckets found. Complete onboarding first.");

      const now = new Date();
      const ago = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const future = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

      // Match buckets by name keyword, fall back to index
      const find = (keyword: string, idx: number) =>
        userBuckets.find(b => b.name.toLowerCase().includes(keyword)) ?? userBuckets[idx] ?? userBuckets[0];

      const ess  = find("essential", 0);
      const life = find("lifestyle", 1);
      const sav  = find("saving",    2);
      const give = find("giving",    3);
      const fun  = find("fun",       4);

      // ── Income (allocates 20% to each bucket) ──────────────────────────────
      const incomes: { amount: string; desc: string; date: Date }[] = [
        { amount: "3500.00", desc: "Monthly Salary",     date: ago(30) },
        { amount: "250.00",  desc: "Freelance Project",  date: ago(15) },
      ];

      // Clone allocated values so we can mutate in-memory
      const allocated: Record<number, number> = {};
      for (const bkt of userBuckets) allocated[bkt.id] = parseFloat(bkt.allocated ?? "0");

      for (const inc of incomes) {
        await db.createTransaction({
          userId,
          bucketId: ess.id,
          type: "INCOME",
          amount: inc.amount,
          category: "Planned",
          description: inc.desc,
          date: inc.date,
          isRecurring: false,
        });
        const perBucket = parseFloat(inc.amount) / userBuckets.length;
        for (const bkt of userBuckets) {
          allocated[bkt.id] += perBucket;
          await db.updateBucketAllocation(bkt.id, allocated[bkt.id].toFixed(2));
        }
      }

      // ── Expenses ────────────────────────────────────────────────────────────
      const expenses: { amount: string; desc: string; date: Date; bucketId: number; category: "Planned" | "Unplanned" | "Impulse" }[] = [
        { amount: "1200.00", desc: "Rent",              date: ago(30), bucketId: ess.id,  category: "Planned"   },
        { amount: "85.00",   desc: "Electricity Bill",  date: ago(25), bucketId: ess.id,  category: "Planned"   },
        { amount: "120.00",  desc: "Groceries",         date: ago(22), bucketId: ess.id,  category: "Planned"   },
        { amount: "45.00",   desc: "Phone Bill",        date: ago(20), bucketId: ess.id,  category: "Planned"   },
        { amount: "40.00",   desc: "Gym Membership",    date: ago(30), bucketId: life.id, category: "Planned"   },
        { amount: "45.00",   desc: "Netflix + Spotify", date: ago(28), bucketId: life.id, category: "Planned"   },
        { amount: "65.00",   desc: "Restaurant Dinner", date: ago(18), bucketId: life.id, category: "Unplanned" },
        { amount: "28.00",   desc: "Coffee Shop",       date: ago(12), bucketId: life.id, category: "Impulse"   },
        { amount: "50.00",   desc: "Charity Donation",  date: ago(20), bucketId: give.id, category: "Planned"   },
        { amount: "35.00",   desc: "Movie Tickets",     date: ago(14), bucketId: fun.id,  category: "Planned"   },
        { amount: "89.00",   desc: "New Sneakers",      date: ago(8),  bucketId: fun.id,  category: "Impulse"   },
      ];

      for (const exp of expenses) {
        await db.createTransaction({
          userId,
          bucketId: exp.bucketId,
          type: "EXPENSE",
          amount: exp.amount,
          category: exp.category,
          description: exp.desc,
          date: exp.date,
          isRecurring: false,
        });
      }

      // ── Goals ───────────────────────────────────────────────────────────────
      await db.createGoal({ userId, bucketId: sav.id,  name: "Emergency Fund",  targetAmount: "5000.00", currentAmount: "1200.00", targetDate: future(180) });
      await db.createGoal({ userId, bucketId: fun.id,  name: "Europe Vacation", targetAmount: "3000.00", currentAmount: "850.00",  targetDate: future(270) });
      await db.createGoal({ userId, bucketId: life.id, name: "New MacBook",     targetAmount: "1500.00", currentAmount: "400.00",  targetDate: future(90)  });

      // ── Habits ──────────────────────────────────────────────────────────────
      await db.createHabit({ userId, name: "Morning Coffee",    frequency: "daily",   price: "5.00",  bucketId: life.id, type: "EXPENSE" });
      await db.createHabit({ userId, name: "Cook at Home",      frequency: "daily",   price: "12.00", bucketId: ess.id,  type: "INCOME"  });
      await db.createHabit({ userId, name: "Side Project Work", frequency: "weekly",  price: "50.00", bucketId: sav.id,  type: "INCOME"  });

      // ── Journal ─────────────────────────────────────────────────────────────
      await db.createJournalEntry({
        userId,
        content: "March has been a solid month overall. Rent hit hard as always but I stayed within my lifestyle budget. The impulse coffee spending is something I want to watch — I notice it spikes when I have afternoon slumps. Goal for April: meal prep on Sundays to cut the unplanned restaurant visits.",
        financialSnapshot: { totalIncome: 3750, totalExpenses: 1757, net: 1993 },
      });

      return { success: true };
    }),
  }),

  // Purchase + trial status
  purchase: router({
    status: protectedProcedure.query(({ ctx }) => {
      const TRIAL_DAYS = 30;
      const trialStartedAt = ctx.user.createdAt;
      const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      const now = new Date();
      const trialActive = now < trialEndsAt;
      const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

      return {
        hasPurchased: ctx.user.hasPurchased ?? false,
        trialActive,
        trialDaysRemaining,
        trialEndsAt,
      };
    }),

    // Called from the client after RevenueCat confirms the purchase,
    // so the backend stays in sync without waiting for the webhook.
    confirm: protectedProcedure
      .input(z.object({ revenueCatAppUserId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.markUserPurchased(ctx.user.id, input.revenueCatAppUserId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
