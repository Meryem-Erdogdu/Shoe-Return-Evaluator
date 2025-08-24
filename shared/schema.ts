import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const shoeAnalyses = pgTable("shoe_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  originalFilename: text("original_filename").notNull(),
  classification: text("classification").notNull(), // 'returnable', 'send_back', 'donation', 'disposal'
  confidence: real("confidence").notNull(),
  scores: jsonb("scores").notNull(), // { returnable: number, send_back: number, donation: number, disposal: number }
  features: jsonb("features").notNull().default('[]'), // string[]
  reasoning: text("reasoning").notNull(),
  damageReasons: jsonb("damage_reasons").notNull().default('[]'), // string[]
  shoeModel: text("shoe_model"), // detected shoe model/brand
  warrantyPeriod: integer("warranty_period"), // warranty period in months
  isApproved: integer("is_approved").default(0), // 0 = pending, 1 = approved, -1 = rejected
  manualOverride: text("manual_override"), // manual classification if different from AI
  userNotes: text("user_notes"), // user notes about the analysis
  isUserError: integer("is_user_error").default(0), // 0 = no, 1 = yes (detected user error)
  userErrorReason: text("user_error_reason"), // reason for user error if detected
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertShoeAnalysisSchema = createInsertSchema(shoeAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertShoeAnalysis = z.infer<typeof insertShoeAnalysisSchema>;
export type ShoeAnalysis = typeof shoeAnalyses.$inferSelect;

export type ClassificationType = 'returnable' | 'not_returnable' | 'send_back' | 'donation' | 'disposal';

export type ShoeAnalysisResult = {
  classification: ClassificationType;
  confidence: number;
  scores: {
    returnable: number;
    not_returnable: number;
    send_back: number;
    donation: number;
    disposal: number;
  };
  features: string[];
  reasoning: string;
  damageReasons: string[];
  shoeModel?: string;
  warrantyPeriod?: number;
  isUserError?: boolean;
  userErrorReason?: string;
};
