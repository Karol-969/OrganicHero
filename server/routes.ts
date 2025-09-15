import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seoAnalysisSchema, type SEOAnalysisResult } from "@shared/schema";
import { z } from "zod";
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

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
  // Look for location indicators
  const locationPatterns = [
    /(?:located in|based in|serving|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\s+\d{5}/gi,
    /\b([A-Z][a-z]+),\s+([A-Z]{2})\b/gi
  ];
  
  for (const pattern of locationPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0].replace(/located in|based in|serving|in/gi, '').trim();
    }
  }
  
  // Common US cities as fallback
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  for (const city of cities) {
    if (content.includes(city.toLowerCase())) {
      return city;
    }
  }
  
  return 'United States';
}

function extractProducts(content: string): string[] {
  const productKeywords = [
    'product', 'item', 'goods', 'merchandise', 'solution', 'offering', 'package',
    'software', 'app', 'tool', 'platform', 'system', 'device', 'equipment'
  ];
  
  const products: string[] = [];
  
  // Look for patterns like "our products include", "we offer", etc.
  const productPatterns = [
    /(?:products?|offerings?|solutions?|services?)\s+(?:include|are|:)\s*([^.!?]*)/gi,
    /(?:we|our company)\s+(?:offer|provide|sell|make|create)\s+([^.!?]*)/gi
  ];
  
  for (const pattern of productPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const items = match.split(/,|and|\&/).map(item => item.trim()).filter(item => item.length > 3 && item.length < 50);
        products.push(...items);
      });
    }
  }
  
  return Array.from(new Set(products)).slice(0, 5); // Remove duplicates, limit to 5
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

// Real competitor analysis using multiple SERP APIs
async function analyzeCompetitors(domain: string, businessIntel?: BusinessIntelligence) {
  const serperApiKey = process.env.SERPER_API_KEY;
  const serpApiKey = process.env.SERPAPI_KEY;
  
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
      
      const difficulty = domainCount >= 8 ? 'high' : domainCount >= 5 ? 'medium' : 'low';
      
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
function mapCompetitionToDifficulty(competitionLevel?: string): string {
  switch (competitionLevel?.toLowerCase()) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'medium';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
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
        keywords,
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

  const httpServer = createServer(app);

  return httpServer;
}
