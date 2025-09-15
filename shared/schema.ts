import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, numeric, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with Stripe integration fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  subscriptionStatus: text("subscription_status", { 
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'] 
  }),
  subscriptionPlan: text("subscription_plan", { 
    enum: ['free', 'basic', 'pro', 'enterprise'] 
  }).default('free'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans table with Enhanced Precision
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'Basic', 'Pro', 'Enterprise'
  stripePriceId: text("stripe_price_id").notNull().unique(),
  priceMonthlyCents: integer("price_monthly_cents").notNull(), // Converted to cents for precision
  priceYearlyCents: integer("price_yearly_cents"), // Converted to cents for precision
  features: jsonb("features").notNull(), // JSON array of features
  maxAnalyses: integer("max_analyses"), // null for unlimited
  maxKeywords: integer("max_keywords"), // null for unlimited
  maxCompetitors: integer("max_competitors"), // null for unlimited
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscription History table for tracking subscription changes
export const subscriptionHistory = pgTable("subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  status: text("status").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment History table for tracking all payments with Enhanced Precision
export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  stripeInvoiceId: text("stripe_invoice_id"),
  amountCents: integer("amount_cents").notNull(), // Converted to cents for precision
  currency: text("currency").notNull().default('usd'),
  status: text("status").notNull(), // 'succeeded', 'failed', 'pending', etc.
  paymentMethod: text("payment_method"), // 'card', 'ach', etc.
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Usage Tracking table for monitoring subscription usage
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  analysesUsed: integer("analyses_used").default(0),
  keywordsTracked: integer("keywords_tracked").default(0),
  competitorsAnalyzed: integer("competitors_analyzed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = z.infer<typeof insertSubscriptionHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;

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

// =============================================================================
// CAMPAIGN MANAGEMENT SCHEMA
// =============================================================================

// Supported Advertising Platforms
export const platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads'
  displayName: text("display_name").notNull(), // 'Google Ads', 'Meta Ads', 'TikTok Ads'
  apiVersion: text("api_version"),
  isActive: boolean("is_active").default(true),
  supportsOAuth: boolean("supports_oauth").default(true),
  apiEndpoint: text("api_endpoint"),
  documentationUrl: text("documentation_url"),
  iconUrl: text("icon_url"),
  configuration: jsonb("configuration"), // Platform-specific config like rate limits, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Credentials - Encrypted OAuth tokens and API keys
export const platformCredentials = pgTable("platform_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: varchar("platform_id").notNull().references(() => platforms.id, { onDelete: 'cascade' }),
  accountId: text("account_id").notNull(), // Platform-specific account ID (required for uniqueness)
  accountName: text("account_name"),
  
  // Encrypted credential fields with proper security
  accessTokenEncrypted: text("access_token_encrypted"), // AES-256 encrypted OAuth access token
  refreshTokenEncrypted: text("refresh_token_encrypted"), // AES-256 encrypted OAuth refresh token
  apiKeyEncrypted: text("api_key_encrypted"), // AES-256 encrypted API key if OAuth not used
  
  // Key management and rotation
  encryptionKeyId: varchar("encryption_key_id").notNull(), // ID of encryption key used
  keyRotationVersion: integer("key_rotation_version").notNull().default(1),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastKeyRotationAt: timestamp("last_key_rotation_at").defaultNow(),
  
  // Security metadata
  tokenHash: text("token_hash"), // SHA-256 hash for token verification without decryption
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  permissions: jsonb("permissions"), // Array of granted permissions
  metadata: jsonb("metadata"), // Platform-specific metadata
  
  // Audit trail
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deactivatedAt: timestamp("deactivated_at"), // For soft deletion of credentials
}, (table) => ({
  // Unique constraint to prevent duplicate platform connections per user
  uniqueUserPlatformAccount: unique("unique_user_platform_account").on(table.userId, table.platformId, table.accountId),
  // Index for efficient credential lookup
  userPlatformIdx: index("platform_credentials_user_platform_idx").on(table.userId, table.platformId),
  // Index for key rotation queries
  keyRotationIdx: index("platform_credentials_key_rotation_idx").on(table.encryptionKeyId, table.keyRotationVersion),
}));

// Customer Audiences and Segments
export const audiences = pgTable("audiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { 
    enum: ['custom', 'lookalike', 'behavioral', 'demographic', 'interest', 'retargeting'] 
  }).notNull(),
  sourceType: text("source_type", { 
    enum: ['upload', 'pixel', 'api', 'platform_native'] 
  }).notNull(),
  size: integer("size"), // Approximate audience size
  status: text("status", { 
    enum: ['active', 'processing', 'ready', 'error', 'archived'] 
  }).default('processing'),
  platformSpecific: jsonb("platform_specific"), // Platform-specific audience data
  targetingCriteria: jsonb("targeting_criteria"), // Targeting parameters
  
  // Enhanced PII protection for uploaded customer data
  uploadedDataHash: text("uploaded_data_hash"), // SHA-256 hash for deduplication
  piiDataHashSalt: varchar("pii_data_hash_salt"), // Salt used for PII hashing
  customerIdentifierHashes: jsonb("customer_identifier_hashes"), // Hashed email/phone/etc arrays
  privacyLevel: text("privacy_level", {
    enum: ['public', 'internal', 'confidential', 'restricted']
  }).notNull().default('confidential'),
  
  refreshFrequency: text("refresh_frequency", { 
    enum: ['manual', 'daily', 'weekly', 'monthly'] 
  }).default('manual'),
  lastRefreshAt: timestamp("last_refresh_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for efficient user audience lookups
  userStatusIdx: index("audiences_user_status_idx").on(table.userId, table.status),
  // Index for data deduplication
  dataHashIdx: index("audiences_data_hash_idx").on(table.uploadedDataHash),
}));

