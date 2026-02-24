ALTER TABLE `users`
  ADD COLUMN `hasPurchased` boolean NOT NULL DEFAULT false,
  ADD COLUMN `purchasedAt` timestamp,
  ADD COLUMN `revenueCatAppUserId` varchar(128);
