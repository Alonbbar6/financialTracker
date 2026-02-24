ALTER TABLE `habits` ADD `price` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `habits` ADD `bucketId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `habits` ADD `type` enum('INCOME','EXPENSE') NOT NULL;