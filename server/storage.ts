import { type User, type InsertUser, type ShoeAnalysis, type InsertShoeAnalysis, shoeAnalyses, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Shoe analysis methods
  createShoeAnalysis(analysis: InsertShoeAnalysis): Promise<ShoeAnalysis>;
  getShoeAnalysis(id: string): Promise<ShoeAnalysis | undefined>;
  getRecentShoeAnalyses(limit: number): Promise<ShoeAnalysis[]>;
  getDailyStats(date: Date): Promise<{
    returnable: number;
    not_returnable: number;
    send_back: number;
    donation: number;
    disposal: number;
    total: number;
  }>;
  approveShoeAnalysis(id: string, manualOverride?: string): Promise<void>;
  manualEditAnalysis(id: string, manualOverride: string, userNotes: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createShoeAnalysis(analysis: InsertShoeAnalysis): Promise<ShoeAnalysis> {
    const [shoeAnalysis] = await db
      .insert(shoeAnalyses)
      .values(analysis)
      .returning();
    return shoeAnalysis;
  }

  async getShoeAnalysis(id: string): Promise<ShoeAnalysis | undefined> {
    const [analysis] = await db.select().from(shoeAnalyses).where(eq(shoeAnalyses.id, id));
    return analysis || undefined;
  }

  async getRecentShoeAnalyses(limit: number = 10): Promise<ShoeAnalysis[]> {
    return await db
      .select()
      .from(shoeAnalyses)
      .orderBy(desc(shoeAnalyses.createdAt))
      .limit(limit);
  }

  async getDailyStats(date: Date): Promise<{
    returnable: number;
    not_returnable: number;
    send_back: number;
    donation: number;
    disposal: number;
    total: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const analyses = await db
      .select()
      .from(shoeAnalyses)
      .where(sql`${shoeAnalyses.createdAt} >= ${startOfDay} AND ${shoeAnalyses.createdAt} <= ${endOfDay}`);

    const stats = {
      returnable: 0,
      not_returnable: 0,
      send_back: 0,
      donation: 0,
      disposal: 0,
      total: analyses.length,
    };

    analyses.forEach(analysis => {
      const classification = analysis.manualOverride || analysis.classification;
      if (classification in stats) {
        stats[classification as keyof typeof stats]++;
      }
    });

    return stats;
  }

  async approveShoeAnalysis(id: string, manualOverride?: string): Promise<void> {
    await db
      .update(shoeAnalyses)
      .set({ 
        isApproved: 1, 
        manualOverride,
        updatedAt: new Date()
      })
      .where(eq(shoeAnalyses.id, id));
  }

  async manualEditAnalysis(id: string, manualOverride: string, userNotes: string): Promise<void> {
    await db
      .update(shoeAnalyses)
      .set({ 
        isApproved: 1, 
        manualOverride,
        userNotes,
        updatedAt: new Date()
      })
      .where(eq(shoeAnalyses.id, id));
  }
}

export const storage = new DatabaseStorage();
