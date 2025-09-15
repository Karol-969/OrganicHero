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
    difficulty: z.enum(['low', 'medium', 'high']),
    volume: z.number(),
    competition: z.number().optional(), // 0-100 score
    cpc: z.number().optional(), // Cost per click
    trend: z.enum(['rising', 'stable', 'declining']).optional(),
    intent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).optional(),
    localSearchVolume: z.number().optional(), // Location-specific search volume
    location: z.string().optional(), // Target location for this keyword
    seasonality: z.object({
      isSeasonsal: z.boolean(),
      peakMonths: z.array(z.string()),
    }).optional(),
    contentStrategy: z.object({
      contentType: z.enum(['blog_post', 'landing_page', 'product_page', 'guide', 'faq', 'video', 'infographic']),
      contentLength: z.string(), // e.g., "1500-2000 words"
      targetAudience: z.string(),
      contentFormat: z.string(),
      callToAction: z.string(),
    }).optional(),
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
  // Google SERP Presence Analysis
  serpPresence: z.object({
    organicResults: z.array(z.object({
      position: z.number().nullable(),
      url: z.string(),
      title: z.string(),
      snippet: z.string(),
    })),
    paidAds: z.array(z.object({
      position: z.number(),
      url: z.string(),
      title: z.string(),
      description: z.string(),
    })),
    imagesResults: z.object({
      found: z.boolean(),
      count: z.number(),
      examples: z.array(z.string()),
    }),
    mapsResults: z.object({
      found: z.boolean(),
      position: z.number().nullable(),
      businessName: z.string(),
      address: z.string(),
      rating: z.number().nullable(),
    }),
    peopleAlsoAsk: z.object({
      questions: z.array(z.string()),
      relatedToWebsite: z.boolean(),
    }),
    featuredSnippets: z.object({
      found: z.boolean(),
      type: z.string(),
      content: z.string(),
    }),
    knowledgePanel: z.object({
      found: z.boolean(),
      type: z.string(),
      content: z.string(),
    }),
    newsResults: z.object({
      found: z.boolean(),
      articles: z.array(z.object({
        title: z.string(),
        source: z.string(),
        date: z.string(),
      })),
    }),
    videoResults: z.object({
      found: z.boolean(),
      videos: z.array(z.object({
        title: z.string(),
        platform: z.string(),
        url: z.string(),
      })),
    }),
  }),
  // Business Intelligence from website analysis
  businessIntelligence: z.object({
    businessType: z.string(),
    industry: z.string(),
    location: z.string(),
    products: z.array(z.string()),
    services: z.array(z.string()),
    description: z.string(),
  }).optional(),
  // New fields for real API integration support
  isDemoMode: z.boolean().optional(),
  demoMessage: z.string().optional(),
});

export type SEOAnalysisResult = z.infer<typeof seoAnalysisSchema>;

// Comprehensive Analysis with Action Plans
export const actionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  impact: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['high', 'medium', 'low']),
  category: z.enum(['technical', 'content', 'keywords', 'competitors', 'user_experience', 'local_seo']),
  timeframe: z.enum(['immediate', 'this_week', 'this_month', 'next_quarter']),
  steps: z.array(z.string()),
  tools: z.array(z.string()).optional(),
  expectedImprovement: z.string(),
  dependencies: z.array(z.string()).optional(),
});

export const agentAnalysisSchema = z.object({
  agentType: z.enum(['technical_seo', 'content_analysis', 'competitor_intelligence', 'keyword_research', 'serp_analysis', 'user_experience']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  findings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const comprehensiveAnalysisSchema = z.object({
  id: z.string(),
  domain: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  
  // Basic SEO Analysis (existing)
  basicAnalysis: seoAnalysisSchema.optional(),
  
  // Multi-Agent Analysis Results
  agentResults: z.array(agentAnalysisSchema),
  
  // Comprehensive Action Plan
  actionPlan: z.object({
    summary: z.string(),
    overallScore: z.number().min(0).max(100),
    potentialImprovement: z.number().min(0).max(100),
    timeline: z.string(),
    items: z.array(actionItemSchema),
    quickWins: z.array(z.string()),
    longTermGoals: z.array(z.string()),
  }),
  
  // Competitive Intelligence
  competitiveIntelligence: z.object({
    marketPosition: z.string(),
    competitiveAdvantages: z.array(z.string()),
    competitiveGaps: z.array(z.string()),
    opportunityAreas: z.array(z.string()),
    benchmarkScores: z.object({
      content: z.number(),
      technical: z.number(),
      authority: z.number(),
      userExperience: z.number(),
    }),
  }),
  
  // Content Strategy
  contentStrategy: z.object({
    contentGaps: z.array(z.string()),
    topicClusters: z.array(z.object({
      topic: z.string(),
      keywords: z.array(z.string()),
      priority: z.enum(['high', 'medium', 'low']),
    })),
    contentCalendar: z.array(z.object({
      week: z.string(),
      contentType: z.string(),
      topic: z.string(),
      targetKeyword: z.string(),
    })),
  }),
  
  // Progress Tracking
  progressTracking: z.object({
    milestones: z.array(z.object({
      title: z.string(),
      dueDate: z.string(),
      status: z.enum(['not_started', 'in_progress', 'completed']),
      actionItems: z.array(z.string()),
    })),
    kpis: z.array(z.object({
      metric: z.string(),
      current: z.number(),
      target: z.number(),
      timeframe: z.string(),
    })),
  }),
});

export type ActionItem = z.infer<typeof actionItemSchema>;
export type AgentAnalysis = z.infer<typeof agentAnalysisSchema>;
export type ComprehensiveAnalysis = z.infer<typeof comprehensiveAnalysisSchema>;