// Campaign Groups/Projects - Top-level organization
export const campaignGroups = pgTable("campaign_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { 
    enum: ['active', 'paused', 'archived'] 
  }).default('active'),
  budget: jsonb("budget"), // Overall budget allocation
  tags: text("tags").array(), // Organizational tags
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Main Campaigns Table with Enhanced Constraints
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: varchar("group_id").references(() => campaignGroups.id, { onDelete: 'set null' }),
  platformCredentialId: varchar("platform_credential_id").notNull().references(() => platformCredentials.id, { onDelete: 'cascade' }),
  externalCampaignId: text("external_campaign_id"), // Platform's campaign ID
  name: text("name").notNull(),
  description: text("description"),
  objective: text("objective", { 
    enum: ['awareness', 'consideration', 'conversion', 'retention', 'loyalty', 'app_install', 'lead_generation', 'sales'] 
  }).notNull(),
  status: text("status", { 
    enum: ['draft', 'active', 'paused', 'ended', 'archived', 'error'] 
  }).notNull().default('draft'),
  budgetType: text("budget_type", { 
    enum: ['daily', 'lifetime', 'monthly'] 
  }).notNull(),
  budgetAmountCents: integer("budget_amount_cents"), // Converted to cents for precision
  bidStrategy: text("bid_strategy", { 
    enum: ['manual_cpc', 'auto_cpc', 'manual_cpm', 'auto_cpm', 'target_cpa', 'target_roas', 'maximize_clicks', 'maximize_conversions'] 
  }),
  bidAmountCents: integer("bid_amount_cents"), // Converted to cents for precision
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  timezone: text("timezone").notNull().default('UTC'),
  targetingCriteria: jsonb("targeting_criteria"), // Detailed targeting parameters
  conversionGoals: jsonb("conversion_goals"), // Conversion tracking setup
  platformSettings: jsonb("platform_settings"), // Platform-specific settings
  optimizationRules: jsonb("optimization_rules"), // Automated optimization rules
  tags: text("tags").array(),
  isTemplate: boolean("is_template").notNull().default(false),
  templateName: text("template_name"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate external campaign IDs per platform
  uniquePlatformCampaign: unique("unique_platform_campaign").on(table.platformCredentialId, table.externalCampaignId),
  // Index for efficient user campaign queries
  userStatusIdx: index("campaigns_user_status_idx").on(table.userId, table.status),
  // Index for group-based queries
  groupStatusIdx: index("campaigns_group_status_idx").on(table.groupId, table.status),
  // Index for platform-based queries
  platformIdx: index("campaigns_platform_idx").on(table.platformCredentialId, table.status),
}));

