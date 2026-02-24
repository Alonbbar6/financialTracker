ALTER TABLE `users` ADD `hasPurchased` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `purchasedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `revenueCatAppUserId` varchar(128);