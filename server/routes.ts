import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seoAnalysisSchema, type SEOAnalysisResult, comprehensiveAnalysisSchema, type ComprehensiveAnalysis, type User } from "@shared/schema";
import { z } from "zod";
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { MultiAgentCoordinator } from './agents';
import { ActionPlanGenerator } from './action-plan-generator';
import Stripe from 'stripe';
import { secureAuthenticateAPI, requireSubscription, sendAuthError, type AuthenticatedRequest } from './secure-auth';
import { registerAuthRoutes } from './auth-routes';

// ⚠️  REMOVED VULNERABLE AUTHENTICATION MIDDLEWARE
// The old authenticateUser middleware that accepted forgeable headers has been completely removed
// and replaced with secure cryptographic authentication in secure-auth.ts

// ⚠️  REMOVED DUPLICATE MIDDLEWARE - using secure version from secure-auth.ts

// ⚠️  REMOVED DUPLICATE HELPER - using secure version from secure-auth.ts

// Helper function to make fetch requests with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Simple in-memory cache for SEO analysis results
interface CacheEntry {
  result: SEOAnalysisResult;
  timestamp: number;
  expires: number;
}

class AnalysisCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  get(domain: string): SEOAnalysisResult | null {
    const entry = this.cache.get(domain);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(domain);
      return null;
    }
    
    console.log(`📦 Cache hit for domain: ${domain}`);
    return entry.result;
  }

  set(domain: string, result: SEOAnalysisResult): void {
    const now = Date.now();
    this.cache.set(domain, {
      result,
      timestamp: now,
      expires: now + this.CACHE_TTL
    });
    console.log(`💾 Cached analysis for domain: ${domain} (expires in ${this.CACHE_TTL/1000/60} minutes)`);
    
    // Clean up expired entries (simple cleanup)
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
    console.log(`🧹 Cache cleanup completed, ${this.cache.size} entries remain`);
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️  Cache cleared');
  }
}

const analysisCache = new AnalysisCache();

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    return domain;
  } catch {
    return url;
  }
}

// Website crawling and business intelligence
interface BusinessIntelligence {
  businessType: string;
  products: string[];
  services: string[];
  location: string;
  industry: string;
  keywords: string[];
  description: string;
}

async function analyzeWebsiteContent(url: string): Promise<BusinessIntelligence> {
  console.log(`🕷️ Starting intelligent website analysis for: ${url}`);
  
  try {
    // First try simple HTTP crawling
    const mainPageContent = await crawlPage(url);
    
    // Find additional pages to crawl
    const additionalUrls = await findImportantPages(url, mainPageContent);
    
    // Crawl additional pages for more context
    const allContent = [mainPageContent];
    for (const additionalUrl of additionalUrls.slice(0, 5)) { // Limit to 5 additional pages
      try {
        const pageContent = await crawlPage(additionalUrl);
        allContent.push(pageContent);
        console.log(`✅ Crawled additional page: ${additionalUrl}`);
      } catch (error) {
        console.log(`⚠️ Could not crawl ${additionalUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Analyze all content to extract business intelligence
    const businessIntel = extractBusinessIntelligence(allContent, url);
    console.log(`🧠 Business intelligence extracted: ${businessIntel.businessType} in ${businessIntel.location}`);
    
    return businessIntel;
    
  } catch (error) {
    console.error('❌ Website analysis failed, using basic fallback:', error);
    
    // Fallback to basic domain analysis
    const domain = extractDomain(url);
    const baseName = domain.split('.')[0].replace(/[-_]/g, ' ');
    
    return {
      businessType: `${baseName} business`,
      products: [],
      services: [`${baseName} services`],
      location: 'United States',
      industry: baseName,
      keywords: [`${baseName}`, `${baseName} services`, `best ${baseName}`],
      description: `Business website for ${baseName}`
    };
  }
}

async function crawlPage(url: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();
    
    // Extract meaningful text content
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit content size
    
    console.log(`📄 Crawled ${url}: ${textContent.length} characters`);
    return textContent;
    
  } catch (error) {
    console.error(`❌ Failed to crawl ${url}:`, error);
    return '';
  }
}

async function findImportantPages(baseUrl: string, mainContent: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(baseUrl, {}, 8000);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const importantPages: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    // Look for important pages like About, Services, Products, Contact
    const importantKeywords = ['about', 'service', 'product', 'contact', 'portfolio', 'work', 'solution', 'team'];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const linkText = $(element).text().toLowerCase().trim();
      
      if (href && importantKeywords.some(keyword => 
        linkText.includes(keyword) || href.toLowerCase().includes(keyword)
      )) {
        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
          const urlObj = new URL(fullUrl);
          
          // Only crawl same domain
          if (urlObj.hostname === baseUrlObj.hostname && !importantPages.includes(fullUrl)) {
            importantPages.push(fullUrl);
          }
        } catch {
          // Skip malformed URLs
        }
      }
    });
    
    console.log(`🔗 Found ${importantPages.length} important pages to crawl`);
    return importantPages;
    
  } catch (error) {
    console.error('❌ Failed to find additional pages:', error);
    return [];
  }
}

function extractBusinessIntelligence(contentArray: string[], url: string): BusinessIntelligence {
  const allContent = contentArray.join(' ').toLowerCase();
  const domain = extractDomain(url);
  
  // Extract business type and industry
  const businessType = detectBusinessType(allContent);
  const industry = detectIndustry(allContent, businessType);
  
  // Extract location information
  const location = extractLocation(allContent);
  
  // Extract products and services
  const products = extractProducts(allContent);
  const services = extractServices(allContent, businessType);
  
  // Generate intelligent keywords based on actual content
  const keywords = generateIntelligentKeywords(allContent, businessType, industry, location, products, services);
  
  // Create business description
  const description = createBusinessDescription(businessType, industry, location, products, services);
  
  return {
    businessType,
    products,
    services,
    location,
    industry,
    keywords,
    description
  };
}

function detectBusinessType(content: string): string {
  const businessTypes = {
    'restaurant': [
      // Core restaurant terms
      'restaurant', 'dining', 'food', 'menu', 'chef', 'cuisine', 'eat', 'meal', 'kitchen', 'bistro', 'cafe', 'diner',
      // Food types and dining
      'lunch', 'dinner', 'breakfast', 'brunch', 'takeaway', 'takeout', 'delivery', 'catering', 'buffet',
      // Cuisine types
      'italian', 'chinese', 'mexican', 'indian', 'thai', 'japanese', 'french', 'american', 'fusion', 'ethnic',
      'nepalese', 'nepali', 'gurkha', 'himalayan', 'asian', 'curry', 'spice', 'spicy', 'traditional',
      // Restaurant operations
      'reservation', 'booking', 'order', 'serve', 'serving', 'taste', 'flavor', 'dish', 'recipe', 'cooking',
      'fresh', 'delicious', 'authentic', 'specialty', 'signature', 'appetizer', 'entree', 'dessert',
      // Restaurant atmosphere
      'atmosphere', 'ambiance', 'dining experience', 'table', 'bar', 'wine', 'beer', 'drinks', 'cocktail'
    ],
    'law firm': ['law', 'legal', 'attorney', 'lawyer', 'court', 'litigation', 'contract', 'legal advice', 'law office'],
    'medical practice': ['doctor', 'medical', 'health', 'clinic', 'hospital', 'patient', 'treatment', 'medicine', 'healthcare', 'physician'],
    'consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'solutions', 'expertise', 'professional services'],
    'real estate': ['real estate', 'property', 'home', 'house', 'realtor', 'listing', 'buy', 'sell', 'rent', 'mortgage'],
    'technology company': ['software', 'technology', 'tech', 'app', 'digital', 'development', 'programming', 'IT', 'system'],
    'retail': ['shop', 'store', 'retail', 'buy', 'purchase', 'product', 'sale', 'shopping', 'merchandise'],
    'service provider': ['service', 'provider', 'maintenance', 'repair', 'installation', 'professional', 'expert'],
    'agency': ['agency', 'marketing', 'advertising', 'creative', 'design', 'brand', 'campaign', 'media'],
    'education': ['school', 'education', 'learn', 'student', 'teach', 'course', 'training', 'academic', 'university', 'college'],
  };
  
  let maxScore = 0;
  let detectedType = 'business';
  const scoreBreakdown: {[key: string]: {score: number, matches: string[]}} = {};
  
  for (const [type, keywords] of Object.entries(businessTypes)) {
    const matchedKeywords: string[] = [];
    const score = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        matchedKeywords.push(`${keyword}(${matches.length})`);
      }
      return sum + (matches ? matches.length : 0);
    }, 0);
    
    scoreBreakdown[type] = { score, matches: matchedKeywords };
    
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }
  
  // Debug logging to understand classification
  console.log(`🧠 Business type analysis results:`);
  Object.entries(scoreBreakdown)
    .filter(([, data]) => data.score > 0)
    .sort(([,a], [,b]) => b.score - a.score)
    .forEach(([type, data]) => {
      console.log(`  ${type}: ${data.score} points - ${data.matches.slice(0, 5).join(', ')}${data.matches.length > 5 ? '...' : ''}`);
    });
  console.log(`🎯 Detected business type: ${detectedType} (${maxScore} points)`);
  
  return detectedType;
}

// Comprehensive Google SERP presence analysis
interface SERPPresence {
  organicResults: {
    position: number | null;
    url: string;
    title: string;
    snippet: string;
  }[];
  paidAds: {
    position: number;
    url: string;
    title: string;
    description: string;
  }[];
  imagesResults: {
    found: boolean;
    count: number;
    examples: string[];
  };
  mapsResults: {
    found: boolean;
    position: number | null;
    businessName: string;
    address: string;
    rating: number | null;
  };
  peopleAlsoAsk: {
    questions: string[];
    relatedToWebsite: boolean;
  };
  featuredSnippets: {
    found: boolean;
    type: string; // paragraph, list, table
    content: string;
  };
  knowledgePanel: {
    found: boolean;
    type: string; // business, person, place
    content: string;
  };
  newsResults: {
    found: boolean;
    articles: {
      title: string;
      source: string;
      date: string;
    }[];
  };
  videoResults: {
    found: boolean;
    videos: {
      title: string;
      platform: string;
      url: string;
    }[];
  };
}

async function analyzeSERPPresence(domain: string, businessIntel: BusinessIntelligence): Promise<{
  isDemoMode: boolean;
  serpPresence: SERPPresence;
  error?: string;
}> {
  const serperApiKey = process.env.SERPER_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;
  
  // If no API keys available, return intelligent demo data
  if (!serperApiKey && !serpApiKey) {
    console.log('⚠️  DEMO MODE: No SERP API keys for Google presence analysis');
    
    return {
      isDemoMode: true,
      serpPresence: {
        organicResults: [
          {
            position: 3,
            url: `https://${domain}`,
            title: `[REAL ANALYSIS] ${businessIntel.businessType} - ${businessIntel.location}`,
            snippet: `${businessIntel.description}. Configure SERP API keys to see actual Google rankings.`
          }
        ],
        paidAds: [],
        imagesResults: {
          found: true,
          count: 5,
          examples: [`[ANALYSIS] ${businessIntel.businessType} images would appear here`]
        },
        mapsResults: {
          found: businessIntel.businessType === 'restaurant' || businessIntel.businessType.includes('service'),
          position: 1,
          businessName: `${businessIntel.businessType} in ${businessIntel.location}`,
          address: businessIntel.location,
          rating: 4.2
        },
        peopleAlsoAsk: {
          questions: [
            `What services does ${businessIntel.businessType} offer?`,
            `Best ${businessIntel.businessType} in ${businessIntel.location}?`,
            `How to contact ${businessIntel.businessType}?`
          ],
          relatedToWebsite: true
        },
        featuredSnippets: {
          found: false,
          type: 'paragraph',
          content: ''
        },
        knowledgePanel: {
          found: false,
          type: 'business',
          content: ''
        },
        newsResults: {
          found: false,
          articles: []
        },
        videoResults: {
          found: false,
          videos: []
        }
      }
    };
  }

  try {
    console.log(`🔍 Starting comprehensive SERP presence analysis for ${domain}...`);
    
    // Generate search queries based on business intelligence
    const businessName = domain.split('.')[0].replace(/[-_]/g, ' ');
    const location = businessIntel.location.split(',')[0].trim();
    
    const searchQueries = [
      businessName, // Exact business name search
      `${businessName} ${location}`, // Business + location
      `${businessIntel.businessType} ${location}`, // Industry + location
      businessIntel.services[0] || businessName // Primary service
    ].filter(query => query && query.length > 3);

    console.log(`🎯 Analyzing SERP presence with queries: ${searchQueries.join(', ')}`);

    const serpPresence: SERPPresence = {
      organicResults: [],
      paidAds: [],
      imagesResults: { found: false, count: 0, examples: [] },
      mapsResults: { found: false, position: null, businessName: '', address: '', rating: null },
      peopleAlsoAsk: { questions: [], relatedToWebsite: false },
      featuredSnippets: { found: false, type: 'paragraph', content: '' },
      knowledgePanel: { found: false, type: 'business', content: '' },
      newsResults: { found: false, articles: [] },
      videoResults: { found: false, videos: [] }
    };

    let apiCallsMade = 0;
    
    // Primary search for business name and location
    const primaryQuery = searchQueries[0];
    
    if (serperApiKey) {
      console.log('📡 Using Serper API for SERP presence analysis...');
      
      try {
        const response = await fetchWithTimeout('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: primaryQuery,
            num: 20, // Get more results to find our domain
            gl: businessIntel.location.includes('Australia') ? 'au' : 'us',
            hl: 'en',
            // Request additional SERP features
            type: 'search' // This includes organic, ads, images, etc.
          })
        }, 10000);

        if (response.ok) {
          const data = await response.json();
          apiCallsMade++;
          console.log(`✅ SERP data retrieved for "${primaryQuery}"`);
          
          // Analyze organic results
          if (data.organic && Array.isArray(data.organic)) {
            data.organic.forEach((result: any, index: number) => {
              try {
                const url = new URL(result.link);
                if (url.hostname.includes(domain) || domain.includes(url.hostname.replace('www.', ''))) {
                  serpPresence.organicResults.push({
                    position: index + 1,
                    url: result.link,
                    title: result.title || '',
                    snippet: result.snippet || ''
                  });
                }
              } catch (error) {
                // Skip malformed URLs
              }
            });
          }
          
          // Analyze paid ads
          if (data.ads && Array.isArray(data.ads)) {
            data.ads.forEach((ad: any, index: number) => {
              try {
                const url = new URL(ad.link);
                if (url.hostname.includes(domain) || domain.includes(url.hostname.replace('www.', ''))) {
                  serpPresence.paidAds.push({
                    position: index + 1,
                    url: ad.link,
                    title: ad.title || '',
                    description: ad.description || ''
                  });
                }
              } catch (error) {
                // Skip malformed URLs
              }
            });
          }
          
          // Analyze local/maps results
          if (data.places && Array.isArray(data.places)) {
            data.places.forEach((place: any, index: number) => {
              if (place.title && place.title.toLowerCase().includes(businessName.toLowerCase())) {
                serpPresence.mapsResults = {
                  found: true,
                  position: index + 1,
                  businessName: place.title || '',
                  address: place.address || '',
                  rating: place.rating || null
                };
              }
            });
          }
          
          // Analyze People Also Ask
          if (data.peopleAlsoAsk && Array.isArray(data.peopleAlsoAsk)) {
            serpPresence.peopleAlsoAsk = {
              questions: data.peopleAlsoAsk.slice(0, 5).map((item: any) => item.question || ''),
              relatedToWebsite: data.peopleAlsoAsk.some((item: any) => 
                item.question && item.question.toLowerCase().includes(businessName.toLowerCase())
              )
            };
          }
          
          // Analyze featured snippets
          if (data.answerBox) {
            serpPresence.featuredSnippets = {
              found: true,
              type: data.answerBox.type || 'paragraph',
              content: data.answerBox.answer || data.answerBox.snippet || ''
            };
          }
          
          // Analyze knowledge panel
          if (data.knowledgeGraph) {
            serpPresence.knowledgePanel = {
              found: true,
              type: data.knowledgeGraph.type || 'business',
              content: data.knowledgeGraph.description || ''
            };
          }
          
          // Analyze news results
          if (data.news && Array.isArray(data.news)) {
            const relevantNews = data.news.filter((article: any) => 
              article.title && (
                article.title.toLowerCase().includes(businessName.toLowerCase()) ||
                article.title.toLowerCase().includes(businessIntel.businessType.toLowerCase())
              )
            );
            
            if (relevantNews.length > 0) {
              serpPresence.newsResults = {
                found: true,
                articles: relevantNews.slice(0, 3).map((article: any) => ({
                  title: article.title || '',
                  source: article.source || '',
                  date: article.date || ''
                }))
              };
            }
          }
          
          // Analyze video results
          if (data.videos && Array.isArray(data.videos)) {
            const relevantVideos = data.videos.filter((video: any) => 
              video.title && (
                video.title.toLowerCase().includes(businessName.toLowerCase()) ||
                video.title.toLowerCase().includes(businessIntel.businessType.toLowerCase())
              )
            );
            
            if (relevantVideos.length > 0) {
              serpPresence.videoResults = {
                found: true,
                videos: relevantVideos.slice(0, 3).map((video: any) => ({
                  title: video.title || '',
                  platform: video.platform || 'YouTube',
                  url: video.link || ''
                }))
              };
            }
          }
        }
      } catch (error) {
        console.error('❌ Serper API error for SERP presence:', error);
      }
    }
    
    // Analyze Google Images separately
    if (serperApiKey && apiCallsMade < 2) {
      try {
        const imageResponse = await fetchWithTimeout('https://google.serper.dev/images', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `${businessName} ${businessIntel.businessType}`,
            num: 10
          })
        }, 8000);
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          apiCallsMade++;
          
          if (imageData.images && Array.isArray(imageData.images)) {
            // Check if any images are from the target domain
            const domainImages = imageData.images.filter((img: any) => {
              try {
                const imgUrl = new URL(img.link || '');
                return imgUrl.hostname.includes(domain) || domain.includes(imgUrl.hostname.replace('www.', ''));
              } catch {
                return false;
              }
            });
            
            serpPresence.imagesResults = {
              found: domainImages.length > 0,
              count: domainImages.length,
              examples: domainImages.slice(0, 3).map((img: any) => img.title || 'Business image')
            };
            
            console.log(`🖼️ Found ${domainImages.length} images from domain in Google Images`);
          }
        }
      } catch (error) {
        console.error('❌ Images search error:', error);
      }
    }
    
    console.log(`📊 SERP presence analysis complete - ${apiCallsMade} API calls made`);
    console.log(`   Organic results: ${serpPresence.organicResults.length}`);
    console.log(`   Paid ads: ${serpPresence.paidAds.length}`);
    console.log(`   Maps presence: ${serpPresence.mapsResults.found ? 'Yes' : 'No'}`);
    console.log(`   Images: ${serpPresence.imagesResults.count} found`);
    console.log(`   People Also Ask: ${serpPresence.peopleAlsoAsk.questions.length} questions`);
    
    return {
      isDemoMode: false,
      serpPresence
    };
    
  } catch (error) {
    console.error('❌ SERP presence analysis failed:', error);
    return {
      isDemoMode: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      serpPresence: {
        organicResults: [],
        paidAds: [],
        imagesResults: { found: false, count: 0, examples: [] },
        mapsResults: { found: false, position: null, businessName: '', address: '', rating: null },
        peopleAlsoAsk: { questions: [], relatedToWebsite: false },
        featuredSnippets: { found: false, type: 'paragraph', content: '' },
        knowledgePanel: { found: false, type: 'business', content: '' },
        newsResults: { found: false, articles: [] },
        videoResults: { found: false, videos: [] }
      }
    };
  }
}

