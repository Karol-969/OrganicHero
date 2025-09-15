import { 
  type User, 
  type InsertUser,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type SubscriptionHistory,
  type InsertSubscriptionHistory,
  type PaymentHistory,
  type InsertPaymentHistory,
  type UsageTracking,
  type InsertUsageTracking,
  // Campaign Management Types
  type Platform,
  type InsertPlatform,
  type PlatformCredential,
  type InsertPlatformCredential,
  type Audience,
  type InsertAudience,
  type CampaignGroup,
  type InsertCampaignGroup,
  type Campaign,
  type InsertCampaign,
  type AdGroup,
  type InsertAdGroup,
  type Creative,
  type InsertCreative,
  type CampaignMetric,
  type InsertCampaignMetric,
  type CampaignSchedule,
  type InsertCampaignSchedule,
  type OptimizationRule,
  type InsertOptimizationRule,
  type CampaignAuditLog,
  type InsertCampaignAuditLog,
  type CustomerDataUpload,
  type InsertCustomerDataUpload
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface with subscription management methods
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateUserSubscriptionStatus(userId: string, status: string): Promise<User | undefined>;
  updateUserSubscriptionPlan(userId: string, plan: string): Promise<User | undefined>;
  
  // Subscription Plans operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  
  // Subscription History operations
  getSubscriptionHistory(userId: string): Promise<SubscriptionHistory[]>;
  createSubscriptionHistoryEntry(entry: InsertSubscriptionHistory): Promise<SubscriptionHistory>;
  
  // Payment History operations
  getPaymentHistory(userId: string): Promise<PaymentHistory[]>;
  getPaymentByStripePaymentIntentId(paymentIntentId: string): Promise<PaymentHistory | undefined>;
  createPaymentHistoryEntry(entry: InsertPaymentHistory): Promise<PaymentHistory>;
  
  // Usage Tracking operations
  getUserUsage(userId: string, month: number, year: number): Promise<UsageTracking | undefined>;
  createOrUpdateUsage(entry: InsertUsageTracking): Promise<UsageTracking>;
  incrementAnalysisUsage(userId: string): Promise<UsageTracking>;
  incrementKeywordUsage(userId: string, count?: number): Promise<UsageTracking>;
  incrementCompetitorUsage(userId: string, count?: number): Promise<UsageTracking>;

  // =============================================================================
  // CAMPAIGN MANAGEMENT OPERATIONS
  // =============================================================================

  // Platform operations
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: string): Promise<Platform | undefined>;
  getPlatformByName(name: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined>;
  deletePlatform(id: string): Promise<boolean>;

  // Platform Credentials operations
  getPlatformCredentials(userId: string): Promise<PlatformCredential[]>;
  getPlatformCredential(id: string): Promise<PlatformCredential | undefined>;
  getPlatformCredentialsByPlatform(userId: string, platformId: string): Promise<PlatformCredential[]>;
  createPlatformCredential(credential: InsertPlatformCredential): Promise<PlatformCredential>;
  updatePlatformCredential(id: string, updates: Partial<PlatformCredential>): Promise<PlatformCredential | undefined>;
  deletePlatformCredential(id: string): Promise<boolean>;

  // Audience operations
  getAudiences(userId: string): Promise<Audience[]>;
  getAudience(id: string): Promise<Audience | undefined>;
  getAudiencesByType(userId: string, type: string): Promise<Audience[]>;
  createAudience(audience: InsertAudience): Promise<Audience>;
  updateAudience(id: string, updates: Partial<Audience>): Promise<Audience | undefined>;
  deleteAudience(id: string): Promise<boolean>;

  // Campaign Group operations
  getCampaignGroups(userId: string): Promise<CampaignGroup[]>;
  getCampaignGroup(id: string): Promise<CampaignGroup | undefined>;
  createCampaignGroup(group: InsertCampaignGroup): Promise<CampaignGroup>;
  updateCampaignGroup(id: string, updates: Partial<CampaignGroup>): Promise<CampaignGroup | undefined>;
  deleteCampaignGroup(id: string): Promise<boolean>;

  // Campaign operations
  getCampaigns(userId: string, filters?: { groupId?: string; status?: string; platformCredentialId?: string }): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByGroup(groupId: string): Promise<Campaign[]>;
  getCampaignsByPlatform(platformCredentialId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  // Ad Group operations
  getAdGroups(campaignId: string): Promise<AdGroup[]>;
  getAdGroup(id: string): Promise<AdGroup | undefined>;
  createAdGroup(adGroup: InsertAdGroup): Promise<AdGroup>;
  updateAdGroup(id: string, updates: Partial<AdGroup>): Promise<AdGroup | undefined>;
  deleteAdGroup(id: string): Promise<boolean>;

  // Creative operations
  getCreatives(userId: string, filters?: { adGroupId?: string; type?: string; status?: string }): Promise<Creative[]>;
  getCreative(id: string): Promise<Creative | undefined>;
  getCreativesByAdGroup(adGroupId: string): Promise<Creative[]>;
  createCreative(creative: InsertCreative): Promise<Creative>;
  updateCreative(id: string, updates: Partial<Creative>): Promise<Creative | undefined>;
  deleteCreative(id: string): Promise<boolean>;

  // Campaign Metrics operations
  getCampaignMetrics(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      granularity?: string;
      adGroupId?: string;
      creativeId?: string;
    }
  ): Promise<CampaignMetric[]>;
  getCampaignMetric(id: string): Promise<CampaignMetric | undefined>;
  createCampaignMetric(metric: InsertCampaignMetric): Promise<CampaignMetric>;
  bulkCreateCampaignMetrics(metrics: InsertCampaignMetric[]): Promise<CampaignMetric[]>;
  getMetricsSummary(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    campaignId: string;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    totalConversions: number;
    totalConversionValue: number;
  }[]>;

  // Campaign Schedule operations
  getCampaignSchedules(campaignId: string): Promise<CampaignSchedule[]>;
  getCampaignSchedule(id: string): Promise<CampaignSchedule | undefined>;
  getPendingSchedules(): Promise<CampaignSchedule[]>;
  createCampaignSchedule(schedule: InsertCampaignSchedule): Promise<CampaignSchedule>;
  updateCampaignSchedule(id: string, updates: Partial<CampaignSchedule>): Promise<CampaignSchedule | undefined>;
  deleteCampaignSchedule(id: string): Promise<boolean>;

  // Optimization Rule operations
  getOptimizationRules(userId: string, campaignId?: string): Promise<OptimizationRule[]>;
  getOptimizationRule(id: string): Promise<OptimizationRule | undefined>;
  getActiveOptimizationRules(campaignId?: string): Promise<OptimizationRule[]>;
  createOptimizationRule(rule: InsertOptimizationRule): Promise<OptimizationRule>;
  updateOptimizationRule(id: string, updates: Partial<OptimizationRule>): Promise<OptimizationRule | undefined>;
  deleteOptimizationRule(id: string): Promise<boolean>;

  // Campaign Audit Log operations
  getCampaignAuditLogs(
    filters: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number
  ): Promise<CampaignAuditLog[]>;
  createCampaignAuditLog(log: InsertCampaignAuditLog): Promise<CampaignAuditLog>;

  // Customer Data Upload operations
  getCustomerDataUploads(userId: string): Promise<CustomerDataUpload[]>;
  getCustomerDataUpload(id: string): Promise<CustomerDataUpload | undefined>;
  createCustomerDataUpload(upload: InsertCustomerDataUpload): Promise<CustomerDataUpload>;
  updateCustomerDataUpload(id: string, updates: Partial<CustomerDataUpload>): Promise<CustomerDataUpload | undefined>;
  deleteCustomerDataUpload(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subscriptionPlans: Map<string, SubscriptionPlan>;
  private subscriptionHistory: Map<string, SubscriptionHistory>;
  private paymentHistory: Map<string, PaymentHistory>;
  private usageTracking: Map<string, UsageTracking>;
  
  // Campaign Management Storage
  private platforms: Map<string, Platform>;
  private platformCredentials: Map<string, PlatformCredential>;
  private audiences: Map<string, Audience>;
  private campaignGroups: Map<string, CampaignGroup>;
  private campaigns: Map<string, Campaign>;
  private adGroups: Map<string, AdGroup>;
  private creatives: Map<string, Creative>;
  private campaignMetrics: Map<string, CampaignMetric>;
  private campaignSchedules: Map<string, CampaignSchedule>;
  private optimizationRules: Map<string, OptimizationRule>;
  private campaignAuditLogs: Map<string, CampaignAuditLog>;
  private customerDataUploads: Map<string, CustomerDataUpload>;

  constructor() {
    this.users = new Map();
    this.subscriptionPlans = new Map();
    this.subscriptionHistory = new Map();
    this.paymentHistory = new Map();
    this.usageTracking = new Map();
    
    // Initialize campaign management storage
    this.platforms = new Map();
    this.platformCredentials = new Map();
    this.audiences = new Map();
    this.campaignGroups = new Map();
    this.campaigns = new Map();
    this.adGroups = new Map();
    this.creatives = new Map();
    this.campaignMetrics = new Map();
    this.campaignSchedules = new Map();
    this.optimizationRules = new Map();
    this.campaignAuditLogs = new Map();
    this.customerDataUploads = new Map();
    
    // Initialize default data
    this.initializeDefaultPlans();
    this.initializeDefaultPlatforms();
  }

  private async initializeDefaultPlans() {
    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        name: 'Basic',
        stripePriceId: 'price_basic_monthly', // Will be updated with real Stripe price IDs
        priceMonthlyCents: 2999,
        priceYearlyCents: 29999,
        features: [
          '10 SEO analyses per month',
          '100 keyword tracking',
          '5 competitor analysis',
          'Basic reporting',
          'Email support'
        ],
        maxAnalyses: 10,
        maxKeywords: 100,
        maxCompetitors: 5,
        isActive: true
      },
      {
        name: 'Pro',
        stripePriceId: 'price_pro_monthly',
        priceMonthlyCents: 7999,
        priceYearlyCents: 79999,
        features: [
          '50 SEO analyses per month',
          '500 keyword tracking',
          '20 competitor analysis',
          'Advanced reporting',
          'Priority support',
          'API access'
        ],
        maxAnalyses: 50,
        maxKeywords: 500,
        maxCompetitors: 20,
        isActive: true
      },
      {
        name: 'Enterprise',
        stripePriceId: 'price_enterprise_monthly',
        priceMonthlyCents: 19999,
        priceYearlyCents: 199999,
        features: [
          'Unlimited SEO analyses',
          'Unlimited keyword tracking',
          'Unlimited competitor analysis',
          'Custom reporting',
          'Dedicated support',
          'Full API access',
          'White-label options'
        ],
        maxAnalyses: null,
        maxKeywords: null,
        maxCompetitors: null,
        isActive: true
      }
    ];

    for (const plan of defaultPlans) {
      await this.createSubscriptionPlan(plan);
    }
  }

  private async initializeDefaultPlatforms() {
    const defaultPlatforms: InsertPlatform[] = [
      {
        name: 'google_ads',
        displayName: 'Google Ads',
        apiVersion: 'v15',
        isActive: true,
        supportsOAuth: true,
        apiEndpoint: 'https://googleads.googleapis.com',
        documentationUrl: 'https://developers.google.com/google-ads/api',
        iconUrl: 'https://www.gstatic.com/images/branding/product/1x/googleg_16dp.png',
        configuration: {
          rateLimits: { requestsPerMinute: 15000 },
          supportedObjectives: ['awareness', 'consideration', 'conversion', 'app_install'],
          supportedBidStrategies: ['manual_cpc', 'auto_cpc', 'target_cpa', 'target_roas', 'maximize_clicks']
        }
      },
      {
        name: 'meta_ads',
        displayName: 'Meta Ads',
        apiVersion: 'v18.0',
        isActive: true,
        supportsOAuth: true,
        apiEndpoint: 'https://graph.facebook.com',
        documentationUrl: 'https://developers.facebook.com/docs/marketing-apis',
        iconUrl: 'https://static.xx.fbcdn.net/rsrc.php/v3/yC/r/faq_tyJQplI.png',
        configuration: {
          rateLimits: { requestsPerMinute: 25000 },
          supportedObjectives: ['awareness', 'consideration', 'conversion', 'app_install', 'lead_generation'],
          supportedBidStrategies: ['auto_cpm', 'manual_cpm', 'target_cpa']
        }
      },
      {
        name: 'tiktok_ads',
        displayName: 'TikTok Ads',
        apiVersion: 'v1.3',
        isActive: true,
        supportsOAuth: true,
        apiEndpoint: 'https://business-api.tiktok.com',
        documentationUrl: 'https://ads.tiktok.com/marketing_api/docs',
        iconUrl: 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png',
        configuration: {
          rateLimits: { requestsPerMinute: 10000 },
          supportedObjectives: ['awareness', 'consideration', 'conversion', 'app_install'],
          supportedBidStrategies: ['auto_cpm', 'manual_cpm', 'target_cpa']
        }
      },
      {
        name: 'linkedin_ads',
        displayName: 'LinkedIn Ads',
        apiVersion: 'v2',
        isActive: true,
        supportsOAuth: true,
        apiEndpoint: 'https://api.linkedin.com',
        documentationUrl: 'https://docs.microsoft.com/en-us/linkedin/marketing/',
        iconUrl: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
        configuration: {
          rateLimits: { requestsPerMinute: 5000 },
          supportedObjectives: ['awareness', 'consideration', 'conversion', 'lead_generation'],
          supportedBidStrategies: ['manual_cpc', 'auto_cpc', 'target_cpa']
        }
      }
    ];

    for (const platform of defaultPlatforms) {
      await this.createPlatform(platform);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === stripeCustomerId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: 'free',
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }

  async updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeSubscriptionId });
  }

  async updateUserSubscriptionStatus(userId: string, status: string): Promise<User | undefined> {
    return this.updateUser(userId, { subscriptionStatus: status as any });
  }

  async updateUserSubscriptionPlan(userId: string, plan: string): Promise<User | undefined> {
    return this.updateUser(userId, { subscriptionPlan: plan as any });
  }

  // Subscription Plans operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values()).filter(plan => plan.isActive);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values()).find(
      (plan) => plan.name === name,
    );
  }

  async getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values()).find(
      (plan) => plan.stripePriceId === stripePriceId,
    );
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = randomUUID();
    const plan: SubscriptionPlan = { 
      ...insertPlan, 
      id,
      priceYearlyCents: insertPlan.priceYearlyCents || null,
      maxAnalyses: insertPlan.maxAnalyses || null,
      maxKeywords: insertPlan.maxKeywords || null,
      maxCompetitors: insertPlan.maxCompetitors || null,
      isActive: insertPlan.isActive !== undefined ? insertPlan.isActive : true,
      createdAt: new Date()
    };
    this.subscriptionPlans.set(id, plan);
    return plan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = this.subscriptionPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan: SubscriptionPlan = { ...plan, ...updates };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Subscription History operations
  async getSubscriptionHistory(userId: string): Promise<SubscriptionHistory[]> {
    return Array.from(this.subscriptionHistory.values()).filter(
      (entry) => entry.userId === userId,
    );
  }

  async createSubscriptionHistoryEntry(insertEntry: InsertSubscriptionHistory): Promise<SubscriptionHistory> {
    const id = randomUUID();
    const entry: SubscriptionHistory = { 
      ...insertEntry, 
      id,
      planId: insertEntry.planId || null,
      startDate: insertEntry.startDate || null,
      endDate: insertEntry.endDate || null,
      canceledAt: insertEntry.canceledAt || null,
      cancelReason: insertEntry.cancelReason || null,
      createdAt: new Date()
    };
    this.subscriptionHistory.set(id, entry);
    return entry;
  }

  // Payment History operations
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    return Array.from(this.paymentHistory.values()).filter(
      (payment) => payment.userId === userId,
    );
  }

  async getPaymentByStripePaymentIntentId(paymentIntentId: string): Promise<PaymentHistory | undefined> {
    return Array.from(this.paymentHistory.values()).find(
      (payment) => payment.stripePaymentIntentId === paymentIntentId,
    );
  }

  async createPaymentHistoryEntry(insertEntry: InsertPaymentHistory): Promise<PaymentHistory> {
    const id = randomUUID();
    const entry: PaymentHistory = { 
      ...insertEntry, 
      id,
      stripeInvoiceId: insertEntry.stripeInvoiceId || null,
      currency: insertEntry.currency || 'usd',
      paymentMethod: insertEntry.paymentMethod || null,
      description: insertEntry.description || null,
      createdAt: new Date()
    };
    this.paymentHistory.set(id, entry);
    return entry;
  }

  // Usage Tracking operations
  async getUserUsage(userId: string, month: number, year: number): Promise<UsageTracking | undefined> {
    return Array.from(this.usageTracking.values()).find(
      (usage) => usage.userId === userId && usage.month === month && usage.year === year,
    );
  }

  async createOrUpdateUsage(insertEntry: InsertUsageTracking): Promise<UsageTracking> {
    const existing = await this.getUserUsage(insertEntry.userId, insertEntry.month, insertEntry.year);
    
    if (existing) {
      const updated: UsageTracking = {
        ...existing,
        ...insertEntry,
        updatedAt: new Date()
      };
      this.usageTracking.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const now = new Date();
      const entry: UsageTracking = { 
        ...insertEntry, 
        id,
        analysesUsed: insertEntry.analysesUsed || 0,
        keywordsTracked: insertEntry.keywordsTracked || 0,
        competitorsAnalyzed: insertEntry.competitorsAnalyzed || 0,
        createdAt: now,
        updatedAt: now
      };
      this.usageTracking.set(id, entry);
      return entry;
    }
  }

  async incrementAnalysisUsage(userId: string): Promise<UsageTracking> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const existing = await this.getUserUsage(userId, month, year);
    const analysesUsed = (existing?.analysesUsed || 0) + 1;
    
    return this.createOrUpdateUsage({
      userId,
      month,
      year,
      analysesUsed,
      keywordsTracked: existing?.keywordsTracked || 0,
      competitorsAnalyzed: existing?.competitorsAnalyzed || 0
    });
  }

  async incrementKeywordUsage(userId: string, count: number = 1): Promise<UsageTracking> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const existing = await this.getUserUsage(userId, month, year);
    const keywordsTracked = (existing?.keywordsTracked || 0) + count;
    
    return this.createOrUpdateUsage({
      userId,
      month,
      year,
      analysesUsed: existing?.analysesUsed || 0,
      keywordsTracked,
      competitorsAnalyzed: existing?.competitorsAnalyzed || 0
    });
  }

  async incrementCompetitorUsage(userId: string, count: number = 1): Promise<UsageTracking> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const existing = await this.getUserUsage(userId, month, year);
    const competitorsAnalyzed = (existing?.competitorsAnalyzed || 0) + count;
    
    return this.createOrUpdateUsage({
      userId,
      month,
      year,
      analysesUsed: existing?.analysesUsed || 0,
      keywordsTracked: existing?.keywordsTracked || 0,
      competitorsAnalyzed
    });
  }

  // =============================================================================
  // CAMPAIGN MANAGEMENT OPERATIONS IMPLEMENTATION
  // =============================================================================

  // Platform operations
  async getPlatforms(): Promise<Platform[]> {
    return Array.from(this.platforms.values()).filter(platform => platform.isActive);
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    return Array.from(this.platforms.values()).find(
      (platform) => platform.name === name,
    );
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const id = randomUUID();
    const now = new Date();
    const platform: Platform = { 
      ...insertPlatform, 
      id,
      apiVersion: insertPlatform.apiVersion || null,
      isActive: insertPlatform.isActive !== undefined ? insertPlatform.isActive : true,
      supportsOAuth: insertPlatform.supportsOAuth !== undefined ? insertPlatform.supportsOAuth : true,
      apiEndpoint: insertPlatform.apiEndpoint || null,
      documentationUrl: insertPlatform.documentationUrl || null,
      iconUrl: insertPlatform.iconUrl || null,
      configuration: insertPlatform.configuration || null,
      createdAt: now,
      updatedAt: now
    };
    this.platforms.set(id, platform);
    return platform;
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined> {
    const platform = this.platforms.get(id);
    if (!platform) return undefined;
    
    const updatedPlatform: Platform = { 
      ...platform, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.platforms.set(id, updatedPlatform);
    return updatedPlatform;
  }

  async deletePlatform(id: string): Promise<boolean> {
    return this.platforms.delete(id);
  }

  // Platform Credentials operations
  async getPlatformCredentials(userId: string): Promise<PlatformCredential[]> {
    return Array.from(this.platformCredentials.values()).filter(
      (credential) => credential.userId === userId,
    );
  }

  async getPlatformCredential(id: string): Promise<PlatformCredential | undefined> {
    return this.platformCredentials.get(id);
  }

  async getPlatformCredentialsByPlatform(userId: string, platformId: string): Promise<PlatformCredential[]> {
    return Array.from(this.platformCredentials.values()).filter(
      (credential) => credential.userId === userId && credential.platformId === platformId,
    );
  }

  async createPlatformCredential(insertCredential: InsertPlatformCredential): Promise<PlatformCredential> {
    const id = randomUUID();
    const now = new Date();
    const credential: PlatformCredential = { 
      ...insertCredential, 
      id,
      accountName: insertCredential.accountName || null,
      accessTokenEncrypted: insertCredential.accessTokenEncrypted || null,
      refreshTokenEncrypted: insertCredential.refreshTokenEncrypted || null,
      apiKeyEncrypted: insertCredential.apiKeyEncrypted || null,
      encryptionKeyId: randomUUID(),
      keyRotationVersion: 1,
      tokenExpiresAt: insertCredential.tokenExpiresAt || null,
      lastKeyRotationAt: now,
      tokenHash: insertCredential.accessTokenEncrypted ? 'mock-hash' : null,
      isActive: insertCredential.isActive !== undefined ? insertCredential.isActive : true,
      lastSyncAt: insertCredential.lastSyncAt || null,
      permissions: insertCredential.permissions || null,
      metadata: insertCredential.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.platformCredentials.set(id, credential);
    return credential;
  }

  async updatePlatformCredential(id: string, updates: Partial<PlatformCredential>): Promise<PlatformCredential | undefined> {
    const credential = this.platformCredentials.get(id);
    if (!credential) return undefined;
    
    const updatedCredential: PlatformCredential = { 
      ...credential, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.platformCredentials.set(id, updatedCredential);
    return updatedCredential;
  }

  async deletePlatformCredential(id: string): Promise<boolean> {
    return this.platformCredentials.delete(id);
  }

  // Audience operations
  async getAudiences(userId: string): Promise<Audience[]> {
    return Array.from(this.audiences.values()).filter(
      (audience) => audience.userId === userId,
    );
  }

  async getAudience(id: string): Promise<Audience | undefined> {
    return this.audiences.get(id);
  }

  async getAudiencesByType(userId: string, type: string): Promise<Audience[]> {
    return Array.from(this.audiences.values()).filter(
      (audience) => audience.userId === userId && audience.type === type,
    );
  }

  async createAudience(insertAudience: InsertAudience): Promise<Audience> {
    const id = randomUUID();
    const now = new Date();
    const audience: Audience = { 
      ...insertAudience, 
      id,
      description: insertAudience.description || null,
      sourceType: insertAudience.sourceType || null,
      size: insertAudience.size || null,
      status: insertAudience.status || 'processing',
      platformSpecific: insertAudience.platformSpecific || null,
      targetingCriteria: insertAudience.targetingCriteria || null,
      uploadedDataHash: insertAudience.uploadedDataHash || null,
      piiDataHashSalt: randomUUID(),
      customerIdentifierHashes: null,
      privacyLevel: insertAudience.privacyLevel || 'confidential',
      refreshFrequency: insertAudience.refreshFrequency || 'manual',
      lastRefreshAt: insertAudience.lastRefreshAt || null,
      expiresAt: insertAudience.expiresAt || null,
      createdAt: now,
      updatedAt: now
    };
    this.audiences.set(id, audience);
    return audience;
  }

  async updateAudience(id: string, updates: Partial<Audience>): Promise<Audience | undefined> {
    const audience = this.audiences.get(id);
    if (!audience) return undefined;
    
    const updatedAudience: Audience = { 
      ...audience, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.audiences.set(id, updatedAudience);
    return updatedAudience;
  }

  async deleteAudience(id: string): Promise<boolean> {
    return this.audiences.delete(id);
  }

  // Campaign Group operations
  async getCampaignGroups(userId: string): Promise<CampaignGroup[]> {
    return Array.from(this.campaignGroups.values()).filter(
      (group) => group.userId === userId,
    );
  }

  async getCampaignGroup(id: string): Promise<CampaignGroup | undefined> {
    return this.campaignGroups.get(id);
  }

  async createCampaignGroup(insertGroup: InsertCampaignGroup): Promise<CampaignGroup> {
    const id = randomUUID();
    const now = new Date();
    const group: CampaignGroup = { 
      ...insertGroup, 
      id,
      description: insertGroup.description || null,
      status: insertGroup.status || 'active',
      budget: insertGroup.budget || null,
      tags: insertGroup.tags || null,
      metadata: insertGroup.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.campaignGroups.set(id, group);
    return group;
  }

  async updateCampaignGroup(id: string, updates: Partial<CampaignGroup>): Promise<CampaignGroup | undefined> {
    const group = this.campaignGroups.get(id);
    if (!group) return undefined;
    
    const updatedGroup: CampaignGroup = { 
      ...group, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.campaignGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteCampaignGroup(id: string): Promise<boolean> {
    return this.campaignGroups.delete(id);
  }

  // Campaign operations
  async getCampaigns(userId: string, filters?: { groupId?: string; status?: string; platformCredentialId?: string }): Promise<Campaign[]> {
    let campaigns = Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.userId === userId,
    );

    if (filters?.groupId) {
      campaigns = campaigns.filter(campaign => campaign.groupId === filters.groupId);
    }
    if (filters?.status) {
      campaigns = campaigns.filter(campaign => campaign.status === filters.status);
    }
    if (filters?.platformCredentialId) {
      campaigns = campaigns.filter(campaign => campaign.platformCredentialId === filters.platformCredentialId);
    }

    return campaigns;
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByGroup(groupId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.groupId === groupId,
    );
  }

  async getCampaignsByPlatform(platformCredentialId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.platformCredentialId === platformCredentialId,
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const now = new Date();
    const campaign: Campaign = { 
      ...insertCampaign, 
      id,
      groupId: insertCampaign.groupId || null,
      externalCampaignId: insertCampaign.externalCampaignId || null,
      description: insertCampaign.description || null,
      status: insertCampaign.status || 'draft',
      budgetAmountCents: insertCampaign.budgetAmountCents || null,
      bidStrategy: insertCampaign.bidStrategy || null,
      bidAmountCents: insertCampaign.bidAmountCents || null,
      startDate: insertCampaign.startDate || null,
      endDate: insertCampaign.endDate || null,
      timezone: insertCampaign.timezone || 'UTC',
      targetingCriteria: insertCampaign.targetingCriteria || null,
      conversionGoals: insertCampaign.conversionGoals || null,
      platformSettings: insertCampaign.platformSettings || null,
      optimizationRules: insertCampaign.optimizationRules || null,
      tags: insertCampaign.tags || null,
      isTemplate: insertCampaign.isTemplate || false,
      templateName: insertCampaign.templateName || null,
      lastSyncAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign: Campaign = { 
      ...campaign, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Ad Group operations
  async getAdGroups(campaignId: string): Promise<AdGroup[]> {
    return Array.from(this.adGroups.values()).filter(
      (adGroup) => adGroup.campaignId === campaignId,
    );
  }

  async getAdGroup(id: string): Promise<AdGroup | undefined> {
    return this.adGroups.get(id);
  }

  async createAdGroup(insertAdGroup: InsertAdGroup): Promise<AdGroup> {
    const id = randomUUID();
    const now = new Date();
    const adGroup: AdGroup = { 
      ...insertAdGroup, 
      id,
      externalAdGroupId: insertAdGroup.externalAdGroupId || null,
      status: insertAdGroup.status || 'active',
      bidStrategy: insertAdGroup.bidStrategy || 'inherit',
      bidAmountCents: insertAdGroup.bidAmountCents || null,
      audienceId: insertAdGroup.audienceId || null,
      targetingCriteria: insertAdGroup.targetingCriteria || null,
      optimizationRules: insertAdGroup.optimizationRules || null,
      createdAt: now,
      updatedAt: now
    };
    this.adGroups.set(id, adGroup);
    return adGroup;
  }

  async updateAdGroup(id: string, updates: Partial<AdGroup>): Promise<AdGroup | undefined> {
    const adGroup = this.adGroups.get(id);
    if (!adGroup) return undefined;
    
    const updatedAdGroup: AdGroup = { 
      ...adGroup, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.adGroups.set(id, updatedAdGroup);
    return updatedAdGroup;
  }

  async deleteAdGroup(id: string): Promise<boolean> {
    return this.adGroups.delete(id);
  }

  // Creative operations
  async getCreatives(userId: string, filters?: { adGroupId?: string; type?: string; status?: string }): Promise<Creative[]> {
    let creatives = Array.from(this.creatives.values()).filter(
      (creative) => creative.userId === userId,
    );

    if (filters?.adGroupId) {
      creatives = creatives.filter(creative => creative.adGroupId === filters.adGroupId);
    }
    if (filters?.type) {
      creatives = creatives.filter(creative => creative.type === filters.type);
    }
    if (filters?.status) {
      creatives = creatives.filter(creative => creative.status === filters.status);
    }

    return creatives;
  }

  async getCreative(id: string): Promise<Creative | undefined> {
    return this.creatives.get(id);
  }

  async getCreativesByAdGroup(adGroupId: string): Promise<Creative[]> {
    return Array.from(this.creatives.values()).filter(
      (creative) => creative.adGroupId === adGroupId,
    );
  }

  async createCreative(insertCreative: InsertCreative): Promise<Creative> {
    const id = randomUUID();
    const now = new Date();
    const creative: Creative = { 
      ...insertCreative, 
      id,
      adGroupId: insertCreative.adGroupId || null,
      externalCreativeId: insertCreative.externalCreativeId || null,
      format: insertCreative.format || null,
      status: insertCreative.status || 'active',
      primaryText: insertCreative.primaryText || null,
      headline: insertCreative.headline || null,
      description: insertCreative.description || null,
      callToAction: insertCreative.callToAction || null,
      destinationUrl: insertCreative.destinationUrl || null,
      displayUrl: insertCreative.displayUrl || null,
      trackingUrls: insertCreative.trackingUrls || null,
      mediaAssets: insertCreative.mediaAssets || null,
      platformVariations: insertCreative.platformVariations || null,
      abTestGroup: insertCreative.abTestGroup || null,
      createdAt: now,
      updatedAt: now
    };
    this.creatives.set(id, creative);
    return creative;
  }

  async updateCreative(id: string, updates: Partial<Creative>): Promise<Creative | undefined> {
    const creative = this.creatives.get(id);
    if (!creative) return undefined;
    
    const updatedCreative: Creative = { 
      ...creative, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.creatives.set(id, updatedCreative);
    return updatedCreative;
  }

  async deleteCreative(id: string): Promise<boolean> {
    return this.creatives.delete(id);
  }

  // Campaign Metrics operations
  async getCampaignMetrics(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      granularity?: string;
      adGroupId?: string;
      creativeId?: string;
    }
  ): Promise<CampaignMetric[]> {
    let metrics = Array.from(this.campaignMetrics.values()).filter(
      (metric) => metric.campaignId === campaignId,
    );

    if (options?.startDate) {
      metrics = metrics.filter(metric => metric.date >= options.startDate!);
    }
    if (options?.endDate) {
      metrics = metrics.filter(metric => metric.date <= options.endDate!);
    }
    if (options?.granularity) {
      metrics = metrics.filter(metric => metric.granularity === options.granularity);
    }
    if (options?.adGroupId) {
      metrics = metrics.filter(metric => metric.adGroupId === options.adGroupId);
    }
    if (options?.creativeId) {
      metrics = metrics.filter(metric => metric.creativeId === options.creativeId);
    }

    return metrics.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getCampaignMetric(id: string): Promise<CampaignMetric | undefined> {
    return this.campaignMetrics.get(id);
  }

  async createCampaignMetric(insertMetric: InsertCampaignMetric): Promise<CampaignMetric> {
    const id = randomUUID();
    const now = new Date();
    const metric: CampaignMetric = { 
      ...insertMetric, 
      id,
      adGroupId: insertMetric.adGroupId || null,
      creativeId: insertMetric.creativeId || null,
      granularity: insertMetric.granularity || 'day',
      impressions: insertMetric.impressions || 0,
      clicks: insertMetric.clicks || 0,
      spendCents: insertMetric.spendCents || 0,
      conversions: insertMetric.conversions || 0,
      conversionValueCents: insertMetric.conversionValueCents || 0,
      ctr: insertMetric.ctr || null,
      cpcCents: insertMetric.cpcCents || null,
      cpmCents: insertMetric.cpmCents || null,
      cpaCents: insertMetric.cpaCents || null,
      roas: insertMetric.roas || null,
      conversionRate: insertMetric.conversionRate || null,
      platformMetrics: insertMetric.platformMetrics || null,
      qualityScore: insertMetric.qualityScore || null,
      relevanceScore: insertMetric.relevanceScore || null,
      createdAt: now
    };
    this.campaignMetrics.set(id, metric);
    return metric;
  }

  async bulkCreateCampaignMetrics(metrics: InsertCampaignMetric[]): Promise<CampaignMetric[]> {
    const createdMetrics: CampaignMetric[] = [];
    for (const metric of metrics) {
      const created = await this.createCampaignMetric(metric);
      createdMetrics.push(created);
    }
    return createdMetrics;
  }

  async getMetricsSummary(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    campaignId: string;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    totalConversions: number;
    totalConversionValue: number;
  }[]> {
    const summaries: { [campaignId: string]: any } = {};
    
    for (const campaignId of campaignIds) {
      const metrics = await this.getCampaignMetrics(campaignId, { startDate, endDate });
      
      summaries[campaignId] = {
        campaignId,
        totalImpressions: metrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
        totalClicks: metrics.reduce((sum, m) => sum + (m.clicks || 0), 0),
        totalSpend: metrics.reduce((sum, m) => sum + (m.spendCents || 0), 0),
        totalConversions: metrics.reduce((sum, m) => sum + (m.conversions || 0), 0),
        totalConversionValue: metrics.reduce((sum, m) => sum + (m.conversionValueCents || 0), 0),
      };
    }

    return Object.values(summaries);
  }

  // Campaign Schedule operations
  async getCampaignSchedules(campaignId: string): Promise<CampaignSchedule[]> {
    return Array.from(this.campaignSchedules.values()).filter(
      (schedule) => schedule.campaignId === campaignId,
    );
  }

  async getCampaignSchedule(id: string): Promise<CampaignSchedule | undefined> {
    return this.campaignSchedules.get(id);
  }

  async getPendingSchedules(): Promise<CampaignSchedule[]> {
    const now = new Date();
    return Array.from(this.campaignSchedules.values()).filter(
      (schedule) => schedule.status === 'pending' && schedule.scheduledAt <= now,
    );
  }

  async createCampaignSchedule(insertSchedule: InsertCampaignSchedule): Promise<CampaignSchedule> {
    const id = randomUUID();
    const now = new Date();
    const schedule: CampaignSchedule = { 
      ...insertSchedule, 
      id,
      timezone: insertSchedule.timezone || 'UTC',
      frequency: insertSchedule.frequency || null,
      daysOfWeek: insertSchedule.daysOfWeek || null,
      endRecurringAt: insertSchedule.endRecurringAt || null,
      conditions: insertSchedule.conditions || null,
      actionParameters: insertSchedule.actionParameters || null,
      status: insertSchedule.status || 'pending',
      executedAt: insertSchedule.executedAt || null,
      error: insertSchedule.error || null,
      createdAt: now
    };
    this.campaignSchedules.set(id, schedule);
    return schedule;
  }

  async updateCampaignSchedule(id: string, updates: Partial<CampaignSchedule>): Promise<CampaignSchedule | undefined> {
    const schedule = this.campaignSchedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule: CampaignSchedule = { 
      ...schedule, 
      ...updates 
    };
    this.campaignSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteCampaignSchedule(id: string): Promise<boolean> {
    return this.campaignSchedules.delete(id);
  }

  // Optimization Rule operations
  async getOptimizationRules(userId: string, campaignId?: string): Promise<OptimizationRule[]> {
    let rules = Array.from(this.optimizationRules.values()).filter(
      (rule) => rule.userId === userId,
    );

    if (campaignId) {
      rules = rules.filter(rule => rule.campaignId === campaignId);
    }

    return rules;
  }

  async getOptimizationRule(id: string): Promise<OptimizationRule | undefined> {
    return this.optimizationRules.get(id);
  }

  async getActiveOptimizationRules(campaignId?: string): Promise<OptimizationRule[]> {
    let rules = Array.from(this.optimizationRules.values()).filter(
      (rule) => rule.isActive,
    );

    if (campaignId) {
      rules = rules.filter(rule => rule.campaignId === campaignId);
    }

    return rules;
  }

  async createOptimizationRule(insertRule: InsertOptimizationRule): Promise<OptimizationRule> {
    const id = randomUUID();
    const now = new Date();
    const rule: OptimizationRule = { 
      ...insertRule, 
      id,
      campaignId: insertRule.campaignId || null,
      description: insertRule.description || null,
      isActive: insertRule.isActive !== undefined ? insertRule.isActive : true,
      logicalOperator: insertRule.logicalOperator || 'and',
      priority: insertRule.priority || 0,
      cooldownPeriod: insertRule.cooldownPeriod || 3600,
      maxExecutionsPerDay: insertRule.maxExecutionsPerDay || 5,
      lastExecutedAt: insertRule.lastExecutedAt || null,
      executionCount: insertRule.executionCount || 0,
      createdAt: now,
      updatedAt: now
    };
    this.optimizationRules.set(id, rule);
    return rule;
  }

  async updateOptimizationRule(id: string, updates: Partial<OptimizationRule>): Promise<OptimizationRule | undefined> {
    const rule = this.optimizationRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule: OptimizationRule = { 
      ...rule, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.optimizationRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteOptimizationRule(id: string): Promise<boolean> {
    return this.optimizationRules.delete(id);
  }

  // Campaign Audit Log operations
  async getCampaignAuditLogs(
    filters: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number
  ): Promise<CampaignAuditLog[]> {
    let logs = Array.from(this.campaignAuditLogs.values());

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }
    if (filters.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters.startDate) {
      logs = logs.filter(log => log.createdAt && log.createdAt >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter(log => log.createdAt && log.createdAt <= filters.endDate!);
    }

    // Sort by date descending
    logs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    if (limit) {
      logs = logs.slice(0, limit);
    }

    return logs;
  }

  async createCampaignAuditLog(insertLog: InsertCampaignAuditLog): Promise<CampaignAuditLog> {
    const id = randomUUID();
    const now = new Date();
    const log: CampaignAuditLog = { 
      ...insertLog, 
      id,
      changes: insertLog.changes || null,
      metadata: insertLog.metadata || null,
      ipAddress: insertLog.ipAddress,
      userAgent: insertLog.userAgent || null,
      platform: insertLog.platform || null,
      source: insertLog.source || 'manual',
      createdAt: now
    };
    this.campaignAuditLogs.set(id, log);
    return log;
  }

  // Customer Data Upload operations
  async getCustomerDataUploads(userId: string): Promise<CustomerDataUpload[]> {
    return Array.from(this.customerDataUploads.values()).filter(
      (upload) => upload.userId === userId,
    );
  }

  async getCustomerDataUpload(id: string): Promise<CustomerDataUpload | undefined> {
    return this.customerDataUploads.get(id);
  }

  async createCustomerDataUpload(insertUpload: InsertCustomerDataUpload): Promise<CustomerDataUpload> {
    const id = randomUUID();
    const now = new Date();
    const upload: CustomerDataUpload = { 
      ...insertUpload, 
      id,
      status: insertUpload.status || 'uploading',
      fileContentHash: 'mock-hash-' + randomUUID(),
      piiColumnsDetected: null,
      piiHashingSalt: randomUUID(),
      hashedPiiSample: null,
      encryptionKeyId: randomUUID(),
      processedAt: null,
      rowCount: null,
      columnCount: null,
      schema: null,
      dataPreview: null,
      errors: null,
      usedInAudiences: 0,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.customerDataUploads.set(id, upload);
    return upload;
  }

  async updateCustomerDataUpload(id: string, updates: Partial<CustomerDataUpload>): Promise<CustomerDataUpload | undefined> {
    const upload = this.customerDataUploads.get(id);
    if (!upload) return undefined;
    
    const updatedUpload: CustomerDataUpload = { 
      ...upload, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.customerDataUploads.set(id, updatedUpload);
    return updatedUpload;
  }

  async deleteCustomerDataUpload(id: string): Promise<boolean> {
    return this.customerDataUploads.delete(id);
  }
}

export const storage = new MemStorage();
