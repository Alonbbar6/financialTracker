# Project Clarity TODO

## Database & Backend
- [x] Update database schema with buckets, transactions, goals, habits, journal entries tables
- [x] Implement database query helpers for all tables
- [x] Create tRPC procedures for buckets (list, create, update balance)
- [x] Create tRPC procedures for transactions (list, create, update, delete, recurring)
- [x] Create tRPC procedures for goals (list, create, update, delete, progress tracking)
- [x] Create tRPC procedures for habits (list, create, update, delete, complete, streak calculation)
- [x] Create tRPC procedures for journal entries (list, create, delete, with financial snapshot)
- [x] Create analytics procedures (spending trends, behavioral insights, habit correlations)

## Core UI & Components
- [x] Update global theme with brand gradient and calm color palette
- [x] Create reusable UI components (BucketCard, TransactionItem, GoalCard, HabitCard)
- [x] Implement dashboard layout with navigation
- [x] Build bucket overview section with visual balance indicators
- [x] Create transaction logging form with behavioral categorization
- [x] Implement transaction list with filtering and sorting

## Goals & Journey
- [x] Build goals page with visual progress trackers
- [x] Create goal creation and editing forms
- [x] Implement journal entry creation with reflection prompts
- [x] Build timeline view showing entries and milestones
- [x] Add financial snapshot capture for journal entries

## Habit Tracking
- [x] Create habit tracker page with streak visualization
- [x] Implement habit creation form with flexible scheduling
- [x] Build habit completion interface with celebration animations
- [x] Calculate and display current streaks
- [x] Show small wins and milestone celebrations

## Analytics & Dashboard
- [x] Create main dashboard with bucket overview
- [x] Implement spending trend visualizations (Recharts)
- [x] Build behavioral category breakdown charts
- [x] Show habit progress and correlations
- [x] Add positive reinforcement messaging
- [x] Display recent transactions and activity feed

## Onboarding Flow
- [x] Create welcome screen with app philosophy explanation
- [x] Build bucket setup wizard with initial allocation
- [x] Implement first income entry guidance
- [x] Add starter habit suggestions
- [x] Create dashboard tour with tooltips

## UI/UX Polish
- [x] Add Framer Motion animations for bucket fills
- [x] Implement goal progress animations
- [x] Add milestone celebration animations
- [x] Ensure responsive design for mobile
- [x] Test all user flows and edge cases
- [x] Add loading states and error handling

## New Requirements - Expense Tracking Focus

- [x] Remove monthly income requirement from onboarding
- [x] Simplify onboarding to just explain the app and create equal buckets
- [x] Auto-create all 5 buckets with $0.00 balance on first login
- [x] Remove bucket balance tracking (buckets are just categories, not envelopes)
- [x] Update transaction system to track money in/out without affecting bucket balances
- [x] Show spending breakdown: 20% per category (Play Money, Expenses, Savings, Investments, Education)
- [x] Update dashboard to show total spent per category, not bucket balances
- [x] Simplify analytics to show spending patterns by category
- [x] Remove goal progress tied to bucket balances

## Enhanced Animations & User Guidance

- [x] Add celebration confetti animation when completing habits
- [x] Add smooth slide-in animations for transaction entries
- [x] Add progress bar fill animations with easing
- [x] Add coin/money drop animation when logging expenses
- [x] Add success checkmark animations for completed actions
- [x] Add gentle pulse animations to guide user attention
- [x] Add micro-interactions on button hovers and clicks
- [x] Add loading skeleton animations for data fetching

## Timeline & Date-Based Tracking

- [x] Create daily timeline view showing all transactions grouped by date
- [x] Add calendar date picker to easily navigate to any day
- [x] Show daily summary (total in, total out, net for each day)
- [x] Create weekly view with 7-day summaries and totals
- [x] Create monthly view with calendar grid showing spending per day
- [x] Allow logging transactions for past dates (backfilling history)
- [x] Allow logging transactions for future dates (planned expenses)
- [x] Add "Today" quick filter to jump to current date
- [x] Show visual indicators for days with transactions
- [x] Add date range filters (This Week, This Month, Last 30 Days, Custom Range)

## Envelope Budgeting System

- [x] When user adds income, automatically calculate 20% allocation for each of 5 buckets
- [x] Store total income and bucket allocations in database
- [x] Track total spent per bucket from expense transactions
- [x] Calculate remaining balance per bucket (allocated - spent)
- [x] Show overspending when spent > allocated for any bucket
- [x] Display "You owe yourself $X" message for overspent buckets
- [x] Update dashboard to show allocated vs spent for each bucket with progress bars
- [x] Add visual indicators (red) for overspent buckets
- [x] Show total debt across all overspent buckets
- [x] Ensure only 5 buckets exist (Play Money, Expenses, Savings, Investments, Education)

## Transaction Form Updates

- [x] Hide bucket selector when transaction type is INCOME (auto-splits to all 5)
- [x] Show bucket selector when transaction type is EXPENSE (user must choose 1 of 5)
- [x] Update form validation to not require bucketId for income transactions
- [x] Update backend to handle income without bucketId (splits across all buckets)

## Fixed Bucket System

- [x] Update onboarding to create only 5 fixed buckets (Play Money, Expenses, Savings, Investments, Education)
- [x] Remove "Add Bucket" button from UI (never existed)
- [x] Add safety check to bucket creation (max 5 buckets)
- [x] Ensure buckets cannot be deleted (no delete UI or procedure exists)
- [x] Clean up any test buckets in database (handled by onboarding flow)

## Database Cleanup

- [x] Delete all test buckets from database (name = "Test Bucket")
- [x] Verify dashboard shows only user's 5 actual buckets
- [x] Ensure test data doesn't pollute production

## Financial Progress Chart

- [x] Create backend procedure to aggregate daily money in/out totals
- [x] Build line chart component using Recharts showing money in (green) and money out (red) over time
- [x] Add net balance line showing cumulative balance
- [x] Support time range filters (7 days, 30 days, 90 days, All time)
- [x] Add chart to Dashboard page
- [ ] Add chart to Timeline page
- [x] Show tooltips with exact amounts on hover
- [x] Add smooth animations for line rendering

## Financial Habits Tracker

- [x] Add price field to habits table (decimal amount)
- [x] Add bucketId field to habits table (links to one of 5 buckets)
- [x] Add habitType field to habits table (EXPENSE or INCOME)
- [x] Update habit creation form to include price input and bucket selector
- [x] Update habit completion to automatically create a transaction with the habit's price and bucket
- [x] Show habit history with completion dates and amounts spent/earned
- [x] Add total spent/earned per habit in habit list
- [x] Support both expense habits (coffee, yoga) and income habits (invest in stocks, freelance work)
- [x] Show habit impact on bucket spending in dashboard

## Delete Habit Completions

- [x] Add backend procedure to delete a specific habit completion by ID
- [x] When deleting completion, also delete the associated transaction
- [x] Add delete button (trash icon) to each completion in habit history
- [x] Show confirmation dialog before deleting
- [x] Update habit history view after deletion
- [x] Test deletion functionality

## Navigation Fix

- [x] Add back button to Habits page header to return to Dashboard (already exists)
- [ ] Fix 403 authentication error when navigating between pages
- [ ] Investigate why authentication fails on certain page transitions
- [ ] Ensure all pages have proper navigation to prevent users from getting stuck

## Rebrand to Quintave

- [x] Update app title in all page headers from "Project Clarity" to "Quintave"
- [x] Update browser tab title (document title) to "Quintave"
- [x] Update welcome messages and branding text
- [x] Update onboarding page branding
- [x] Verify all pages show "Quintave" consistently