function detectIndustry(content: string, businessType: string): string {
  // Use business type as base, but look for more specific industry terms
  const industryMap: {[key: string]: string[]} = {
    'restaurant': ['italian', 'chinese', 'mexican', 'indian', 'fusion', 'seafood', 'steakhouse', 'fast food', 'fine dining'],
    'law firm': ['personal injury', 'corporate', 'family law', 'criminal defense', 'immigration', 'bankruptcy', 'real estate law'],
    'medical practice': ['cardiology', 'dermatology', 'pediatrics', 'dentistry', 'orthopedics', 'family medicine', 'psychology'],
    'consulting': ['management', 'IT', 'financial', 'marketing', 'strategy', 'business', 'operations'],
    'technology company': ['software development', 'web development', 'mobile apps', 'AI', 'cybersecurity', 'cloud computing'],
    'retail': ['fashion', 'electronics', 'automotive', 'home goods', 'sporting goods', 'jewelry', 'beauty'],
  };
  
  const specificTerms = industryMap[businessType] || [];
  
  for (const term of specificTerms) {
    if (content.includes(term)) {
      return term;
    }
  }
  
  return businessType;
}

function extractLocation(content: string): string {
  const lowerContent = content.toLowerCase();
  
  console.log('🔍 Starting location extraction from content preview:', content.substring(0, 200) + '...');
  
  // First priority: Look for specific Australian address patterns
  const streetPatterns = [
    // Pattern: "123 Ocean Street, Sunshine Coast" or "Ocean Street, Sunshine Coast"  
    /\b(?:\d+\s+)?([A-Za-z\s]+(?:street|st|road|rd|avenue|ave|drive|dr|way|lane|ln|court|ct|place|pl))\s*,\s*([A-Za-z\s]{2,25})(?:\s+(?:offering|provides?|delivers?|features?|specializes?|with|for|restaurant|cafe|business|shop|store)|\.|,|$)/gi,
    // Pattern: "123 Ocean Street Sunshine Coast" (without comma) - more precise matching
    /\b(?:\d+\s+)?([A-Za-z\s]+(?:street|st|road|rd|avenue|ave|drive|dr|way|lane|ln|court|ct|place|pl))\s+([A-Za-z\s]{2,20})(?:\s+(?:offering|provides?|delivers?|features?|specializes?|with|for|restaurant|cafe|business|shop|store)|\.|,|$)/gi
  ];
  
  for (const pattern of streetPatterns) {
    pattern.lastIndex = 0; // Reset regex state
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const street = match[1]?.trim();
      const suburb = match[2]?.trim();
      
      if (street && suburb && suburb.length > 2 && suburb.length < 30) {
        // Clean up common trailing words that aren't part of location
        const cleanSuburb = suburb.replace(/\s+(restaurant|cafe|business|shop|store|office|building|delivers?|offers?|provides?|features?).*$/i, '');
        if (cleanSuburb.length > 2) {
          const location = `${street}, ${cleanSuburb}`;
          console.log(`✅ Found street address: ${location}`);
          return location;
        }
      }
    }
  }
  
  // Second priority: Look for location indicators with proper capture groups
  const locationIndicators = [
    // Pattern: "located in Sunshine Coast" or "based in Sydney, NSW" - more precise
    /\b(?:located in|based in|situated in|address.*?:)\s*([A-Za-z\s,]{2,30}?)(?:\s+(?:offering|provides?|delivers?|features?|specializes?|with|for|restaurant|cafe|business|shop|store|office|building)|\.|,|$)/gi,
    // Pattern: "visit us at Sunshine Coast" 
    /(?:visit us (?:at|in)|find us (?:at|in))\s*([A-Za-z\s,]{2,30}?)(?:\s+(?:offering|provides?|delivers?|features?|specializes?|with|for|restaurant|cafe|business|shop|store|office|building)|\.|,|$)/gi,
    // Pattern: Direct state/territory patterns like "Brisbane, QLD" 
    /\b([A-Za-z\s]+),\s+(qld|nsw|vic|sa|wa|nt|tas|act|queensland|new south wales|victoria|south australia|western australia|northern territory|tasmania|australian capital territory)\b/gi
  ];
  
  for (const pattern of locationIndicators) {
    pattern.lastIndex = 0; // Reset regex state
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let location = match[1]?.trim();
      
      if (location && location.length > 2) {
        // Clean up the location by removing common business descriptors
        location = location.replace(/\s+(restaurant|cafe|business|shop|store|office|building|delivers?|offers?|provides?|features?|specializes?).*$/i, '');
        location = location.replace(/^(the|our|a)\s+/i, ''); // Remove leading articles
        
        if (location.length > 2 && location.length < 50) {
          // Add state if we found one in match[2]
          if (match[2]) {
            const state = match[2].toUpperCase();
            const stateAbbrev = state.length > 3 ? 
              ({'queensland': 'QLD', 'new south wales': 'NSW', 'victoria': 'VIC', 'south australia': 'SA', 'western australia': 'WA', 'northern territory': 'NT', 'tasmania': 'TAS', 'australian capital territory': 'ACT'}[state.toLowerCase()] || state) 
              : state;
            location = `${location}, ${stateAbbrev}`;
          }
          
          console.log(`✅ Found location indicator: ${location}`);
          return location;
        }
      }
    }
  }
  
  // Third priority: Look for well-known Australian regions (exact matches)
  const australianRegions = [
    'sunshine coast', 'gold coast', 'central coast', 'northern rivers', 'hunter valley',
    'blue mountains', 'snowy mountains', 'grampians', 'flinders ranges', 'barossa valley'
  ];
  
  for (const region of australianRegions) {
    const regionPattern = new RegExp(`\\b${region}\\b`, 'i');
    if (regionPattern.test(content)) {
      const formattedRegion = region.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      console.log(`✅ Found Australian region: ${formattedRegion}`);
      return formattedRegion;
    }
  }
  
  // Fourth priority: Australian cities and towns
  const australianLocations = [
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra', 'darwin', 'hobart', 
    'cairns', 'townsville', 'geelong', 'ballarat', 'bendigo', 'launceston', 'mackay', 
    'rockhampton', 'toowoomba', 'newcastle', 'wollongong', 'logan', 'parramatta'
  ];
  
  for (const location of australianLocations) {
    if (lowerContent.includes(location)) {
      const formatted = location.charAt(0).toUpperCase() + location.slice(1);
      console.log(`✅ Found Australian city: ${formatted}`);
      return formatted;
    }
  }
  
  // Fifth priority: Common international cities (fallback)
  const internationalCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'London', 'Paris', 'Tokyo', 
    'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Vienna', 'Zurich', 'Vancouver', 
    'Toronto', 'Montreal', 'Dublin', 'Edinburgh', 'Auckland', 'Wellington'
  ];
  
  for (const city of internationalCities) {
    if (lowerContent.includes(city.toLowerCase())) {
      console.log(`✅ Found international city: ${city}`);
      return city;
    }
  }
  
  console.log('❌ No location found, returning default');
  return 'Location not specified';
}