// Campaign Ad Groups/Ad Sets with Enhanced Constraints
export const adGroups = pgTable("ad_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  externalAdGroupId: text("external_ad_group_id"), // Platform's ad group ID
  name: text("name").notNull(),
  status: text("status", { 
    enum: ['active', 'paused', 'archived'] 
  }).notNull().default('active'),
  bidStrategy: text("bid_strategy", { 
    enum: ['inherit', 'manual_cpc', 'auto_cpc', 'manual_cpm', 'auto_cpm', 'target_cpa', 'target_roas'] 
  }).notNull().default('inherit'),
  bidAmountCents: integer("bid_amount_cents"), // Converted to cents for precision
  audienceId: varchar("audience_id").references(() => audiences.id, { onDelete: 'set null' }),
  targetingCriteria: jsonb("targeting_criteria"), // Ad group specific targeting
  optimizationRules: jsonb("optimization_rules"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Index for efficient campaign-based queries
  campaignStatusIdx: index("ad_groups_campaign_status_idx").on(table.campaignId, table.status),
  // Unique constraint for external ad group IDs per campaign
  uniqueExternalAdGroup: unique("unique_external_ad_group").on(table.campaignId, table.externalAdGroupId),
}));

// Campaign Creative Assets
export const creatives = pgTable("creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  adGroupId: varchar("ad_group_id").references(() => adGroups.id, { onDelete: 'set null' }),
  externalCreativeId: text("external_creative_id"), // Platform's creative ID
  name: text("name").notNull(),
  type: text("type", { 
    enum: ['image', 'video', 'carousel', 'collection', 'text', 'html5', 'dynamic'] 
  }).notNull(),
  format: text("format", { 
    enum: ['single_image', 'single_video', 'carousel', 'slideshow', 'collection', 'instant_experience'] 
  }),
  status: text("status", { 
    enum: ['active', 'paused', 'archived', 'pending_review', 'disapproved'] 
  }).default('active'),
  primaryText: text("primary_text"),
  headline: text("headline"),
  description: text("description"),
  callToAction: text("call_to_action"),
  destinationUrl: text("destination_url"),
  displayUrl: text("display_url"),
  trackingUrls: jsonb("tracking_urls"), // UTM parameters and tracking pixels
  mediaAssets: jsonb("media_assets"), // Images, videos, etc. with dimensions
  platformVariations: jsonb("platform_variations"), // Platform-specific variations
  abTestGroup: text("ab_test_group"), // For A/B testing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Performance Metrics - Time Series Data with Performance Optimizations
export const campaignMetrics = pgTable("campaign_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  adGroupId: varchar("ad_group_id").references(() => adGroups.id, { onDelete: 'cascade' }),
  creativeId: varchar("creative_id").references(() => creatives.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  granularity: text("granularity", { 
    enum: ['hour', 'day', 'week', 'month'] 
  }).notNull().default('day'),
  
  // Core Metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spendCents: integer("spend_cents").notNull().default(0), // Converted to cents for precision
  conversions: integer("conversions").default(0),
  conversionValueCents: integer("conversion_value_cents").notNull().default(0), // Cents for precision
  
  // Calculated Metrics (stored for performance, computed in cents where applicable)
  ctr: numeric("ctr", { precision: 8, scale: 6 }), // Click-through rate
  cpcCents: integer("cpc_cents"), // Cost per click in cents
  cpmCents: integer("cpm_cents"), // Cost per thousand impressions in cents
  cpaCents: integer("cpa_cents"), // Cost per acquisition in cents
  roas: numeric("roas", { precision: 8, scale: 4 }), // Return on ad spend
  conversionRate: numeric("conversion_rate", { precision: 8, scale: 6 }),
  
  // Platform-specific metrics stored as JSON
  platformMetrics: jsonb("platform_metrics"),
  
  // Quality and relevance scores
  qualityScore: numeric("quality_score", { precision: 4, scale: 2 }),
  relevanceScore: numeric("relevance_score", { precision: 4, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Critical performance indexes for time-series queries
  campaignDateIdx: index("campaign_metrics_campaign_date_idx").on(table.campaignId, table.date),
  campaignGranularityIdx: index("campaign_metrics_campaign_granularity_idx").on(table.campaignId, table.granularity, table.date),
  // Index for aggregation queries
  dateGranularityIdx: index("campaign_metrics_date_granularity_idx").on(table.date, table.granularity),
  // Index for ad group performance analysis
  adGroupDateIdx: index("campaign_metrics_adgroup_date_idx").on(table.adGroupId, table.date),
  // Index for creative performance analysis
  creativeDateIdx: index("campaign_metrics_creative_date_idx").on(table.creativeId, table.date),
  // Unique constraint to prevent duplicate metrics
  uniqueMetric: unique("unique_campaign_metric").on(table.campaignId, table.adGroupId, table.creativeId, table.date, table.granularity),
}));

// Campaign Schedules
export const campaignSchedules = pgTable("campaign_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: text("type", { 
    enum: ['one_time', 'recurring', 'conditional'] 
  }).notNull(),
  action: text("action", { 
    enum: ['start', 'pause', 'resume', 'stop', 'budget_change', 'bid_change'] 
  }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  timezone: text("timezone").default('UTC'),
  
  // Recurring schedule settings
  frequency: text("frequency", { 
    enum: ['daily', 'weekly', 'monthly'] 
  }),
  daysOfWeek: integer("days_of_week").array(), // 0-6 (Sunday to Saturday)
  endRecurringAt: timestamp("end_recurring_at"),
  
  // Conditional settings
  conditions: jsonb("conditions"), // Performance-based triggers
  actionParameters: jsonb("action_parameters"), // Parameters for the action
  
  status: text("status", { 
    enum: ['pending', 'executed', 'failed', 'cancelled'] 
  }).default('pending'),
  executedAt: timestamp("executed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Optimization Rules
export const optimizationRules = pgTable("optimization_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Rule conditions
  conditions: jsonb("conditions").notNull(), // Array of condition objects
  logicalOperator: text("logical_operator", { 
    enum: ['and', 'or'] 
  }).default('and'),
  
  // Rule actions
  actions: jsonb("actions").notNull(), // Array of action objects
  
  // Execution settings
  priority: integer("priority").default(0), // Higher numbers = higher priority
  cooldownPeriod: integer("cooldown_period").default(3600), // Seconds between executions
  maxExecutionsPerDay: integer("max_executions_per_day").default(5),
  
  // Tracking
  lastExecutedAt: timestamp("last_executed_at"),
  executionCount: integer("execution_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Audit Logs - Immutable with integrity guarantees
export const campaignAuditLogs = pgTable("campaign_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  entityType: text("entity_type", { 
    enum: ['campaign', 'ad_group', 'creative', 'audience', 'rule', 'schedule', 'credential', 'upload'] 
  }).notNull(),
  entityId: varchar("entity_id").notNull(), // ID of the affected entity
  action: text("action", { 
    enum: ['create', 'update', 'delete', 'pause', 'resume', 'archive', 'sync', 'encrypt', 'rotate_key'] 
  }).notNull(),
  
  // Immutable audit trail with integrity
  changes: jsonb("changes").notNull(), // Before/after values (required for audit)
  changeHash: text("change_hash").notNull(), // SHA-256 hash of changes for integrity verification
  previousLogHash: text("previous_log_hash"), // Hash of previous log entry for chain integrity
  sequenceNumber: integer("sequence_number").notNull(), // Sequential number for ordering
  
  // Security context
  metadata: jsonb("metadata"), // Additional context
  ipAddress: text("ip_address").notNull(), // Required for security auditing
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"), // Session identifier
  platform: text("platform"), // Which advertising platform if applicable
  source: text("source", { 
    enum: ['manual', 'api', 'automation', 'sync', 'optimization_rule', 'security_event'] 
  }).notNull().default('manual'),
  
  // Compliance and retention
  retentionPolicy: text("retention_policy", {
    enum: ['standard', 'extended', 'permanent']
  }).notNull().default('extended'),
  complianceFlags: jsonb("compliance_flags"), // GDPR, SOX, etc. flags
  
  // Immutable timestamp - cannot be updated
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Index for efficient audit queries by entity
  entityAuditIdx: index("campaign_audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt),
  // Index for user activity queries
  userActionIdx: index("campaign_audit_logs_user_action_idx").on(table.userId, table.action, table.createdAt),
  // Index for security monitoring
  securityIdx: index("campaign_audit_logs_security_idx").on(table.ipAddress, table.source, table.createdAt),
  // Index for sequence integrity verification
  sequenceIdx: index("campaign_audit_logs_sequence_idx").on(table.sequenceNumber),
}));

// Customer Data Uploads
export const customerDataUploads = pgTable("customer_data_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  mimeType: text("mime_type").notNull(),
  uploadPath: text("upload_path").notNull(), // Storage path
  
  // Enhanced PII protection
  fileContentHash: text("file_content_hash").notNull(), // SHA-256 hash of entire file content
  piiColumnsDetected: jsonb("pii_columns_detected"), // Array of detected PII column names
  piiHashingSalt: varchar("pii_hashing_salt"), // Unique salt for this upload's PII hashing
  hashedPiiSample: jsonb("hashed_pii_sample"), // Sample of hashed PII for verification
  encryptionKeyId: varchar("encryption_key_id"), // If file is encrypted at rest
  
  // Processing status
  status: text("status", { 
    enum: ['uploading', 'processing', 'completed', 'failed'] 
  }).default('uploading'),
  processedAt: timestamp("processed_at"),
  
  // Data analysis
  rowCount: integer("row_count"),
  columnCount: integer("column_count"),
  schema: jsonb("schema"), // Detected column schema (PII columns marked)
  dataPreview: jsonb("data_preview"), // First few rows for preview (PII hashed)
  errors: jsonb("errors"), // Processing errors
  
  // Privacy compliance
  privacyLevel: text("privacy_level", {
    enum: ['public', 'internal', 'confidential', 'restricted']
  }).notNull().default('restricted'),
  dataRetentionDays: integer("data_retention_days").default(365),
  gdprCompliant: boolean("gdpr_compliant").default(true),
  
  // Usage tracking
  usedInAudiences: integer("used_in_audiences").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index for efficient user upload queries
  userStatusIdx: index("customer_data_uploads_user_status_idx").on(table.userId, table.status),
  // Index for file deduplication
  contentHashIdx: index("customer_data_uploads_content_hash_idx").on(table.fileContentHash),
  // Index for privacy compliance queries
  privacyLevelIdx: index("customer_data_uploads_privacy_idx").on(table.privacyLevel, table.gdprCompliant),
}));

