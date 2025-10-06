import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  followers: integer("followers"),
  lastScraped: timestamp("last_scraped"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reels = pgTable("reels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => creators.id).notNull(),
  instagramId: text("instagram_id").notNull().unique(),
  url: text("url").notNull(),
  caption: text("caption"),
  videoUrl: text("video_url"),
  datePosted: timestamp("date_posted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reelMetrics = pgTable("reel_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reelId: varchar("reel_id").references(() => reels.id).notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  views: integer("views").default(0),
  hashtags: text("hashtags"),
  mentions: text("mentions"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const scrapeRuns = pgTable("scrape_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull(),
  usernames: jsonb("usernames").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  logs: text("logs"),
  reelsScraped: integer("reels_scraped").default(0),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCreatorSchema = createInsertSchema(creators);
export const insertReelSchema = createInsertSchema(reels);
export const insertReelMetricsSchema = createInsertSchema(reelMetrics);
export const insertScrapeRunSchema = createInsertSchema(scrapeRuns);
export const insertSettingsSchema = createInsertSchema(settings);

export const scraperConfigSchema = z.object({
  targetUsername: z.string(),
  scheduleFrequency: z.string(),
  autoTag: z.boolean(),
  emailNotifications: z.boolean(),
});

export const instagramCredentialsSchema = z.object({
  instagramUsername: z.string().min(1, "Instagram username is required"),
  instagramPassword: z.string().min(1, "Instagram password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Reel = typeof reels.$inferSelect;
export type ReelMetrics = typeof reelMetrics.$inferSelect;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type ScraperConfig = z.infer<typeof scraperConfigSchema>;
export type InstagramCredentials = z.infer<typeof instagramCredentialsSchema>;