function extractProducts(content: string): string[] {
  const contentLower = content.toLowerCase();
  const products: string[] = [];
  
  // Enhanced food and menu item extraction for restaurants
  const foodItems = [
    // Nepalese/Tibetan foods (commonly served at fusion restaurants)
    'momo', 'momos', 'dumpling', 'dumplings', 'thukpa', 'chowmein', 'chow mein', 'dal bhat', 'dal', 'bhat',
    'curry', 'naan', 'roti', 'samosa', 'samosas', 'chili chicken', 'butter chicken', 'tandoori', 'biryani',
    'fried rice', 'spring rolls', 'spring roll', 'sekuwa', 'choila', 'chatamari', 'yomari', 'sel roti',
    // Common Asian fusion items
    'pad thai', 'tom yum', 'pho', 'ramen', 'sushi', 'tempura', 'teriyaki', 'satay', 'laksa', 'dim sum',
    // Common restaurant items
    'pizza', 'burger', 'sandwich', 'pasta', 'salad', 'soup', 'appetizer', 'entree', 'dessert', 'starter',
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'vegetarian', 'vegan', 'steak', 'wings',
    'coffee', 'tea', 'juice', 'smoothie', 'beer', 'wine', 'cocktail', 'drinks', 'mocktail', 'lassi',
    // General products
    'product', 'item', 'goods', 'merchandise', 'solution', 'offering', 'package',
    'software', 'app', 'tool', 'platform', 'system', 'device', 'equipment'
  ];
  
  // Look for menu items and food products with higher priority for food terms
  for (const item of foodItems) {
    const regex = new RegExp(`\\b${item}s?\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      products.push(item);
    }
  }
  
  // Enhanced patterns for product extraction with focus on food/menu items
  const productPatterns = [
    // Restaurant/food specific patterns
    /(?:menu|dishes?|meals?|food|cuisine|specialties|favorites)\s+(?:includes?|features?|offers?|has|:)\s*([^.!?]*)/gi,
    /(?:we\s+serve|serving|specializing\s+in|famous\s+for|known\s+for)\s+([^.!?]*)/gi,
    /(?:try\s+our|taste\s+our|enjoy\s+our|order\s+our|fresh|authentic|delicious|homemade)\s+([a-zA-Z\s]{3,30})/gi,
    /(?:signature|popular|best|special)\s+([a-zA-Z\s]{3,30})(?:\s+(?:dish|meal|item|plate))?/gi,
    // General product patterns
    /(?:products?|offerings?|solutions?|services?|items?)\s+(?:include|are|:)\s*([^.!?]*)/gi,
    /(?:we|our\s+(?:company|restaurant|kitchen))\s+(?:offer|provide|sell|make|create|specialize)\s+([^.!?]*)/gi
  ];
  
  for (const pattern of productPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/^[^a-zA-Z]+/, '').trim();
        const items = cleanMatch.split(/,|and|\&|\/|\||\+/).map(item => 
          item.trim().replace(/[^a-zA-Z\s]/g, '').trim()
        ).filter(item => item.length > 2 && item.length < 40 && !['our', 'the', 'we', 'you', 'and', 'or'].includes(item.toLowerCase()));
        products.push(...items);
      });
    }
  }
  
  // Look for specific menu sections and food categories
  const menuCategories = [
    'appetizer', 'appetizers', 'starter', 'starters', 'main', 'mains', 'entree', 'entrees', 
    'dessert', 'desserts', 'drink', 'drinks', 'beverage', 'beverages', 'special', 'specials',
    'combo', 'combos', 'platter', 'platters', 'bowl', 'bowls', 'wrap', 'wraps', 'roll', 'rolls'
  ];
  
  for (const category of menuCategories) {
    if (contentLower.includes(category)) {
      products.push(category);
    }
  }
  
  // Filter and clean results
  const cleanProducts = Array.from(new Set(products))
    .filter(p => p && p.trim().length > 1 && p.trim().length < 50)
    .map(p => p.trim())
    .slice(0, 20); // Increased limit for better product detection
  
  return cleanProducts;
}

function extractServices(content: string, businessType: string): string[] {
  const serviceKeywords = [
    'service', 'consulting', 'support', 'maintenance', 'repair', 'installation',
    'training', 'advice', 'assistance', 'help', 'guidance', 'expertise'
  ];
  
  const services: string[] = [];
  
  // Business-specific service patterns
  const serviceMap: {[key: string]: string[]} = {
    'law firm': ['legal consultation', 'representation', 'contract review', 'litigation support'],
    'medical practice': ['consultation', 'treatment', 'diagnosis', 'preventive care'],
    'restaurant': ['catering', 'delivery', 'private dining', 'takeout'],
    'real estate': ['buying assistance', 'selling support', 'market analysis', 'property management'],
    'consulting': ['strategy consulting', 'business advice', 'process improvement', 'training'],
    'technology company': ['software development', 'system integration', 'technical support', 'maintenance'],
  };
  
  // Add business-specific services
  if (serviceMap[businessType]) {
    services.push(...serviceMap[businessType]);
  }
  
  // Extract services from content
  const servicePatterns = [
    /(?:services?|support)\s+(?:include|are|:)\s*([^.!?]*)/gi,
    /(?:we|our team)\s+(?:provide|offer|deliver|specialize in)\s+([^.!?]*)/gi
  ];
  
  for (const pattern of servicePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const items = match.split(/,|and|\&/).map(item => item.trim()).filter(item => item.length > 3 && item.length < 50);
        services.push(...items);
      });
    }
  }
  
  return Array.from(new Set(services)).slice(0, 5); // Remove duplicates, limit to 5
}

function generateIntelligentKeywords(content: string, businessType: string, industry: string, location: string, products: string[], services: string[]): string[] {
  const keywords: string[] = [];
  
  // Core business keywords
  keywords.push(businessType);
  if (industry !== businessType) {
    keywords.push(industry);
  }
  
  // Location-based keywords
  const locationBase = location.split(',')[0].trim();
  keywords.push(`${businessType} ${locationBase}`);
  keywords.push(`${industry} ${locationBase}`);
  keywords.push(`best ${businessType} ${locationBase}`);
  
  // Product/service-based keywords
  services.forEach(service => {
    if (service && service.length < 30) {
      keywords.push(service);
      keywords.push(`${service} ${locationBase}`);
    }
  });
  
  products.forEach(product => {
    if (product && product.length < 30) {
      keywords.push(product);
      keywords.push(`${product} ${locationBase}`);
    }
  });
  
  // Intent-based keywords
  keywords.push(`${businessType} near me`);
  keywords.push(`${businessType} services`);
  keywords.push(`professional ${businessType}`);
  keywords.push(`${businessType} company`);
  
  // Filter and clean keywords
  return Array.from(new Set(keywords))
    .filter(keyword => keyword && keyword.length > 2 && keyword.length < 60)
    .slice(0, 15); // Limit to 15 most relevant keywords
}

function createBusinessDescription(businessType: string, industry: string, location: string, products: string[], services: string[]): string {
  const productText = products.length > 0 ? ` offering ${products.slice(0, 3).join(', ')}` : '';
  const serviceText = services.length > 0 ? ` providing ${services.slice(0, 3).join(', ')}` : '';
  const locationText = location !== 'United States' ? ` based in ${location}` : '';
  
  return `${businessType.charAt(0).toUpperCase() + businessType.slice(1)}${locationText}${productText}${serviceText}`;
}

// Helper function to analyze page speed using Google PageSpeed Insights API
async function analyzePageSpeed(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    // Return demo data if no API key is provided
    return {
      mobile: 70, // Demo value
      desktop: 85, // Demo value
      firstContentfulPaint: 1.8, // Demo value
      largestContentfulPaint: 2.4, // Demo value
      cumulativeLayoutShift: 0.05, // Demo value
    };
  }

  try {
    const [mobileResponse, desktopResponse] = await Promise.all([
      fetchWithTimeout(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`, {}, 15000),
      fetchWithTimeout(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`, {}, 15000)
    ]);

    const [mobileData, desktopData] = await Promise.all([
      mobileResponse.json(),
      desktopResponse.json()
    ]);

    return {
      mobile: Math.round((mobileData.lighthouseResult?.categories?.performance?.score || 0.7) * 100),
      desktop: Math.round((desktopData.lighthouseResult?.categories?.performance?.score || 0.8) * 100),
      firstContentfulPaint: mobileData.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue / 1000 || 2.1,
      largestContentfulPaint: mobileData.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue / 1000 || 3.2,
      cumulativeLayoutShift: mobileData.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue || 0.05,
    };
  } catch (error) {
    console.error('PageSpeed API error:', error);
    // Return fallback demo data on API error
    return {
      mobile: 75, // Demo fallback value
      desktop: 82, // Demo fallback value
      firstContentfulPaint: 1.9, // Demo fallback value
      largestContentfulPaint: 2.6, // Demo fallback value
      cumulativeLayoutShift: 0.08, // Demo fallback value
    };
  }
}

// Helper function to analyze technical SEO
async function analyzeTechnicalSEO(url: string, pageSpeedData: any) {
  const issues = [];
  let score = 85;

  // Analyze page speed issues
  if (pageSpeedData.mobile < 70) {
    issues.push({
      title: "Poor Mobile Performance",
      impact: "high" as const,
      description: `Mobile PageSpeed score is ${pageSpeedData.mobile}/100. Optimize images and reduce JavaScript execution time.`
    });
    score -= 15;
  }

  if (pageSpeedData.largestContentfulPaint > 2.5) {
    issues.push({
      title: "Slow Largest Contentful Paint",
      impact: "high" as const,
      description: `LCP is ${pageSpeedData.largestContentfulPaint.toFixed(1)}s. Optimize server response times and remove render-blocking resources.`
    });
    score -= 10;
  }

  if (pageSpeedData.cumulativeLayoutShift > 0.1) {
    issues.push({
      title: "Layout Shift Issues",
      impact: "medium" as const,
      description: `CLS score is ${pageSpeedData.cumulativeLayoutShift.toFixed(3)}. Add size attributes to images and videos.`
    });
    score -= 8;
  }

  // Add common SEO issues
  const commonIssues = [
    {
      title: "Missing Meta Descriptions",
      impact: "medium" as const,
      description: "Some pages lack meta descriptions. Add unique, compelling descriptions to improve click-through rates."
    },
    {
      title: "Optimize Image Alt Tags",
      impact: "low" as const,
      description: "Improve accessibility and SEO by adding descriptive alt tags to all images."
    }
  ];

  // Add issues based on performance thresholds (remove random behavior)
  if (pageSpeedData.mobile < 80) issues.push(commonIssues[0]);
  if (pageSpeedData.desktop < 85) issues.push(commonIssues[1]);

  return {
    score: Math.max(score, 45),
    issues
  };
}

// AI-powered competitor analysis using OpenAI
async function getAICompetitors(businessIntel: BusinessIntelligence) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log(`🧠 Analyzing competitors for ${businessIntel.businessType} in ${businessIntel.location}...`);
  
  // Validate location data quality
  if (businessIntel.location.length < 4 || businessIntel.location.includes('flavors from around')) {
    console.log('⚠️  Location data seems incomplete, using domain analysis for location hints...');
  }
  
  // Extract more specific location information for better targeting
  let specificLocation = businessIntel.location;
  const domain = businessIntel.description; // This might contain domain info
  
  // If location seems problematic, try to extract better location info
  if (!specificLocation || specificLocation.length < 4 || specificLocation.includes('flavors from')) {
    // Try to extract location from domain or use contextual clues
    if (domain && domain.includes('.au')) {
      specificLocation = 'Australia';
    }
    // Add more specific checks for common location patterns
    if (domain && domain.toLowerCase().includes('sunshine')) {
      specificLocation = 'Sunshine Coast, QLD, Australia';
    }
  }
  
  // Create intelligent prompt based on business intelligence
  const prompt = `You are a local business intelligence expert specializing in competitive analysis. Find real, existing competitors for this business:

BUSINESS PROFILE:
- Type: ${businessIntel.businessType}
- Industry: ${businessIntel.industry} 
- Location: ${specificLocation}
- Products: ${businessIntel.products.join(', ') || 'Not specified'}
- Services: ${businessIntel.services.join(', ') || 'Not specified'}
- Description: ${businessIntel.description}

COMPETITOR REQUIREMENTS:
Find 4 real businesses that directly compete for the same customers. Prioritize:

1. LOCATION-SPECIFIC: If location mentions Sunshine Coast, Ocean Street, QLD, or Australia - find actual businesses in that area
2. CUISINE-SPECIFIC: If it's Nepali/Himalayan/Asian fusion - find restaurants with similar cuisine
3. PRODUCT-SPECIFIC: If they sell momos, dumplings, curry - find places known for those items  
4. SERVICE-SPECIFIC: If they offer catering, delivery - find competitors offering similar services

EXAMPLES for context:
- Nepali restaurant in Sunshine Coast → "Everest Kitchen Maroochydore", "Himalayan Cuisine Caloundra"
- Momo specialist → "Momo Station", "Dumpling House", "Little Tibet Kitchen"
- Fusion restaurant → "Spice Garden", "East Meets West Bistro", "Fusion Table"

CRITICAL: Return ONLY valid JSON with NO additional text, markdown, or explanations:

[
  {"name": "Real Business Name", "score": 88, "ranking": 1},
  {"name": "Second Real Business", "score": 83, "ranking": 2},
  {"name": "Third Real Business", "score": 78, "ranking": 3},
  {"name": "Fourth Real Business", "score": 74, "ranking": 4}
]

Scores must be 70-90. Names should sound like real businesses, not generic descriptions.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a local business intelligence expert. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse AI response as JSON with robust error handling
    let cleanResponse = aiResponse.trim();
    
    // Remove any markdown code fences if present
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing non-JSON text
    const jsonStart = cleanResponse.indexOf('[');
    const jsonEnd = cleanResponse.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON array found in AI response');
    }
    
    cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
    
    let competitors;
    try {
      competitors = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw AI response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate structure
    if (!Array.isArray(competitors)) {
      throw new Error('AI response is not an array');
    }
    
    if (competitors.length !== 4) {
      throw new Error(`Expected 4 competitors, got ${competitors.length}`);
    }
    
    // Validate each competitor object
    for (let i = 0; i < competitors.length; i++) {
      const comp = competitors[i];
      if (!comp.name || typeof comp.name !== 'string' || comp.name.length < 3) {
        throw new Error(`Invalid competitor name at index ${i}`);
      }
      if (!comp.score || typeof comp.score !== 'number' || comp.score < 70 || comp.score > 90) {
        throw new Error(`Invalid competitor score at index ${i}: ${comp.score}`);
      }
      if (!comp.ranking || typeof comp.ranking !== 'number' || comp.ranking < 1 || comp.ranking > 4) {
        throw new Error(`Invalid competitor ranking at index ${i}: ${comp.ranking}`);
      }
    }

    console.log(`✅ AI found ${competitors.length} relevant competitors: ${competitors.map(c => c.name).join(', ')}`);
    return competitors;

  } catch (error) {
    console.error('❌ OpenAI competitor analysis error:', error);
    throw error;
  }
}

// Real competitor analysis using multiple SERP APIs
async function analyzeCompetitors(domain: string, businessIntel?: BusinessIntelligence) {
  const serperApiKey = process.env.SERPER_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  // If we have OpenAI, use AI-powered competitor intelligence as primary method
  if (openaiApiKey && businessIntel) {
    console.log('🤖 Using AI-powered competitor analysis with OpenAI...');
    try {
      const aiCompetitors = await getAICompetitors(businessIntel);
      return {
        isDemoMode: false, // This is real AI analysis
        competitors: [
          { name: domain, score: 75, ranking: aiCompetitors.findIndex(c => c.name === domain) + 1 || 3 },
          ...aiCompetitors
        ]
      };
    } catch (error) {
      console.error('❌ OpenAI competitor analysis failed:', error);
      // Fall back to enhanced demo data
    }
  }
  
  // If no API keys available, use intelligent demo data based on business analysis
  if (!serperApiKey && !serpApiKey) {
    console.log('⚠️  Website analysis complete, but no SERP API keys for real competitor search');
    
    if (businessIntel) {
      return {
        isDemoMode: true,
        competitors: [
          { name: domain, score: 75, ranking: 3 },
          { name: `[REAL ANALYSIS] ${businessIntel.businessType} competitor in ${businessIntel.location}`, score: 85, ranking: 1 },
          { name: `[REAL ANALYSIS] ${businessIntel.industry} provider`, score: 80, ranking: 2 },
          { name: `[REAL ANALYSIS] Similar ${businessIntel.businessType} business`, score: 70, ranking: 4 },
          { name: `[REAL ANALYSIS] Configure SERP API for actual competitor domains`, score: 65, ranking: 5 },
        ]
      };
    }
    
    return {
      isDemoMode: true,
      competitors: [
        { name: domain, score: 75, ranking: 3 },
        { name: "[DEMO] competitor-example1.com", score: 85, ranking: 1 },
        { name: "[DEMO] competitor-example2.com", score: 80, ranking: 2 },
        { name: "[DEMO] competitor-example3.com", score: 70, ranking: 4 },
        { name: "[DEMO] competitor-example4.com", score: 65, ranking: 5 },
      ]
    };
  }

  try {
    console.log(`🔍 Starting intelligent competitor analysis for ${domain}...`);
    
    // Generate intelligent search terms based on business analysis
    let searchQueries: string[] = [];
    let baseTerm: string;
    
    if (businessIntel) {
      baseTerm = businessIntel.businessType;
      console.log(`🧠 Using business intelligence: ${businessIntel.businessType} in ${businessIntel.industry} located in ${businessIntel.location}`);
      
      // Build search queries based on actual business intelligence
      const location = businessIntel.location.split(',')[0].trim(); // Use first part of location
      
      searchQueries = [
        `${businessIntel.businessType} ${location}`,
        `best ${businessIntel.industry} ${location}`,
        `${businessIntel.businessType} near me`,
        ...businessIntel.services.slice(0, 2).map(service => `${service} ${location}`),
        `top ${businessIntel.businessType} companies`,
        `${businessIntel.industry} reviews ${location}`
      ].filter(query => query.length > 10); // Filter out short queries
      
      console.log(`🎯 Generated ${searchQueries.length} intelligent search queries based on website content`);
    } else {
      // Fallback to domain-based analysis  
      baseTerm = domain.split('.')[0].replace(/[-_]/g, ' ');
      searchQueries = [
        `${baseTerm} services`,
        `best ${baseTerm} company`,
        `top ${baseTerm} providers`,
        `${baseTerm} solutions`,
        `${baseTerm} reviews`
      ];
      console.log('⚠️  Using fallback domain-based search queries (website analysis failed)');
    }

    const competitorMap = new Map<string, { score: number, appearances: number, titles: string[] }>();
    let apiCallsMade = 0;
    
    // Try Serper API first (fastest and most generous free tier)
    if (serperApiKey) {
      console.log('📡 Using Serper API for competitor analysis...');
      
      for (const query of searchQueries.slice(0, 3)) { // Limit queries to preserve quota
        try {
          const startTime = Date.now();
          const response = await fetchWithTimeout('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: query,
              num: 10,
              gl: 'us',
              hl: 'en'
            })
          }, 8000);

          const responseTime = Date.now() - startTime;
          apiCallsMade++;
          
          if (!response.ok) {
            console.error(`Serper API error for "${query}": ${response.status}`);
            continue;
          }

          const data = await response.json();
          console.log(`✅ Serper API call completed in ${responseTime}ms for "${query}"`);
          
          if (data.organic && Array.isArray(data.organic)) {
            data.organic.forEach((result: any, index: number) => {
              try {
                const url = new URL(result.link);
                const competitorDomain = url.hostname.replace(/^www\./, '');
                
                // Skip the analyzed domain
                if (competitorDomain === domain || competitorDomain.includes(domain.split('.')[0])) {
                  return;
                }
                
                // Calculate score based on position and result quality
                const positionScore = Math.max(100 - (index * 8), 20);
                const titleRelevance = result.title?.toLowerCase().includes(baseTerm.toLowerCase()) ? 10 : 0;
                const score = positionScore + titleRelevance;
                
                const existing = competitorMap.get(competitorDomain);
                if (existing) {
                  competitorMap.set(competitorDomain, {
                    score: Math.max(existing.score, score),
                    appearances: existing.appearances + 1,
                    titles: [...existing.titles, result.title || ''].slice(0, 3)
                  });
                } else {
                  competitorMap.set(competitorDomain, {
                    score,
                    appearances: 1,
                    titles: [result.title || '']
                  });
                }
              } catch (error) {
                // Skip malformed URLs
              }
            });
          }
        } catch (error) {
          console.error(`Failed Serper search for "${query}":`, error);
        }
      }
    }
    
    // Fallback to SerpAPI if needed and available
    if (competitorMap.size < 3 && serpApiKey) {
      console.log('📡 Using SerpAPI as fallback for competitor analysis...');
      
      for (const query of searchQueries.slice(0, 2)) {
        try {
          const startTime = Date.now();
          const response = await fetchWithTimeout(`https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=google&num=10&gl=us&hl=en`, {}, 10000);
          
          const responseTime = Date.now() - startTime;
          apiCallsMade++;
          
          if (!response.ok) {
            console.error(`SerpAPI error for "${query}": ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`✅ SerpAPI call completed in ${responseTime}ms for "${query}"`);
          
          if (data.organic_results && Array.isArray(data.organic_results)) {
            data.organic_results.forEach((result: any, index: number) => {
              try {
                const url = new URL(result.link);
                const competitorDomain = url.hostname.replace(/^www\./, '');
                
                if (competitorDomain === domain || competitorDomain.includes(domain.split('.')[0])) {
                  return;
                }
                
                const positionScore = Math.max(100 - (index * 8), 20);
                const titleRelevance = result.title?.toLowerCase().includes(baseTerm.toLowerCase()) ? 10 : 0;
                const score = positionScore + titleRelevance;
                
                const existing = competitorMap.get(competitorDomain);
                if (existing) {
                  competitorMap.set(competitorDomain, {
                    score: Math.max(existing.score, score),
                    appearances: existing.appearances + 1,
                    titles: [...existing.titles, result.title || ''].slice(0, 3)
                  });
                } else {
                  competitorMap.set(competitorDomain, {
                    score,
                    appearances: 1,
                    titles: [result.title || '']
                  });
                }
              } catch (error) {
                // Skip malformed URLs
              }
            });
          }
        } catch (error) {
          console.error(`Failed SerpAPI search for "${query}":`, error);
        }
      }
    }

    console.log(`📊 Completed ${apiCallsMade} API calls, found ${competitorMap.size} potential competitors`);
    
    if (competitorMap.size === 0) {
      throw new Error('No competitors found from API calls');
    }

    // Sort competitors by relevance (appearances × score)
    const sortedCompetitors = Array.from(competitorMap.entries())
      .map(([name, data]) => ({
        name,
        score: data.score,
        appearances: data.appearances,
        relevanceScore: data.appearances * data.score
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 4);

    // Create final competitor ranking with user domain
    const competitors = [
      ...sortedCompetitors.map((comp, index) => ({
        name: comp.name,
        score: Math.round(comp.score),
        ranking: index + 1
      })),
      {
        name: domain,
        score: Math.round(Math.max(85 - (sortedCompetitors.length * 8), 45)),
        ranking: sortedCompetitors.length + 1
      }
    ].sort((a, b) => a.ranking - b.ranking);

    console.log(`✅ Real competitor analysis complete: ${competitors.map(c => `${c.ranking}. ${c.name} (${c.score})`).join(', ')}`);
    
    return {
      isDemoMode: false,
      competitors
    };

  } catch (error) {
    console.error('❌ Competitor analysis failed:', error);
    return {
      isDemoMode: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      competitors: [
        { name: domain, score: 75, ranking: 3 },
        { name: "[API ERROR] Unable to fetch real competitors", score: 85, ranking: 1 },
        { name: "[API ERROR] Check API keys and quotas", score: 80, ranking: 2 },
        { name: "[API ERROR] Using fallback demo data", score: 70, ranking: 4 },
        { name: "[API ERROR] See console for details", score: 65, ranking: 5 },
      ]
    };
  }
}

// Real keyword analysis using multiple APIs for authentic data
async function analyzeKeywords(domain: string, url: string, businessIntel?: BusinessIntelligence) {
  const serperApiKey = process.env.SERPER_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;
  const dataForSeoLogin = process.env.DATAFORSEO_LOGIN;
  const dataForSeoPassword = process.env.DATAFORSEO_PASSWORD;
  
  // If no API keys available, use intelligent demo data based on business analysis
  if (!serperApiKey && !serpApiKey && !dataForSeoLogin) {
    console.log('⚠️  Website analysis complete, but no keyword research API keys configured');
    
    if (businessIntel) {
      // Use the intelligent keywords generated from website content
      return {
        isDemoMode: true,
        keywords: businessIntel.keywords.slice(0, 5).map((keyword, index) => ({
          keyword: `[REAL ANALYSIS] ${keyword}`,
          position: undefined,
          difficulty: index < 2 ? "high" : index < 4 ? "medium" : "low",
          volume: Math.max(8000 - index * 1500, 1000) // Decreasing volume estimate
        }))
      };
    }
    
    // Fallback to basic demo data
    const industry = domain.split('.')[0].replace(/[-_]/g, ' ');
    return {
      isDemoMode: true,
      keywords: [
        {
          keyword: `[DEMO] ${industry} services`,
          position: undefined,
          difficulty: "medium",
          volume: 5000
        },
        {
          keyword: `[DEMO] best ${industry}`,
          position: undefined,
          difficulty: "high", 
          volume: 3000
        },
        {
          keyword: `[DEMO] ${industry} solutions`,
          position: undefined,
          difficulty: "low",
          volume: 1500
        }
      ]
    };
  }

  try {
    console.log(`🔍 Starting intelligent keyword analysis for ${domain}...`);
    
    // Use intelligent keywords from business analysis or fallback to domain-based
    let targetKeywords: string[] = [];
    
    if (businessIntel) {
      console.log(`🧠 Using ${businessIntel.keywords.length} keywords from business intelligence analysis`);
      targetKeywords = businessIntel.keywords.slice(0, 8); // Use up to 8 intelligent keywords
    } else {
      console.log('⚠️  Using fallback domain-based keywords (website analysis failed)');
      const industry = domain.split('.')[0].replace(/[-_]/g, ' ');
      targetKeywords = [
        `${industry} services`,
        `best ${industry}`,
        `${industry} solutions`,
        `${industry} company`,
        `top ${industry}`,
        `${industry} reviews`
      ];
    }

    const keywordResults = [];
    let apiCallsMade = 0;

    // Method 1: DataForSEO for accurate search volumes and difficulty
    if (dataForSeoLogin && dataForSeoPassword) {
      console.log('📡 Using DataForSEO API for keyword volumes and difficulty...');
      
      try {
        const auth = Buffer.from(`${dataForSeoLogin}:${dataForSeoPassword}`).toString('base64');
        
        for (const keyword of targetKeywords.slice(0, 3)) { // Limit to preserve quota
          try {
            const startTime = Date.now();
            
            // Get search volume and competition data
            const volumeResponse = await fetchWithTimeout('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify([{
                keywords: [keyword],
                location_code: 2840, // United States
                language_code: "en"
              }])
            }, 12000);
            
            const responseTime = Date.now() - startTime;
            apiCallsMade++;
            
            if (volumeResponse.ok) {
              const volumeData = await volumeResponse.json();
              console.log(`✅ DataForSEO keyword call completed in ${responseTime}ms for "${keyword}"`);
              
              const result = volumeData?.tasks?.[0]?.result?.[0];
              if (result) {
                // Get current ranking position using SERP API
                let position = undefined;
                
                if (serperApiKey || serpApiKey) {
                  position = await getRealKeywordPosition(keyword, domain, serperApiKey, serpApiKey);
                }
                
                keywordResults.push({
                  keyword,
                  position,
                  difficulty: mapCompetitionToDifficulty(result.competition_level),
                  volume: result.search_volume || 0
                });
              }
            }
          } catch (error) {
            console.error(`DataForSEO error for "${keyword}":`, error);
          }
        }
      } catch (error) {
        console.error('DataForSEO authentication or request error:', error);
      }
    }

    // Method 2: SERP-only analysis for remaining keywords
    const remainingKeywords = targetKeywords.slice(keywordResults.length, 5);
    
    if ((serperApiKey || serpApiKey) && remainingKeywords.length > 0) {
      console.log(`📡 Using SERP APIs for remaining ${remainingKeywords.length} keywords...`);
      
      for (const keyword of remainingKeywords) {
        try {
          const keywordData = await analyzeSerpKeyword(keyword, domain, serperApiKey, serpApiKey);
          if (keywordData) {
            keywordResults.push(keywordData);
            apiCallsMade++;
          }
        } catch (error) {
          console.error(`SERP analysis error for "${keyword}":`, error);
        }
      }
    }

    console.log(`📊 Completed ${apiCallsMade} keyword API calls, analyzed ${keywordResults.length} keywords`);
    
    if (keywordResults.length === 0) {
      throw new Error('No keyword data retrieved from APIs');
    }

    // Sort keywords by volume and add position insights
    const sortedKeywords = keywordResults
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 5);

    console.log(`✅ Real keyword analysis complete: ${sortedKeywords.map(k => `"${k.keyword}" (${k.volume} vol, ${k.difficulty} diff, pos: ${k.position || 'N/A'})`).join(', ')}`);
    
    return {
      isDemoMode: false,
      keywords: sortedKeywords
    };

  } catch (error) {
    console.error('❌ Keyword analysis failed:', error);
    const industry = domain.split('.')[0].replace(/[-_]/g, ' ');
    return {
      isDemoMode: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      keywords: [
        {
          keyword: `[API ERROR] ${industry} services`,
          position: undefined,
          difficulty: "medium",
          volume: 0
        },
        {
          keyword: `[API ERROR] Unable to fetch real keyword data`,
          position: undefined,
          difficulty: "unknown",
          volume: 0
        },
        {
          keyword: `[API ERROR] Check API keys and quotas`,
          position: undefined,
          difficulty: "unknown",
          volume: 0
        }
      ]
    };
  }
}

// Helper function to get real keyword position from SERP APIs
async function getRealKeywordPosition(keyword: string, domain: string, serperApiKey?: string, serpApiKey?: string): Promise<number | undefined> {
  try {
    let searchData = null;
    
    // Try Serper first
    if (serperApiKey) {
      const response = await fetchWithTimeout('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: keyword, num: 100 })
      }, 8000);
      
      if (response.ok) {
        searchData = await response.json();
      }
    }
    
    // Fallback to SerpAPI
    if (!searchData && serpApiKey) {
      const response = await fetchWithTimeout(`https://serpapi.com/search?q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}&engine=google&num=100`, {}, 8000);
      
      if (response.ok) {
        const data = await response.json();
        searchData = { organic: data.organic_results };
      }
    }
    
    if (searchData?.organic) {
      const position = searchData.organic.findIndex((result: any) => {
        try {
          const resultDomain = new URL(result.link).hostname.replace(/^www\./, '');
          return resultDomain === domain || resultDomain.includes(domain.split('.')[0]);
        } catch {
          return false;
        }
      });
      
      return position !== -1 ? position + 1 : undefined;
    }
  } catch (error) {
    console.warn(`Failed to get position for "${keyword}":`, error);
  }
  
  return undefined;
}

// Helper function to analyze keyword using SERP data only
async function analyzeSerpKeyword(keyword: string, domain: string, serperApiKey?: string, serpApiKey?: string) {
  try {
    let searchData = null;
    let startTime = Date.now();
    
    // Try Serper first
    if (serperApiKey) {
      const response = await fetchWithTimeout('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: keyword, num: 10 })
      }, 6000);
      
      if (response.ok) {
        searchData = await response.json();
        console.log(`✅ Serper SERP analysis completed in ${Date.now() - startTime}ms for "${keyword}"`);
      }
    }
    
    // Fallback to SerpAPI
    if (!searchData && serpApiKey) {
      startTime = Date.now();
      const response = await fetchWithTimeout(`https://serpapi.com/search?q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}&engine=google&num=10`, {}, 8000);
      
      if (response.ok) {
        const data = await response.json();
        searchData = {
          organic: data.organic_results,
          relatedSearches: data.related_searches,
          searchInformation: data.search_information
        };
        console.log(`✅ SerpAPI SERP analysis completed in ${Date.now() - startTime}ms for "${keyword}"`);
      }
    }
    
    if (searchData?.organic) {
      // Find position
      const position = searchData.organic.findIndex((result: any) => {
        try {
          const resultDomain = new URL(result.link).hostname.replace(/^www\./, '');
          return resultDomain === domain || resultDomain.includes(domain.split('.')[0]);
        } catch {
          return false;
        }
      });
      
      // Estimate difficulty based on SERP competition
      const domainCount = new Set(searchData.organic.map((r: any) => {
        try {
          return new URL(r.link).hostname;
        } catch {
          return null;
        }
      }).filter(Boolean)).size;
      
      const difficulty: 'high' | 'medium' | 'low' = domainCount >= 8 ? 'high' : domainCount >= 5 ? 'medium' : 'low';
      
      // Estimate volume based on search features
      const hasAds = searchData.ads?.length > 0;
      const hasNews = searchData.topStories?.length > 0;
      const relatedCount = searchData.relatedSearches?.length || 0;
      
      let volumeEstimate = 1000; // Base estimate
      if (hasAds) volumeEstimate += 2000;
      if (hasNews) volumeEstimate += 1500;
      volumeEstimate += relatedCount * 300;
      
      return {
        keyword,
        position: position !== -1 ? position + 1 : undefined,
        difficulty,
        volume: Math.round(volumeEstimate)
      };
    }
  } catch (error) {
    console.error(`SERP keyword analysis error for "${keyword}":`, error);
  }
  
  return null;
}

// Helper function to map DataForSEO competition levels to difficulty
function mapCompetitionToDifficulty(competitionLevel?: string): 'high' | 'medium' | 'low' {
  switch (competitionLevel?.toLowerCase()) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'medium';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 🔐 Register secure authentication routes (login, register, API keys)
  registerAuthRoutes(app);

  // SEO Analysis endpoint
  app.post('/api/analyze-seo', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`;
      }

      try {
        new URL(validUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const domain = extractDomain(validUrl);

      // Check cache first
      const cachedResult = analysisCache.get(domain);
      if (cachedResult) {
        return res.json(cachedResult);
      }

      console.log(`🔍 Starting fresh analysis for domain: ${domain}`);

      // STEP 1: Analyze website content to understand the business
      console.log('🕷️ Step 1: Intelligent website content analysis...');
      const businessIntel = await analyzeWebsiteContent(validUrl);
      console.log(`✅ Business analysis complete: ${businessIntel.businessType} (${businessIntel.industry}) in ${businessIntel.location}`);

      // STEP 2: Analyze page speed (this is the main real API integration)
      console.log('⚡ Step 2: Page speed analysis...');
      const pageSpeedData = await analyzePageSpeed(validUrl);
      
      // STEP 3: Analyze technical SEO based on page speed and other factors
      console.log('🔧 Step 3: Technical SEO analysis...');
      const technicalSeo = await analyzeTechnicalSEO(validUrl, pageSpeedData);
      
      // STEP 4: Generate intelligent competitor analysis using business data
      console.log('🏆 Step 4: Intelligent competitor analysis...');
      const competitorAnalysis = await analyzeCompetitors(domain, businessIntel);
      
      // STEP 5: Generate intelligent keyword analysis using business data
      console.log('🎯 Step 5: Intelligent keyword analysis...');
      const keywordAnalysis = await analyzeKeywords(domain, validUrl, businessIntel);
      
      // STEP 6: Analyze Google SERP presence across all features
      console.log('🔍 Step 6: Comprehensive SERP presence analysis...');
      const serpAnalysis = await analyzeSERPPresence(domain, businessIntel);
      
      // Extract data and check for demo mode
      const competitors = competitorAnalysis.competitors;
      const keywords = keywordAnalysis.keywords;
      const isDemoMode = competitorAnalysis.isDemoMode || keywordAnalysis.isDemoMode || serpAnalysis.isDemoMode;
      
      // Enhanced demo mode messaging
      let demoMessage = undefined;
      if (isDemoMode) {
        const missingServices = [];
        if (competitorAnalysis.isDemoMode) missingServices.push('competitor analysis');
        if (keywordAnalysis.isDemoMode) missingServices.push('keyword research');
        if (serpAnalysis.isDemoMode) missingServices.push('SERP presence analysis');
        
        demoMessage = `Demo mode active for ${missingServices.join(', ')}. Configure API keys for real data: ` +
                     `SERPER_API_KEY or SERPAPI_KEY for SERP data, DATAFORSEO_LOGIN/PASSWORD for keyword volumes.`;
      }
      
      // Calculate overall SEO score
      const seoScore = Math.round((
        pageSpeedData.mobile * 0.3 +
        pageSpeedData.desktop * 0.2 +
        technicalSeo.score * 0.3 +
        (competitors.find(c => c.name === domain)?.score || 70) * 0.2
      ));

      // Generate improvements based on analysis
      const improvements = [
        ...technicalSeo.issues,
        {
          title: "Improve Content Quality",
          impact: "medium" as const,
          description: "Enhance content depth and add more relevant keywords to improve search rankings."
        },
        {
          title: "Build Quality Backlinks",
          impact: "high" as const,
          description: "Focus on earning high-quality backlinks from authoritative websites in your industry."
        }
      ];

      const result: SEOAnalysisResult = {
        seoScore,
        domain,
        pageSpeed: pageSpeedData,
        technicalSeo,
        competitors,
        keywords: keywords.map((k: any) => ({
          ...k,
          difficulty: k.difficulty as 'high' | 'medium' | 'low'
        })),
        improvements: improvements.slice(0, 4), // Limit to 4 improvements
        marketPosition: {
          rank: competitors.find(c => c.name === domain)?.ranking || 3,
          totalCompetitors: competitors.length + 12, // Conservative estimate of market size
          marketShare: Math.round(Math.max(100 / ((competitors.find(c => c.name === domain)?.ranking || 3) * 2.5), 1)) // Realistic market share calculation
        },
        // Google SERP Presence Analysis
        serpPresence: serpAnalysis.serpPresence,
        // Business Intelligence from website analysis
        businessIntelligence: {
          businessType: businessIntel.businessType,
          industry: businessIntel.industry,
          location: businessIntel.location,
          products: businessIntel.products,
          services: businessIntel.services,
          description: businessIntel.description,
        },
        isDemoMode, // Include demo mode flag in response  
        demoMessage
      };

      // Validate the result matches our schema
      const validatedResult = seoAnalysisSchema.parse(result);
      
      // Cache the validated result for future requests
      analysisCache.set(domain, validatedResult);
      
      res.json(validatedResult);
    } catch (error) {
      console.error('SEO analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze SEO. Please try again.' });
    }
  });

  // In-memory storage for comprehensive analysis sessions
  const comprehensiveAnalysisCache = new Map<string, ComprehensiveAnalysis>();

  // Comprehensive Analysis & Action Plan endpoint
  app.post('/api/analyze-comprehensive', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = `https://${url}`;
      }

      try {
        new URL(validUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      const domain = extractDomain(validUrl);
      const analysisId = `comprehensive_${domain}_${Date.now()}`;

      console.log(`🚀 Starting comprehensive analysis for: ${domain}`);

      // Initialize comprehensive analysis object
      const comprehensiveAnalysis: ComprehensiveAnalysis = {
        id: analysisId,
        domain,
        status: 'running',
        progress: 0,
        createdAt: new Date().toISOString(),
        agentResults: [],
        actionPlan: {
          summary: '',
          overallScore: 0,
          potentialImprovement: 0,
          timeline: '',
          items: [],
          quickWins: [],
          longTermGoals: [],
        },
        competitiveIntelligence: {
          marketPosition: '',
          competitiveAdvantages: [],
          competitiveGaps: [],
          opportunityAreas: [],
          benchmarkScores: {
            content: 0,
            technical: 0,
            authority: 0,
            userExperience: 0,
          },
        },
        contentStrategy: {
          contentGaps: [],
          topicClusters: [],
          contentCalendar: [],
        },
        progressTracking: {
          milestones: [],
          kpis: [],
        },
      };

      // Store initial analysis state
      comprehensiveAnalysisCache.set(analysisId, comprehensiveAnalysis);

      // Send immediate response with analysis ID for progress tracking
      res.json({
        analysisId,
        status: 'started',
        message: 'Comprehensive analysis started. Use the analysis ID to track progress.',
      });

      // Run comprehensive analysis asynchronously
      runComprehensiveAnalysisAsync(analysisId, validUrl, domain);

    } catch (error) {
      console.error('Comprehensive analysis initialization error:', error);
      res.status(500).json({ error: 'Failed to start comprehensive analysis. Please try again.' });
    }
  });

  // Get comprehensive analysis progress/results
  app.get('/api/analyze-comprehensive/:analysisId', async (req, res) => {
    try {
      const { analysisId } = req.params;
      const analysis = comprehensiveAnalysisCache.get(analysisId);

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or expired' });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get comprehensive analysis error:', error);
      res.status(500).json({ error: 'Failed to get analysis results' });
    }
  });

  // Async function to run comprehensive analysis
  async function runComprehensiveAnalysisAsync(analysisId: string, url: string, domain: string) {
    try {
      const analysis = comprehensiveAnalysisCache.get(analysisId);
      if (!analysis) return;

      console.log(`🔍 Step 1: Basic SEO Analysis for ${domain}...`);
      
      // Step 1: Run basic SEO analysis (reuse existing logic)
      analysis.progress = 10;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      // Check cache first for basic analysis
      let basicAnalysis = analysisCache.get(domain);
      
      if (!basicAnalysis) {
        // Run fresh basic analysis
        console.log('🕷️ Website content analysis...');
        const businessIntel = await analyzeWebsiteContent(url);
        
        console.log('⚡ Page speed analysis...');
        const pageSpeedData = await analyzePageSpeed(url);
        
        console.log('🔧 Technical SEO analysis...');
        const technicalSeo = await analyzeTechnicalSEO(url, pageSpeedData);
        
        console.log('🏆 Competitor analysis...');
        const competitorAnalysis = await analyzeCompetitors(domain, businessIntel);
        
        console.log('🎯 Keyword analysis...');
        const keywordAnalysis = await analyzeKeywords(domain, url, businessIntel);
        
        console.log('🔍 SERP presence analysis...');
        const serpAnalysis = await analyzeSERPPresence(domain, businessIntel);

        // Build basic analysis result
        const competitors = competitorAnalysis.competitors;
        const keywords = keywordAnalysis.keywords;
        const isDemoMode = competitorAnalysis.isDemoMode || keywordAnalysis.isDemoMode || serpAnalysis.isDemoMode;

        // Calculate overall SEO score
        const seoScore = Math.round(
          (pageSpeedData.mobile * 0.3) +
          (technicalSeo.score * 0.25) +
          (Math.min(keywords.length * 5, 25) * 0.2) +
          (Math.min(competitors.length * 6, 20) * 0.25)
        );

        // Generate improvements
        const improvements = [
          ...technicalSeo.issues,
          {
            title: "Improve Keyword Strategy",
            impact: "high" as const,
            description: "Expand keyword targeting and optimize content for better search visibility."
          },
          {
            title: "Enhance Competitor Analysis",
            impact: "medium" as const,
            description: "Regularly monitor competitor strategies and identify new opportunities."
          }
        ];

        basicAnalysis = {
          seoScore,
          domain,
          pageSpeed: pageSpeedData,
          technicalSeo,
          competitors,
          keywords: keywords.map((k: any) => ({
            ...k,
            difficulty: k.difficulty as 'high' | 'medium' | 'low'
          })),
          improvements,
          marketPosition: {
            rank: competitors.find(c => c.name === domain)?.ranking || 3,
            totalCompetitors: competitors.length + 12,
            marketShare: Math.round(Math.max(100 / ((competitors.find(c => c.name === domain)?.ranking || 3) * 2.5), 1))
          },
          serpPresence: serpAnalysis.serpPresence,
          businessIntelligence: {
            businessType: businessIntel.businessType,
            industry: businessIntel.industry,
            location: businessIntel.location,
            products: businessIntel.products,
            services: businessIntel.services,
            description: businessIntel.description,
          },
          isDemoMode
        };

        // Cache the basic analysis
        if (basicAnalysis) {
          analysisCache.set(domain, basicAnalysis);
        }
      }

      if (basicAnalysis) {
        analysis.basicAnalysis = basicAnalysis;
      }
      analysis.progress = 25;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`🤖 Step 2: Multi-Agent Analysis for ${domain}...`);
      
      // Step 2: Run multi-agent analysis
      const businessIntelWithKeywords = {
        businessType: basicAnalysis?.businessIntelligence?.businessType || 'business',
        industry: basicAnalysis?.businessIntelligence?.industry || 'general',
        location: basicAnalysis?.businessIntelligence?.location || 'United States',
        products: basicAnalysis?.businessIntelligence?.products || [],
        services: basicAnalysis?.businessIntelligence?.services || [],
        description: basicAnalysis?.businessIntelligence?.description || 'Business website',
        keywords: basicAnalysis?.keywords.map(k => k.keyword) || []
      };
      const coordinator = new MultiAgentCoordinator(
        domain, 
        businessIntelWithKeywords, 
        basicAnalysis!
      );
      
      const agentResults = await coordinator.runComprehensiveAnalysis();
      analysis.agentResults = agentResults;
      analysis.progress = 50;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`🎯 Step 3: Action Plan Generation for ${domain}...`);
      
      // Step 3: Generate comprehensive action plan
      const actionPlanGenerator = new ActionPlanGenerator(
        domain,
        agentResults,
        businessIntelWithKeywords,
        basicAnalysis!
      );

      const actionPlan = await actionPlanGenerator.generateComprehensiveActionPlan();
      analysis.actionPlan = actionPlan;
      analysis.progress = 70;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`🧠 Step 4: Competitive Intelligence for ${domain}...`);
      
      // Step 4: Generate competitive intelligence
      const competitiveIntelligence = await actionPlanGenerator.generateCompetitiveIntelligence();
      analysis.competitiveIntelligence = competitiveIntelligence;
      analysis.progress = 85;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`📝 Step 5: Content Strategy for ${domain}...`);
      
      // Step 5: Generate content strategy
      const contentStrategy = await actionPlanGenerator.generateContentStrategy();
      analysis.contentStrategy = contentStrategy;
      analysis.progress = 95;
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`📊 Step 6: Progress Tracking Setup for ${domain}...`);
      
      // Step 6: Generate progress tracking
      const progressTracking = actionPlanGenerator.generateProgressTracking(actionPlan.items);
      analysis.progressTracking = progressTracking;

      // Mark as completed
      analysis.status = 'completed';
      analysis.progress = 100;
      analysis.completedAt = new Date().toISOString();
      comprehensiveAnalysisCache.set(analysisId, analysis);

      console.log(`🎉 Comprehensive analysis completed for ${domain}!`);

    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      const analysis = comprehensiveAnalysisCache.get(analysisId);
      if (analysis) {
        analysis.status = 'failed';
        analysis.progress = 0;
        comprehensiveAnalysisCache.set(analysisId, analysis);
      }
    }
  }

  // Initialize Stripe (from Stripe blueprint)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not found. Stripe functionality will be limited to demo mode.');
  }

  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
    : null;

  // Stripe Subscription Management Routes
  
  // Get subscription plans
  app.get('/api/subscription-plans', async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      console.error('Get subscription plans error:', error);
      res.status(500).json({ error: 'Failed to get subscription plans' });
    }
  });

  // Create payment intent for one-time payments
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe not configured',
          demoMode: true,
          message: 'Configure STRIPE_SECRET_KEY to enable payments'
        });
      }

      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          integration_check: 'accept_a_payment'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ 
        error: 'Error creating payment intent: ' + error.message 
      });
    }
  });

  // Create or get subscription (main subscription endpoint)
  app.post('/api/get-or-create-subscription', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe not configured',
          demoMode: true,
          message: 'Configure STRIPE_SECRET_KEY to enable subscriptions'
        });
      }

      // For now, we'll work without authentication, but this would normally require auth
      const { planName, userEmail, userName } = req.body;

      if (!planName || !userEmail) {
        return res.status(400).json({ 
          error: 'Plan name and user email are required' 
        });
      }

      // Get subscription plan
      const plan = await storage.getSubscriptionPlanByName(planName);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }

      // Find or create user by email
      let user = await storage.getUserByEmail(userEmail);
      if (!user) {
        // Create temporary user for demo purposes
        user = await storage.createUser({
          username: userName || userEmail.split('@')[0],
          email: userEmail,
          password: 'temp_password' // This would be handled differently in production
        });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            message: 'User already has an active subscription'
          });
        }
      }

      // Create Stripe customer if needed
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.username,
          metadata: {
            userId: user.id
          }
        });
        
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: plan.stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeSubscriptionId(user.id, subscription.id);
      await storage.updateUserSubscriptionStatus(user.id, subscription.status);
      await storage.updateUserSubscriptionPlan(user.id, planName.toLowerCase());

      // Create subscription history entry
      await storage.createSubscriptionHistoryEntry({
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        planId: plan.id,
        status: subscription.status,
        startDate: new Date()
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = ((latestInvoice as any)?.payment_intent as any) as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status
      });

    } catch (error: any) {
      console.error('Create subscription error:', error);
      res.status(500).json({ 
        error: 'Error creating subscription: ' + error.message 
      });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          error: 'Stripe not configured',
          demoMode: true 
        });
      }

      const { subscriptionId, reason } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' });
      }

      const subscription = await stripe.subscriptions.cancel(subscriptionId);

      // Update user subscription status
      const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
      if (user) {
        await storage.updateUserSubscriptionStatus(user.id, 'canceled');
        
        // Create history entry
        await storage.createSubscriptionHistoryEntry({
          userId: user.id,
          stripeSubscriptionId: subscriptionId,
          planId: null,
          status: 'canceled',
          canceledAt: new Date(),
          cancelReason: reason || 'User requested cancellation'
        });
      }

      res.json({ 
        subscriptionId: subscription.id, 
        status: subscription.status 
      });

    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ 
        error: 'Error canceling subscription: ' + error.message 
      });
    }
  });

  // Get user subscription status
  app.get('/api/subscription-status/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const user = await storage.getUserByEmail(userEmail);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let subscriptionStatus = null;
      if (user.stripeSubscriptionId && stripe) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          subscriptionStatus = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: (subscription as any).current_period_end,
            plan: user.subscriptionPlan
          };
        } catch (error) {
          console.error('Error fetching subscription from Stripe:', error);
        }
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus
        },
        subscription: subscriptionStatus
      });

    } catch (error: any) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ 
        error: 'Error getting subscription status: ' + error.message 
      });
    }
  });

  // Stripe webhook endpoint for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured');
        return res.status(400).json({ error: 'Webhook secret not configured' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          
          // Find user by customer ID
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          if (user) {
            await storage.updateUserSubscriptionStatus(user.id, subscription.status);
            
            // Create history entry
            await storage.createSubscriptionHistoryEntry({
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              planId: null,
              status: subscription.status,
              endDate: subscription.status === 'canceled' ? new Date() : null
            });
          }
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          
          if (invoice.customer && (invoice as any).subscription) {
            const user = await storage.getUserByStripeCustomerId(invoice.customer as string);
            if (user) {
              // Record successful payment
              await storage.createPaymentHistoryEntry({
                userId: user.id,
                stripePaymentIntentId: typeof (invoice as any).payment_intent === 'string' ? (invoice as any).payment_intent : ((invoice as any).payment_intent as any)?.id || '',
                stripeInvoiceId: invoice.id,
                amount: (invoice.amount_paid / 100).toString(),
                currency: invoice.currency,
                status: 'succeeded',
                description: 'Subscription payment'
              });
            }
          }
          break;

        case 'invoice.payment_failed':
          // Handle failed payment
          const failedInvoice = event.data.object as Stripe.Invoice;
          
          if (failedInvoice.customer) {
            const user = await storage.getUserByStripeCustomerId(failedInvoice.customer as string);
            if (user) {
              await storage.createPaymentHistoryEntry({
                userId: user.id,
                stripePaymentIntentId: typeof (failedInvoice as any).payment_intent === 'string' ? (failedInvoice as any).payment_intent : ((failedInvoice as any).payment_intent as any)?.id || '',
                stripeInvoiceId: failedInvoice.id,
                amount: (failedInvoice.amount_due / 100).toString(),
                currency: failedInvoice.currency,
                status: 'failed',
                description: 'Subscription payment failed'
              });
            }
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get user usage stats
  app.get('/api/usage-stats/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const user = await storage.getUserByEmail(userEmail);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const usage = await storage.getUserUsage(user.id, currentMonth, currentYear);
      const plan = await storage.getSubscriptionPlanByName(user.subscriptionPlan || 'free');

      res.json({
        currentUsage: usage || {
          analysesUsed: 0,
          keywordsTracked: 0,
          competitorsAnalyzed: 0
        },
        limits: plan ? {
          maxAnalyses: plan.maxAnalyses,
          maxKeywords: plan.maxKeywords,
          maxCompetitors: plan.maxCompetitors
        } : null,
        plan: user.subscriptionPlan
      });

    } catch (error: any) {
      console.error('Get usage stats error:', error);
      res.status(500).json({ 
        error: 'Error getting usage stats: ' + error.message 
      });
    }
  });

  // =============================================================================
  // CAMPAIGN MANAGEMENT API ROUTES
  // =============================================================================

  // Rate limiting for external platform API calls
  const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_MINUTE = 60;

  /**
   * Rate limiting middleware for external platform calls
   */
  function rateLimitMiddleware(identifier: string): boolean {
    const now = Date.now();
    const key = identifier;
    const current = rateLimitCache.get(key);

    if (!current || now > current.resetTime) {
      rateLimitCache.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (current.count >= MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Helper function to check user subscription tier and limits
   */
  async function checkSubscriptionLimits(userEmail: string, action: string): Promise<{ allowed: boolean; plan: string; message?: string }> {
    try {
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return { allowed: false, plan: 'none', message: 'User not found' };
      }

      const plan = await storage.getSubscriptionPlanByName(user.subscriptionPlan || 'free');
      if (!plan) {
        return { allowed: false, plan: user.subscriptionPlan || 'free', message: 'Subscription plan not found' };
      }

      // Check specific limits based on action
      if (action === 'create_campaign') {
        // For now, allow campaigns based on subscription
        const allowedPlans = ['basic', 'pro', 'enterprise'];
        if (!allowedPlans.includes(user.subscriptionPlan || 'free')) {
          return { allowed: false, plan: user.subscriptionPlan || 'free', message: 'Campaign creation requires paid subscription' };
        }
      }

      return { allowed: true, plan: user.subscriptionPlan || 'free' };
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      return { allowed: false, plan: 'error', message: 'Error checking subscription' };
    }
  }

  // =============================================================================
  // PLATFORM CONNECTION MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Get all available advertising platforms
   * GET /api/campaigns/platforms
   */
  app.get('/api/campaigns/platforms', async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      
      res.json({
        success: true,
        data: platforms.map(platform => ({
          id: platform.id,
          name: platform.name,
          displayName: platform.displayName,
          isActive: platform.isActive,
          supportsOAuth: platform.supportsOAuth,
          iconUrl: platform.iconUrl,
          documentationUrl: platform.documentationUrl
        }))
      });
    } catch (error: any) {
      console.error('Get platforms error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch platforms: ' + error.message 
      });
    }
  });

  /**
   * Get authenticated user's connected platforms
   * GET /api/campaigns/me/platforms
   */
  app.get('/api/campaigns/me/platforms', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const credentials = await storage.getPlatformCredentials(user.id);
      const platforms = await storage.getPlatforms();

      const connectedPlatforms = credentials.map(cred => {
        const platform = platforms.find(p => p.id === cred.platformId);
        return {
          id: cred.id,
          platformId: cred.platformId,
          platformName: platform?.name || 'Unknown',
          platformDisplayName: platform?.displayName || 'Unknown',
          accountId: cred.accountId,
          accountName: cred.accountName,
          isActive: cred.isActive,
          lastSyncAt: cred.lastSyncAt,
          permissions: cred.permissions,
          createdAt: cred.createdAt
        };
      });

      res.json({
        success: true,
        data: connectedPlatforms
      });
    } catch (error: any) {
      console.error('Get connected platforms error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch connected platforms: ' + error.message 
      });
    }
  });

  /**
   * Disconnect a platform
   * DELETE /api/campaigns/me/platforms/:credentialId
   */
  app.delete('/api/campaigns/me/platforms/:credentialId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { credentialId } = req.params;
      const user = req.user;

      // Verify credential exists and belongs to authenticated user
      const credential = await storage.getPlatformCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ 
          success: false,
          error: 'Platform connection not found' 
        });
      }

      if (credential.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this platform connection');
      }

      const success = await storage.deletePlatformCredential(credentialId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Platform disconnected successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Platform connection not found'
        });
      }
    } catch (error: any) {
      console.error('Disconnect platform error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to disconnect platform: ' + error.message 
      });
    }
  });

  /**
   * Check platform connection status
   * GET /api/campaigns/me/platforms/:credentialId/status
   */
  app.get('/api/campaigns/me/platforms/:credentialId/status', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { credentialId } = req.params;
      const user = req.user;

      const credential = await storage.getPlatformCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ 
          success: false,
          error: 'Platform connection not found' 
        });
      }

      if (credential.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this platform connection');
      }

      // Check token expiry
      const isExpired = credential.tokenExpiresAt && new Date() > credential.tokenExpiresAt;
      const needsRefresh = isExpired || (credential.tokenExpiresAt && (credential.tokenExpiresAt.getTime() - Date.now()) < (24 * 60 * 60 * 1000)); // Expires within 24 hours

      res.json({
        success: true,
        data: {
          isActive: credential.isActive,
          isExpired,
          needsRefresh,
          lastSyncAt: credential.lastSyncAt,
          tokenExpiresAt: credential.tokenExpiresAt,
          permissions: credential.permissions
        }
      });
    } catch (error: any) {
      console.error('Check platform status error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to check platform status: ' + error.message 
      });
    }
  });

  // =============================================================================
  // OAUTH FLOW ROUTES
  // =============================================================================

  /**
   * Initiate OAuth flow for a platform
   * POST /api/campaigns/me/platforms/connect
   */
  app.post('/api/campaigns/me/platforms/connect', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const { platformName, redirectUri } = req.body;

      if (!platformName) {
        return res.status(400).json({ 
          success: false,
          error: 'Platform name is required' 
        });
      }

      const platform = await storage.getPlatformByName(platformName);
      if (!platform || !platform.isActive) {
        return res.status(404).json({ 
          success: false,
          error: 'Platform not found or inactive' 
        });
      }

      if (!platform.supportsOAuth) {
        return res.status(400).json({ 
          success: false,
          error: 'Platform does not support OAuth' 
        });
      }

      // Check subscription limits using authenticated user
      const subscriptionCheck = await checkSubscriptionLimits(user.email!, 'connect_platform');
      if (!subscriptionCheck.allowed) {
        return sendAuthError(res, 'subscription', subscriptionCheck.message || 'Subscription limit reached');
      }

      // Generate OAuth URL based on platform
      let authUrl = '';
      const state = `${user.id}:${platform.id}:${Date.now()}`;

      switch (platform.name) {
        case 'google_ads':
          authUrl = `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/auth/callback')}&scope=https://www.googleapis.com/auth/adwords&response_type=code&state=${state}`;
          break;
        case 'meta_ads':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/auth/callback')}&scope=ads_management,ads_read&response_type=code&state=${state}`;
          break;
        case 'tiktok_ads':
          authUrl = `https://ads.tiktok.com/marketing_api/auth?app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/auth/callback')}&scope=adgroup_management,campaign_management&response_type=code&state=${state}`;
          break;
        default:
          return res.status(400).json({ 
            success: false,
            error: 'OAuth not implemented for this platform' 
          });
      }

      res.json({
        success: true,
        data: {
          authUrl,
          state,
          platformName: platform.name,
          platformDisplayName: platform.displayName
        }
      });
    } catch (error: any) {
      console.error('Initiate OAuth error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to initiate OAuth: ' + error.message 
      });
    }
  });

  /**
   * Complete OAuth flow and store credentials
   * POST /api/campaigns/auth/callback
   */
  app.post('/api/campaigns/auth/callback', async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.body;

      if (oauthError) {
        return res.status(400).json({ 
          success: false,
          error: 'OAuth authorization failed: ' + oauthError 
        });
      }

      if (!code || !state) {
        return res.status(400).json({ 
          success: false,
          error: 'Authorization code and state are required' 
        });
      }

      // Parse state to get user and platform info
      const [userId, platformId, timestamp] = state.split(':');
      
      if (!userId || !platformId) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid state parameter' 
        });
      }

      const user = await storage.getUser(userId);
      const platform = await storage.getPlatform(platformId);

      if (!user || !platform) {
        return res.status(404).json({ 
          success: false,
          error: 'User or platform not found' 
        });
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`oauth_${user.id}_${platform.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      // Exchange code for access token (demo implementation)
      // In production, this would make actual API calls to the platform
      const mockTokenResponse = {
        access_token: `demo_access_token_${platform.name}_${Date.now()}`,
        refresh_token: `demo_refresh_token_${platform.name}_${Date.now()}`,
        expires_in: 3600,
        account_id: `demo_account_${Math.random().toString(36).substr(2, 9)}`,
        account_name: `Demo ${platform.displayName} Account`
      };

      // Store credentials (in demo mode, we store demo tokens)
      const credential = await storage.createPlatformCredential({
        userId: user.id,
        platformId: platform.id,
        accountId: mockTokenResponse.account_id,
        accountName: mockTokenResponse.account_name,
        accessTokenEncrypted: mockTokenResponse.access_token, // In production, encrypt this
        refreshTokenEncrypted: mockTokenResponse.refresh_token, // In production, encrypt this
        encryptionKeyId: 'demo_key_id',
        tokenExpiresAt: new Date(Date.now() + mockTokenResponse.expires_in * 1000),
        permissions: ['campaign_management', 'read_insights'],
        metadata: { 
          demo_mode: true,
          connected_at: new Date().toISOString(),
          platform_version: platform.apiVersion 
        }
      });

      res.json({
        success: true,
        data: {
          credentialId: credential.id,
          accountId: credential.accountId,
          accountName: credential.accountName,
          platformName: platform.name,
          platformDisplayName: platform.displayName,
          permissions: credential.permissions,
          demo_mode: true
        }
      });
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to complete OAuth: ' + error.message 
      });
    }
  });

  // =============================================================================
  // CAMPAIGN GROUP ROUTES
  // =============================================================================

  /**
   * Get all campaign groups for the authenticated user
   * GET /api/campaigns/me/groups
   */
  app.get('/api/campaigns/me/groups', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const groups = await storage.getCampaignGroups(user.id);

      res.json({
        success: true,
        data: groups
      });
    } catch (error: any) {
      console.error('Get campaign groups error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch campaign groups: ' + error.message 
      });
    }
  });

  /**
   * Create a new campaign group
   * POST /api/campaigns/me/groups
   */
  app.post('/api/campaigns/me/groups', secureAuthenticateAPI, requireSubscription('free'), async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const { name, description, budget, tags } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false,
          error: 'Group name is required' 
        });
      }

      // Subscription check is handled by requireSubscription('free') middleware

      const group = await storage.createCampaignGroup({
        userId: user.id,
        name,
        description,
        budget,
        tags: tags || [],
        metadata: { 
          created_via: 'api',
          demo_mode: true 
        }
      });

      res.status(201).json({
        success: true,
        data: group
      });
    } catch (error: any) {
      console.error('Create campaign group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create campaign group: ' + error.message 
      });
    }
  });

  /**
   * Update a campaign group
   * PUT /api/campaigns/me/groups/:groupId
   */
  app.put('/api/campaigns/me/groups/:groupId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const user = req.user;
      const { name, description, budget, tags, status } = req.body;

      // Verify group belongs to authenticated user
      const existingGroup = await storage.getCampaignGroup(groupId);
      if (!existingGroup) {
        return res.status(404).json({ 
          success: false,
          error: 'Campaign group not found' 
        });
      }

      if (existingGroup.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this campaign group');
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (budget !== undefined) updates.budget = budget;
      if (tags !== undefined) updates.tags = tags;
      if (status !== undefined) updates.status = status;
      updates.updatedAt = new Date();

      const updatedGroup = await storage.updateCampaignGroup(groupId, updates);

      if (updatedGroup) {
        res.json({
          success: true,
          data: updatedGroup
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Campaign group not found'
        });
      }
    } catch (error: any) {
      console.error('Update campaign group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update campaign group: ' + error.message 
      });
    }
  });

  /**
   * Delete a campaign group
   * DELETE /api/campaigns/me/groups/:groupId
   */
  app.delete('/api/campaigns/me/groups/:groupId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const user = req.user;

      // Verify group exists and belongs to authenticated user
      const group = await storage.getCampaignGroup(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false,
          error: 'Campaign group not found' 
        });
      }

      if (group.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this campaign group');
      }

      const success = await storage.deleteCampaignGroup(groupId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Campaign group deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Campaign group not found'
        });
      }
    } catch (error: any) {
      console.error('Delete campaign group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete campaign group: ' + error.message 
      });
    }
  });

  // =============================================================================
  // CAMPAIGN CRUD ROUTES
  // =============================================================================

  /**
   * Get all campaigns for a user
   * GET /api/campaigns/:userEmail
   */
  app.get('/api/campaigns/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { groupId, status, platformCredentialId } = req.query;

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      let campaigns;
      if (groupId) {
        campaigns = await storage.getCampaignsByGroup(groupId as string);
      } else if (platformCredentialId) {
        campaigns = await storage.getCampaignsByPlatform(platformCredentialId as string);
      } else {
        campaigns = await storage.getCampaigns(user.id);
      }

      // Filter by status if provided
      if (status) {
        campaigns = campaigns.filter(campaign => campaign.status === status);
      }

      // Filter to ensure user owns all campaigns
      campaigns = campaigns.filter(campaign => campaign.userId === user.id);

      res.json({
        success: true,
        data: campaigns
      });
    } catch (error: any) {
      console.error('Get campaigns error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch campaigns: ' + error.message 
      });
    }
  });

  /**
   * Get a specific campaign
   * GET /api/campaigns/details/:campaignId
   */
  app.get('/api/campaigns/details/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      res.json({
        success: true,
        data: campaign
      });
    } catch (error: any) {
      console.error('Get campaign details error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch campaign details: ' + error.message 
      });
    }
  });

  /**
   * Create a new campaign
   * POST /api/campaigns
   */
  app.post('/api/campaigns', async (req, res) => {
    try {
      const campaignData = req.body;

      if (!campaignData.userEmail || !campaignData.name || !campaignData.platformCredentialId) {
        return res.status(400).json({ 
          success: false,
          error: 'User email, campaign name, and platform credential ID are required' 
        });
      }

      const user = await storage.getUserByEmail(campaignData.userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Check subscription limits
      const subscriptionCheck = await checkSubscriptionLimits(campaignData.userEmail, 'create_campaign');
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({ 
          success: false,
          error: subscriptionCheck.message || 'Subscription limit reached' 
        });
      }

      // Verify platform credential belongs to user
      const credential = await storage.getPlatformCredential(campaignData.platformCredentialId);
      if (!credential || credential.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Invalid platform credential' 
        });
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`create_campaign_${user.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      const campaign = await storage.createCampaign({
        userId: user.id,
        groupId: campaignData.groupId || null,
        platformCredentialId: campaignData.platformCredentialId,
        externalCampaignId: `demo_campaign_${Date.now()}`, // Demo mode
        name: campaignData.name,
        description: campaignData.description,
        objective: campaignData.objective,
        budgetType: campaignData.budgetType,
        budgetAmountCents: campaignData.budgetAmountCents,
        bidStrategy: campaignData.bidStrategy,
        bidAmountCents: campaignData.bidAmountCents,
        startDate: campaignData.startDate ? new Date(campaignData.startDate) : null,
        endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
        timezone: campaignData.timezone || 'UTC',
        targetingCriteria: campaignData.targetingCriteria || {},
        conversionGoals: campaignData.conversionGoals || {},
        platformSettings: { ...campaignData.platformSettings, demo_mode: true },
        optimizationRules: campaignData.optimizationRules || {},
        tags: campaignData.tags || [],
        isTemplate: campaignData.isTemplate || false,
        templateName: campaignData.templateName,
      });

      res.status(201).json({
        success: true,
        data: campaign
      });
    } catch (error: any) {
      console.error('Create campaign error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create campaign: ' + error.message 
      });
    }
  });

  /**
   * Update a campaign
   * PUT /api/campaigns/:campaignId
   */
  app.put('/api/campaigns/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const campaignData = req.body;

      if (!campaignData.userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(campaignData.userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const existingCampaign = await storage.getCampaign(campaignId);
      if (!existingCampaign || existingCampaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`update_campaign_${user.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      const updates: any = { updatedAt: new Date() };
      
      // Only update provided fields
      const allowedFields = ['name', 'description', 'status', 'budgetAmountCents', 'bidAmountCents', 
                            'startDate', 'endDate', 'targetingCriteria', 'conversionGoals', 
                            'platformSettings', 'optimizationRules', 'tags'];
      
      allowedFields.forEach(field => {
        if (campaignData[field] !== undefined) {
          if (field === 'startDate' || field === 'endDate') {
            updates[field] = campaignData[field] ? new Date(campaignData[field]) : null;
          } else {
            updates[field] = campaignData[field];
          }
        }
      });

      const updatedCampaign = await storage.updateCampaign(campaignId, updates);

      if (updatedCampaign) {
        res.json({
          success: true,
          data: updatedCampaign
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }
    } catch (error: any) {
      console.error('Update campaign error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update campaign: ' + error.message 
      });
    }
  });

  /**
   * Delete a campaign
   * DELETE /api/campaigns/:campaignId
   */
  app.delete('/api/campaigns/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const success = await storage.deleteCampaign(campaignId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Campaign deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete campaign: ' + error.message 
      });
    }
  });

  // =============================================================================
  // AD GROUP ROUTES
  // =============================================================================

  /**
   * Get all ad groups for a campaign
   * GET /api/campaigns/adgroups/campaign/:campaignId
   */
  app.get('/api/campaigns/adgroups/campaign/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const adGroups = await storage.getAdGroupsByCampaign(campaignId);

      res.json({
        success: true,
        data: adGroups
      });
    } catch (error: any) {
      console.error('Get ad groups error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch ad groups: ' + error.message 
      });
    }
  });

  /**
   * Create a new ad group
   * POST /api/campaigns/adgroups
   */
  app.post('/api/campaigns/adgroups', async (req, res) => {
    try {
      const adGroupData = req.body;

      if (!adGroupData.userEmail || !adGroupData.campaignId || !adGroupData.name) {
        return res.status(400).json({ 
          success: false,
          error: 'User email, campaign ID, and ad group name are required' 
        });
      }

      const user = await storage.getUserByEmail(adGroupData.userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(adGroupData.campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Invalid campaign' 
        });
      }

      const adGroup = await storage.createAdGroup({
        campaignId: adGroupData.campaignId,
        externalAdGroupId: `demo_adgroup_${Date.now()}`, // Demo mode
        name: adGroupData.name,
        status: adGroupData.status || 'active',
        bidStrategy: adGroupData.bidStrategy || 'inherit',
        bidAmountCents: adGroupData.bidAmountCents,
        audienceId: adGroupData.audienceId || null,
        targetingCriteria: adGroupData.targetingCriteria || {},
        optimizationRules: adGroupData.optimizationRules || {}
      });

      res.status(201).json({
        success: true,
        data: adGroup
      });
    } catch (error: any) {
      console.error('Create ad group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create ad group: ' + error.message 
      });
    }
  });

  /**
   * Update an ad group
   * PUT /api/campaigns/adgroups/:adGroupId
   */
  app.put('/api/campaigns/adgroups/:adGroupId', async (req, res) => {
    try {
      const { adGroupId } = req.params;
      const adGroupData = req.body;

      if (!adGroupData.userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(adGroupData.userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify ad group belongs to user (through campaign)
      const existingAdGroup = await storage.getAdGroup(adGroupId);
      if (!existingAdGroup) {
        return res.status(404).json({ 
          success: false,
          error: 'Ad group not found' 
        });
      }

      const campaign = await storage.getCampaign(existingAdGroup.campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const updates: any = { updatedAt: new Date() };
      
      const allowedFields = ['name', 'status', 'bidStrategy', 'bidAmountCents', 
                            'audienceId', 'targetingCriteria', 'optimizationRules'];
      
      allowedFields.forEach(field => {
        if (adGroupData[field] !== undefined) {
          updates[field] = adGroupData[field];
        }
      });

      const updatedAdGroup = await storage.updateAdGroup(adGroupId, updates);

      if (updatedAdGroup) {
        res.json({
          success: true,
          data: updatedAdGroup
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Ad group not found'
        });
      }
    } catch (error: any) {
      console.error('Update ad group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update ad group: ' + error.message 
      });
    }
  });

  /**
   * Delete an ad group
   * DELETE /api/campaigns/adgroups/:adGroupId
   */
  app.delete('/api/campaigns/adgroups/:adGroupId', async (req, res) => {
    try {
      const { adGroupId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify ad group belongs to user (through campaign)
      const adGroup = await storage.getAdGroup(adGroupId);
      if (!adGroup) {
        return res.status(404).json({ 
          success: false,
          error: 'Ad group not found' 
        });
      }

      const campaign = await storage.getCampaign(adGroup.campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const success = await storage.deleteAdGroup(adGroupId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Ad group deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Ad group not found'
        });
      }
    } catch (error: any) {
      console.error('Delete ad group error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete ad group: ' + error.message 
      });
    }
  });

  // =============================================================================
  // AUDIENCE MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Get all audiences for authenticated user
   * GET /api/campaigns/me/audiences
   */
  app.get('/api/campaigns/me/audiences', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const { type, status } = req.query;

      let audiences;
      if (type) {
        audiences = await storage.getAudiencesByType(user.id, type as string);
      } else {
        audiences = await storage.getAudiences(user.id);
      }

      // Filter by status if provided
      if (status) {
        audiences = audiences.filter(audience => audience.status === status);
      }

      res.json({
        success: true,
        data: audiences
      });
    } catch (error: any) {
      console.error('Get audiences error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch audiences: ' + error.message 
      });
    }
  });

  /**
   * Create a new audience
   * POST /api/campaigns/me/audiences
   */
  app.post('/api/campaigns/me/audiences', secureAuthenticateAPI, requireSubscription('basic'), async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      const audienceData = req.body;

      if (!audienceData.name || !audienceData.type) {
        return res.status(400).json({ 
          success: false,
          error: 'Audience name and type are required' 
        });
      }

      // Check subscription limits using authenticated user
      const subscriptionCheck = await checkSubscriptionLimits(user.email!, 'create_audience');
      if (!subscriptionCheck.allowed) {
        return sendAuthError(res, 'subscription', subscriptionCheck.message || 'Subscription limit reached');
      }

      const audience = await storage.createAudience({
        userId: user.id,
        name: audienceData.name,
        description: audienceData.description,
        type: audienceData.type,
        sourceType: audienceData.sourceType || 'upload',
        size: audienceData.size,
        status: 'processing',
        platformSpecific: audienceData.platformSpecific || {},
        targetingCriteria: audienceData.targetingCriteria || {},
        uploadedDataHash: audienceData.uploadedDataHash,
        privacyLevel: audienceData.privacyLevel || 'confidential',
        refreshFrequency: audienceData.refreshFrequency || 'manual',
        expiresAt: audienceData.expiresAt ? new Date(audienceData.expiresAt) : null
      });

      res.status(201).json({
        success: true,
        data: audience
      });
    } catch (error: any) {
      console.error('Create audience error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create audience: ' + error.message 
      });
    }
  });

  /**
   * Upload customer data for audience creation
   * POST /api/campaigns/me/audiences/:audienceId/upload
   */
  app.post('/api/campaigns/me/audiences/:audienceId/upload', secureAuthenticateAPI, requireSubscription('basic'), async (req: AuthenticatedRequest, res) => {
    try {
      const { audienceId } = req.params;
      const user = req.user;
      const { customerData, dataType } = req.body;

      if (!audienceId || !customerData) {
        return res.status(400).json({ 
          success: false,
          error: 'Audience ID and customer data are required' 
        });
      }

      // Verify audience exists and belongs to authenticated user
      const audience = await storage.getAudience(audienceId);
      if (!audience) {
        return res.status(404).json({ 
          success: false,
          error: 'Audience not found' 
        });
      }

      if (audience.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this audience');
      }

      // Check subscription limits using authenticated user
      const subscriptionCheck = await checkSubscriptionLimits(user.email!, 'upload_customer_data');
      if (!subscriptionCheck.allowed) {
        return sendAuthError(res, 'subscription', subscriptionCheck.message || 'Subscription limit reached');
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`upload_data_${user.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      // In production, implement proper PII hashing and security
      const upload = await storage.createCustomerDataUpload({
        userId: user.id,
        audienceId: audienceId,
        fileName: `upload_${Date.now()}.csv`,
        fileSize: JSON.stringify(customerData).length,
        recordCount: Array.isArray(customerData) ? customerData.length : 1,
        dataType: dataType || 'email',
        status: 'processing',
        uploadMetadata: {
          demo_mode: true,
          upload_time: new Date().toISOString(),
          data_type: dataType
        }
      });

      // Update audience status
      await storage.updateAudience(audienceId, {
        status: 'ready',
        size: Array.isArray(customerData) ? customerData.length : 1,
        lastRefreshAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: {
          uploadId: upload.id,
          audienceId: audienceId,
          recordCount: upload.recordCount,
          status: 'processing',
          demo_mode: true
        }
      });
    } catch (error: any) {
      console.error('Upload customer data error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to upload customer data: ' + error.message 
      });
    }
  });

  /**
   * Update an audience
   * PUT /api/campaigns/me/audiences/:audienceId
   */
  app.put('/api/campaigns/me/audiences/:audienceId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { audienceId } = req.params;
      const user = req.user;
      const audienceData = req.body;

      // Verify audience exists and belongs to authenticated user
      const existingAudience = await storage.getAudience(audienceId);
      if (!existingAudience) {
        return res.status(404).json({ 
          success: false,
          error: 'Audience not found' 
        });
      }

      if (existingAudience.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this audience');
      }

      const updates: any = { updatedAt: new Date() };
      
      const allowedFields = ['name', 'description', 'status', 'targetingCriteria', 
                            'refreshFrequency', 'expiresAt', 'privacyLevel'];
      
      allowedFields.forEach(field => {
        if (audienceData[field] !== undefined) {
          if (field === 'expiresAt') {
            updates[field] = audienceData[field] ? new Date(audienceData[field]) : null;
          } else {
            updates[field] = audienceData[field];
          }
        }
      });

      const updatedAudience = await storage.updateAudience(audienceId, updates);

      if (updatedAudience) {
        res.json({
          success: true,
          data: updatedAudience
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Audience not found'
        });
      }
    } catch (error: any) {
      console.error('Update audience error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update audience: ' + error.message 
      });
    }
  });

  /**
   * Delete an audience
   * DELETE /api/campaigns/me/audiences/:audienceId
   */
  app.delete('/api/campaigns/me/audiences/:audienceId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const { audienceId } = req.params;
      const user = req.user;

      // Verify audience exists and belongs to authenticated user
      const audience = await storage.getAudience(audienceId);
      if (!audience) {
        return res.status(404).json({ 
          success: false,
          error: 'Audience not found' 
        });
      }

      if (audience.userId !== user.id) {
        return sendAuthError(res, 'unauthorized', 'Access denied to this audience');
      }

      const success = await storage.deleteAudience(audienceId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Audience deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Audience not found'
        });
      }
    } catch (error: any) {
      console.error('Delete audience error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete audience: ' + error.message 
      });
    }
  });

  // =============================================================================
  // PERFORMANCE METRICS ROUTES
  // =============================================================================

  /**
   * Get campaign performance metrics
   * GET /api/campaigns/metrics/:campaignId
   */
  app.get('/api/campaigns/metrics/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail, startDate, endDate, granularity } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Get metrics from storage
      const metrics = await storage.getCampaignMetrics(
        campaignId, 
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Generate demo metrics if none exist
      if (metrics.length === 0) {
        const demoMetrics = {
          campaignId: campaignId,
          date: new Date().toISOString().split('T')[0],
          impressions: Math.floor(Math.random() * 10000) + 1000,
          clicks: Math.floor(Math.random() * 500) + 50,
          conversions: Math.floor(Math.random() * 25) + 5,
          spend: Math.floor(Math.random() * 50000) + 10000, // in cents
          revenue: Math.floor(Math.random() * 75000) + 15000, // in cents
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0,
          demo_mode: true
        };

        // Calculate derived metrics
        demoMetrics.ctr = (demoMetrics.clicks / demoMetrics.impressions * 100);
        demoMetrics.cpc = (demoMetrics.spend / demoMetrics.clicks);
        demoMetrics.cpm = (demoMetrics.spend / demoMetrics.impressions * 1000);
        demoMetrics.roas = (demoMetrics.revenue / demoMetrics.spend);

        res.json({
          success: true,
          data: [demoMetrics],
          demo_mode: true
        });
      } else {
        res.json({
          success: true,
          data: metrics
        });
      }
    } catch (error: any) {
      console.error('Get campaign metrics error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch campaign metrics: ' + error.message 
      });
    }
  });

  /**
   * Get real-time campaign dashboard data
   * GET /api/campaigns/metrics/dashboard/:userEmail
   */
  app.get('/api/campaigns/metrics/dashboard/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { timeframe } = req.query;

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Get user's campaigns
      const campaigns = await storage.getCampaigns(user.id);
      
      // Generate dashboard summary
      const dashboardData = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalSpend: Math.floor(Math.random() * 500000) + 100000, // Demo data in cents
        totalRevenue: Math.floor(Math.random() * 750000) + 150000, // Demo data in cents
        totalImpressions: Math.floor(Math.random() * 1000000) + 100000,
        totalClicks: Math.floor(Math.random() * 50000) + 5000,
        totalConversions: Math.floor(Math.random() * 2500) + 250,
        averageCTR: 0,
        averageCPC: 0,
        averageROAS: 0,
        topPerformingCampaigns: campaigns.slice(0, 5).map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          spend: Math.floor(Math.random() * 50000) + 5000,
          revenue: Math.floor(Math.random() * 75000) + 7500,
          roas: 0,
          status: campaign.status
        })),
        demo_mode: true
      };

      // Calculate derived metrics
      dashboardData.averageCTR = (dashboardData.totalClicks / dashboardData.totalImpressions * 100);
      dashboardData.averageCPC = (dashboardData.totalSpend / dashboardData.totalClicks);
      dashboardData.averageROAS = (dashboardData.totalRevenue / dashboardData.totalSpend);

      // Calculate ROAS for top campaigns
      dashboardData.topPerformingCampaigns.forEach(campaign => {
        campaign.roas = campaign.revenue / campaign.spend;
      });

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get dashboard metrics error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch dashboard metrics: ' + error.message 
      });
    }
  });

  /**
   * Get performance trends and insights
   * GET /api/campaigns/metrics/trends/:userEmail
   */
  app.get('/api/campaigns/metrics/trends/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { timeframe, metric } = req.query;

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Generate demo trend data
      const trends = {
        timeframe: timeframe || '30d',
        metric: metric || 'spend',
        data: [],
        insights: [
          'Spend increased by 15% over the last 30 days',
          'CTR improved by 8% compared to previous period',
          'Conversion rate is 23% above industry average',
          'Top performing audience segment: 25-34 age group'
        ],
        recommendations: [
          'Consider increasing budget for top performing campaigns',
          'Optimize ad creative for mobile devices',
          'Expand successful audience segments',
          'Pause underperforming ad groups'
        ],
        demo_mode: true
      };

      // Generate trend data points
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.data.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 10000) + 1000,
          change: (Math.random() - 0.5) * 100 // Random change percentage
        });
      }

      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      console.error('Get trends error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch trends: ' + error.message 
      });
    }
  });

  // =============================================================================
  // REPORTING ROUTES
  // =============================================================================

  /**
   * Generate custom performance report
   * POST /api/campaigns/reports/generate
   */
  app.post('/api/campaigns/reports/generate', async (req, res) => {
    try {
      const { userEmail, reportConfig } = req.body;

      if (!userEmail || !reportConfig) {
        return res.status(400).json({ 
          success: false,
          error: 'User email and report configuration are required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Check subscription limits
      const subscriptionCheck = await checkSubscriptionLimits(userEmail, 'generate_report');
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({ 
          success: false,
          error: subscriptionCheck.message || 'Subscription limit reached' 
        });
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`generate_report_${user.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      // Generate demo report
      const report = {
        id: `report_${Date.now()}`,
        userId: user.id,
        name: reportConfig.name || 'Campaign Performance Report',
        type: reportConfig.type || 'performance',
        status: 'completed',
        generatedAt: new Date().toISOString(),
        config: reportConfig,
        data: {
          summary: {
            totalCampaigns: 5,
            totalSpend: 125000, // cents
            totalRevenue: 187500, // cents
            averageROAS: 1.5,
            topMetrics: {
              impressions: 245000,
              clicks: 9800,
              conversions: 392,
              ctr: 4.0,
              cpc: 1275 // cents
            }
          },
          campaigns: [
            {
              name: 'Summer Sale Campaign',
              spend: 45000,
              revenue: 75000,
              roas: 1.67,
              impressions: 95000,
              clicks: 3800,
              conversions: 152
            },
            {
              name: 'Back to School Promo',
              spend: 38000,
              revenue: 57000,
              roas: 1.5,
              impressions: 82000,
              clicks: 2900,
              conversions: 116
            }
          ],
          timeRange: {
            start: reportConfig.startDate || '2024-01-01',
            end: reportConfig.endDate || '2024-01-31'
          }
        },
        downloadUrl: `/api/campaigns/reports/download/report_${Date.now()}.pdf`,
        demo_mode: true
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      console.error('Generate report error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate report: ' + error.message 
      });
    }
  });

  /**
   * Download report in various formats
   * GET /api/campaigns/reports/download/:reportId
   */
  app.get('/api/campaigns/reports/download/:reportId', async (req, res) => {
    try {
      const { reportId } = req.params;
      const { userEmail, format } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // In demo mode, return demo CSV content
      if (format === 'csv' || !format) {
        const csvContent = `Campaign Name,Spend,Revenue,ROAS,Impressions,Clicks,Conversions
Summer Sale Campaign,$450.00,$750.00,1.67,95000,3800,152
Back to School Promo,$380.00,$570.00,1.50,82000,2900,116
Holiday Special,$320.00,$480.00,1.50,68000,2100,84`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportId}.csv"`);
        res.send(csvContent);
      } else if (format === 'pdf') {
        // In production, generate actual PDF
        res.status(501).json({
          success: false,
          error: 'PDF generation not implemented in demo mode'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported format'
        });
      }
    } catch (error: any) {
      console.error('Download report error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to download report: ' + error.message 
      });
    }
  });

  /**
   * Get available native platform reports
   * GET /api/campaigns/reports/native/:platformCredentialId
   */
  app.get('/api/campaigns/reports/native/:platformCredentialId', async (req, res) => {
    try {
      const { platformCredentialId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify platform credential belongs to user
      const credential = await storage.getPlatformCredential(platformCredentialId);
      if (!credential || credential.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const platform = await storage.getPlatform(credential.platformId);
      
      // Return available native reports based on platform
      const nativeReports = {
        google_ads: [
          { id: 'account_performance', name: 'Account Performance Report', description: 'Overall account metrics' },
          { id: 'campaign_performance', name: 'Campaign Performance Report', description: 'Campaign-level metrics' },
          { id: 'ad_group_performance', name: 'Ad Group Performance Report', description: 'Ad group metrics' },
          { id: 'keyword_performance', name: 'Keyword Performance Report', description: 'Keyword-level data' }
        ],
        meta_ads: [
          { id: 'campaign_insights', name: 'Campaign Insights', description: 'Campaign performance data' },
          { id: 'ad_insights', name: 'Ad Insights', description: 'Individual ad performance' },
          { id: 'audience_insights', name: 'Audience Insights', description: 'Audience performance metrics' }
        ],
        tiktok_ads: [
          { id: 'campaign_report', name: 'Campaign Report', description: 'Campaign-level reporting' },
          { id: 'adgroup_report', name: 'Ad Group Report', description: 'Ad group performance' },
          { id: 'ad_report', name: 'Ad Report', description: 'Individual ad metrics' }
        ]
      };

      const reports = nativeReports[platform?.name as keyof typeof nativeReports] || [];

      res.json({
        success: true,
        data: {
          platformName: platform?.name,
          platformDisplayName: platform?.displayName,
          availableReports: reports,
          demo_mode: true
        }
      });
    } catch (error: any) {
      console.error('Get native reports error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch native reports: ' + error.message 
      });
    }
  });

  // =============================================================================
  // OPTIMIZATION ROUTES
  // =============================================================================

  /**
   * Get AI-powered optimization recommendations
   * GET /api/campaigns/optimize/recommendations/:campaignId
   */
  app.get('/api/campaigns/optimize/recommendations/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Check subscription limits
      const subscriptionCheck = await checkSubscriptionLimits(userEmail as string, 'ai_optimization');
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({ 
          success: false,
          error: subscriptionCheck.message || 'AI optimization requires paid subscription' 
        });
      }

      // Generate AI optimization recommendations (demo)
      const recommendations = {
        campaignId: campaignId,
        generatedAt: new Date().toISOString(),
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        recommendations: [
          {
            id: 'budget_optimization',
            type: 'budget',
            priority: 'high',
            title: 'Increase Budget for High-Performing Ad Groups',
            description: 'Ad Groups 1 and 3 are showing strong ROAS. Consider increasing their budget by 25%.',
            expectedImpact: '+15% conversions',
            confidence: 85,
            actionRequired: 'budget_adjustment',
            details: {
              currentBudget: campaign.budgetAmountCents,
              recommendedBudget: Math.floor((campaign.budgetAmountCents || 10000) * 1.25),
              expectedROAS: 1.8
            }
          },
          {
            id: 'keyword_optimization',
            type: 'keywords',
            priority: 'medium',
            title: 'Add Negative Keywords',
            description: 'Identified 12 low-performing keywords that are consuming budget without conversions.',
            expectedImpact: '+8% efficiency',
            confidence: 78,
            actionRequired: 'keyword_management',
            details: {
              negativeKeywords: ['cheap alternative', 'free version', 'discount codes'],
              estimatedSavings: 2500 // cents
            }
          },
          {
            id: 'ad_schedule_optimization',
            type: 'schedule',
            priority: 'medium',
            title: 'Optimize Ad Scheduling',
            description: 'Performance data shows 40% higher conversion rates between 2-6 PM weekdays.',
            expectedImpact: '+12% conversions',
            confidence: 72,
            actionRequired: 'schedule_adjustment',
            details: {
              optimalHours: ['14:00-18:00'],
              optimalDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }
          },
          {
            id: 'audience_expansion',
            type: 'audience',
            priority: 'low',
            title: 'Expand Similar Audiences',
            description: 'Your top-performing audience segment can be expanded with similar users.',
            expectedImpact: '+20% reach',
            confidence: 65,
            actionRequired: 'audience_creation',
            details: {
              baseAudienceSize: 150000,
              expandedAudienceSize: 180000,
              similarity: 90
            }
          }
        ],
        performanceMetrics: {
          currentROAS: 1.45,
          projectedROAS: 1.68,
          currentCTR: 3.2,
          projectedCTR: 3.8,
          potentialSavings: 15000 // cents
        },
        demo_mode: true
      };

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      console.error('Get optimization recommendations error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch optimization recommendations: ' + error.message 
      });
    }
  });

  /**
   * Apply optimization recommendations
   * POST /api/campaigns/optimize/apply
   */
  app.post('/api/campaigns/optimize/apply', async (req, res) => {
    try {
      const { userEmail, campaignId, recommendationIds, autoApprove } = req.body;

      if (!userEmail || !campaignId || !recommendationIds) {
        return res.status(400).json({ 
          success: false,
          error: 'User email, campaign ID, and recommendation IDs are required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Check subscription limits
      const subscriptionCheck = await checkSubscriptionLimits(userEmail, 'apply_optimization');
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({ 
          success: false,
          error: subscriptionCheck.message || 'Auto-optimization requires paid subscription' 
        });
      }

      // Rate limiting check
      if (!rateLimitMiddleware(`apply_optimization_${user.id}`)) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      // Process optimization recommendations (demo)
      const results = recommendationIds.map((id: string) => ({
        recommendationId: id,
        status: autoApprove ? 'applied' : 'pending_approval',
        appliedAt: autoApprove ? new Date().toISOString() : null,
        result: autoApprove ? 'Budget increased by 25% for high-performing ad groups' : 'Awaiting manual approval'
      }));

      // Create optimization rule entry
      await storage.createOptimizationRule({
        campaignId: campaignId,
        name: 'AI Optimization Batch',
        type: 'ai_generated',
        conditions: { recommendationIds },
        actions: { autoApprove, appliedRecommendations: results },
        isActive: true,
        metadata: {
          demo_mode: true,
          applied_at: new Date().toISOString(),
          user_initiated: true
        }
      });

      res.json({
        success: true,
        data: {
          campaignId,
          appliedRecommendations: results,
          totalRecommendations: recommendationIds.length,
          autoApproved: autoApprove,
          demo_mode: true
        }
      });
    } catch (error: any) {
      console.error('Apply optimization error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to apply optimization: ' + error.message 
      });
    }
  });

  /**
   * Get optimization history
   * GET /api/campaigns/optimize/history/:campaignId
   */
  app.get('/api/campaigns/optimize/history/:campaignId', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'User email is required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail as string);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const optimizationRules = await storage.getOptimizationRulesByCampaign(campaignId);

      res.json({
        success: true,
        data: {
          campaignId,
          optimizationHistory: optimizationRules,
          totalOptimizations: optimizationRules.length
        }
      });
    } catch (error: any) {
      console.error('Get optimization history error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch optimization history: ' + error.message 
      });
    }
  });

  /**
   * Create auto-optimization rule
   * POST /api/campaigns/optimize/rules
   */
  app.post('/api/campaigns/optimize/rules', async (req, res) => {
    try {
      const { userEmail, campaignId, ruleName, ruleType, conditions, actions } = req.body;

      if (!userEmail || !campaignId || !ruleName || !ruleType) {
        return res.status(400).json({ 
          success: false,
          error: 'User email, campaign ID, rule name, and type are required' 
        });
      }

      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Verify campaign belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign || campaign.userId !== user.id) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Check subscription limits
      const subscriptionCheck = await checkSubscriptionLimits(userEmail, 'create_optimization_rule');
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({ 
          success: false,
          error: subscriptionCheck.message || 'Auto-optimization rules require paid subscription' 
        });
      }

      const rule = await storage.createOptimizationRule({
        campaignId,
        name: ruleName,
        type: ruleType,
        conditions: conditions || {},
        actions: actions || {},
        isActive: true,
        metadata: {
          demo_mode: true,
          created_via: 'api',
          user_created: true
        }
      });

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error: any) {
      console.error('Create optimization rule error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create optimization rule: ' + error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