// =============================================================================
// CAMPAIGN MANAGEMENT INSERT SCHEMAS AND TYPES
// =============================================================================

// Insert schemas
export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformCredentialSchema = createInsertSchema(platformCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  encryptionKeyId: true, // Managed by system
  keyRotationVersion: true, // Managed by system
  lastKeyRotationAt: true, // Managed by system
  tokenHash: true, // Computed by system
  deactivatedAt: true, // Managed by system
});

export const insertAudienceSchema = createInsertSchema(audiences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  piiDataHashSalt: true, // Generated by system
  customerIdentifierHashes: true, // Computed by system
});

export const insertCampaignGroupSchema = createInsertSchema(campaignGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true, // Managed by system during platform sync
});

export const insertAdGroupSchema = createInsertSchema(adGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreativeSchema = createInsertSchema(creatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMetricSchema = createInsertSchema(campaignMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignScheduleSchema = createInsertSchema(campaignSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertOptimizationRuleSchema = createInsertSchema(optimizationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignAuditLogSchema = createInsertSchema(campaignAuditLogs).omit({
  id: true,
  createdAt: true,
  changeHash: true, // Computed by system
  previousLogHash: true, // Computed by system
  sequenceNumber: true, // Managed by system
});

export const insertCustomerDataUploadSchema = createInsertSchema(customerDataUploads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fileContentHash: true, // Computed by system
  piiColumnsDetected: true, // Detected by system
  piiHashingSalt: true, // Generated by system
  hashedPiiSample: true, // Computed by system
  encryptionKeyId: true, // Managed by system
  processedAt: true, // Set when processing completes
  rowCount: true, // Computed during processing
  columnCount: true, // Computed during processing
  schema: true, // Detected during processing
  dataPreview: true, // Generated during processing
  errors: true, // Populated if processing fails
  usedInAudiences: true, // Tracked by system
  lastUsedAt: true, // Updated by system
});

// Export types
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type InsertPlatformCredential = z.infer<typeof insertPlatformCredentialSchema>;
export type Audience = typeof audiences.$inferSelect;
export type InsertAudience = z.infer<typeof insertAudienceSchema>;
export type CampaignGroup = typeof campaignGroups.$inferSelect;
export type InsertCampaignGroup = z.infer<typeof insertCampaignGroupSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type AdGroup = typeof adGroups.$inferSelect;
export type InsertAdGroup = z.infer<typeof insertAdGroupSchema>;
export type Creative = typeof creatives.$inferSelect;
export type InsertCreative = z.infer<typeof insertCreativeSchema>;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type InsertCampaignMetric = z.infer<typeof insertCampaignMetricSchema>;
export type CampaignSchedule = typeof campaignSchedules.$inferSelect;
export type InsertCampaignSchedule = z.infer<typeof insertCampaignScheduleSchema>;
export type OptimizationRule = typeof optimizationRules.$inferSelect;
export type InsertOptimizationRule = z.infer<typeof insertOptimizationRuleSchema>;
export type CampaignAuditLog = typeof campaignAuditLogs.$inferSelect;
export type InsertCampaignAuditLog = z.infer<typeof insertCampaignAuditLogSchema>;
export type CustomerDataUpload = typeof customerDataUploads.$inferSelect;
export type InsertCustomerDataUpload = z.infer<typeof insertCustomerDataUploadSchema>;
