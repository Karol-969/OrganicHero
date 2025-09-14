import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// SEO Analysis Types
export const seoAnalysisSchema = z.object({
  seoScore: z.number(),
  domain: z.string(),
  pageSpeed: z.object({
    mobile: z.number(),
    desktop: z.number(),
    firstContentfulPaint: z.number(),
    largestContentfulPaint: z.number(),
    cumulativeLayoutShift: z.number(),
  }),
  technicalSeo: z.object({
    score: z.number(),
    issues: z.array(z.object({
      title: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
      description: z.string(),
    })),
  }),
  competitors: z.array(z.object({
    name: z.string(),
    score: z.number(),
    ranking: z.number(),
  })),
  keywords: z.array(z.object({
    keyword: z.string(),
    position: z.number().optional(),
    difficulty: z.string(),
    volume: z.number(),
  })),
  improvements: z.array(z.object({
    title: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    description: z.string(),
  })),
  marketPosition: z.object({
    rank: z.number(),
    totalCompetitors: z.number(),
    marketShare: z.number(),
  }),
  // New fields for real API integration support
  isDemoMode: z.boolean().optional(),
  demoMessage: z.string().optional(),
});

export type SEOAnalysisResult = z.infer<typeof seoAnalysisSchema>;
