CREATE TABLE `savedCharts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chartName` varchar(255) NOT NULL,
	`placements` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedCharts_id` PRIMARY KEY(`id`)
);
