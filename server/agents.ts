import { OpenAI } from 'openai';
import { 
  AgentAnalysis, 
  ActionItem, 
  ComprehensiveAnalysis,
  SEOAnalysisResult 
} from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BusinessIntelligence {
  businessType: string;
  products: string[];
  services: string[];
  location: string;
  industry: string;
  keywords: string[];
  description: string;
}

// Base Agent Class
abstract class AnalysisAgent {
  protected agentType: AgentAnalysis['agentType'];
  protected domain: string;
  protected businessIntel?: BusinessIntelligence;
  protected basicAnalysis?: SEOAnalysisResult;

  constructor(
    agentType: AgentAnalysis['agentType'], 
    domain: string, 
    businessIntel?: BusinessIntelligence,
    basicAnalysis?: SEOAnalysisResult
  ) {
    this.agentType = agentType;
    this.domain = domain;
    this.businessIntel = businessIntel;
    this.basicAnalysis = basicAnalysis;
  }

  abstract analyze(): Promise<AgentAnalysis>;

  protected async callOpenAI(prompt: string, maxTokens: number = 1000): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO analyst. Provide detailed, actionable insights based on the data provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`OpenAI API error for ${this.agentType}:`, error);
      throw new Error(`AI analysis failed for ${this.agentType}`);
    }
  }

  protected createBaseResult(): Partial<AgentAnalysis> {
    return {
      agentType: this.agentType,
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
    };
  }
}

// Technical SEO Agent
class TechnicalSEOAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('technical_seo', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      // Analyze technical SEO issues from basic analysis
      const technicalIssues = this.basicAnalysis?.technicalSeo.issues || [];
      const pageSpeed = this.basicAnalysis?.pageSpeed;
      
      const prompt = `
        Analyze the technical SEO for domain: ${this.domain}
        
        Current Technical Issues:
        ${technicalIssues.map(issue => `- ${issue.title}: ${issue.description}`).join('\n')}
        
        Page Speed Data:
        - Mobile Score: ${pageSpeed?.mobile}/100
        - Desktop Score: ${pageSpeed?.desktop}/100
        - Largest Contentful Paint: ${pageSpeed?.largestContentfulPaint}s
        - Cumulative Layout Shift: ${pageSpeed?.cumulativeLayoutShift}
        
        Business Context: ${this.businessIntel?.businessType} in ${this.businessIntel?.industry}
        
        Provide:
        1. 5 key technical SEO findings
        2. 5 specific recommendations to improve technical performance
        3. Priority order for implementations
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse AI response into structured findings and recommendations
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('finding')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        technicalScore: this.basicAnalysis?.technicalSeo.score || 0,
        criticalIssues: technicalIssues.filter(issue => issue.impact === 'high').length,
        pageSpeedGrade: this.getPageSpeedGrade(pageSpeed?.mobile || 0),
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
  
  private getPageSpeedGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

// Content Analysis Agent
class ContentAnalysisAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('content_analysis', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      const prompt = `
        Analyze content strategy for: ${this.domain}
        
        Business Information:
        - Type: ${this.businessIntel?.businessType}
        - Industry: ${this.businessIntel?.industry}
        - Location: ${this.businessIntel?.location}
        - Products: ${this.businessIntel?.products?.join(', ')}
        - Services: ${this.businessIntel?.services?.join(', ')}
        
        Target Keywords: ${this.basicAnalysis?.keywords?.map(k => k.keyword).join(', ')}
        
        Analyze and provide:
        1. 5 content gaps that should be addressed
        2. 5 content optimization recommendations
        3. Content topics that would improve SEO rankings
        4. Content types that would work best for this business
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse response
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('gap') || line.toLowerCase().includes('finding')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('optimization')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        contentScore: this.calculateContentScore(),
        keywordCoverage: this.basicAnalysis?.keywords?.length || 0,
        industry: this.businessIntel?.industry,
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
  
  private calculateContentScore(): number {
    // Calculate based on available data
    const keywordCount = this.basicAnalysis?.keywords?.length || 0;
    const servicesCount = this.businessIntel?.services?.length || 0;
    const productsCount = this.businessIntel?.products?.length || 0;
    
    // Simple scoring algorithm
    let score = 60; // Base score
    score += Math.min(keywordCount * 5, 20); // Up to 20 points for keywords
    score += Math.min((servicesCount + productsCount) * 3, 15); // Up to 15 points for offerings
    
    return Math.min(score, 100);
  }
}

// Competitor Intelligence Agent
class CompetitorIntelligenceAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('competitor_intelligence', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      const competitors = this.basicAnalysis?.competitors || [];
      
      const prompt = `
        Deep competitive analysis for: ${this.domain}
        
        Business Context:
        - Type: ${this.businessIntel?.businessType}
        - Industry: ${this.businessIntel?.industry}
        - Location: ${this.businessIntel?.location}
        
        Current Competitors:
        ${competitors.map(comp => `- ${comp.name} (Score: ${comp.score}, Rank: ${comp.ranking})`).join('\n')}
        
        Market Position: Rank ${this.basicAnalysis?.marketPosition?.rank} of ${this.basicAnalysis?.marketPosition?.totalCompetitors}
        
        Analyze and provide:
        1. 5 competitive intelligence findings
        2. 5 strategic recommendations to outrank competitors
        3. Competitive advantages to leverage
        4. Market gaps to exploit
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse response
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('finding') || line.toLowerCase().includes('intelligence')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('strategic')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        competitorCount: competitors.length,
        marketRank: this.basicAnalysis?.marketPosition?.rank || 0,
        competitiveStrength: this.calculateCompetitiveStrength(competitors),
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
  
  private calculateCompetitiveStrength(competitors: any[]): string {
    if (competitors.length === 0) return 'Unknown';
    
    const avgCompetitorScore = competitors.reduce((sum, comp) => sum + comp.score, 0) / competitors.length;
    const currentScore = this.basicAnalysis?.seoScore || 0;
    
    if (currentScore > avgCompetitorScore + 10) return 'Strong';
    if (currentScore > avgCompetitorScore - 5) return 'Competitive';
    return 'Needs Improvement';
  }
}

// Keyword Research Agent
class KeywordResearchAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('keyword_research', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      const keywords = this.basicAnalysis?.keywords || [];
      
      const prompt = `
        Advanced keyword strategy analysis for: ${this.domain}
        
        Business Context:
        - Type: ${this.businessIntel?.businessType}
        - Industry: ${this.businessIntel?.industry}
        - Location: ${this.businessIntel?.location}
        - Services: ${this.businessIntel?.services?.join(', ')}
        
        Current Keywords:
        ${keywords.map(kw => `- ${kw.keyword} (Volume: ${kw.volume}, Difficulty: ${kw.difficulty})`).join('\n')}
        
        Provide:
        1. 5 keyword strategy findings
        2. 5 keyword optimization recommendations
        3. Untapped keyword opportunities
        4. Long-tail keyword strategies
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse response
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('finding') || line.toLowerCase().includes('strategy')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('optimization')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        keywordCount: keywords.length,
        avgVolume: keywords.reduce((sum, kw) => sum + kw.volume, 0) / keywords.length || 0,
        highDifficultyCount: keywords.filter(kw => kw.difficulty === 'high').length,
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
}

// SERP Analysis Agent
class SERPAnalysisAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('serp_analysis', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      const serpData = this.basicAnalysis?.serpPresence;
      
      const prompt = `
        SERP positioning analysis for: ${this.domain}
        
        Current SERP Presence:
        - Organic Results: ${serpData?.organicResults?.length || 0} listings
        - Maps Results: ${serpData?.mapsResults?.found ? 'Found' : 'Not found'}
        - Featured Snippets: ${serpData?.featuredSnippets?.found ? 'Found' : 'Not found'}
        - Knowledge Panel: ${serpData?.knowledgePanel?.found ? 'Found' : 'Not found'}
        - News Results: ${serpData?.newsResults?.found ? 'Found' : 'Not found'}
        - Video Results: ${serpData?.videoResults?.found ? 'Found' : 'Not found'}
        
        Business: ${this.businessIntel?.businessType} in ${this.businessIntel?.location}
        
        Analyze and provide:
        1. 5 SERP positioning findings
        2. 5 recommendations to improve SERP visibility
        3. SERP feature opportunities
        4. Local SEO opportunities
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse response
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('finding') || line.toLowerCase().includes('positioning')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('improve')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        serpFeatures: this.countSerpFeatures(serpData),
        organicListings: serpData?.organicResults?.length || 0,
        localPresence: serpData?.mapsResults?.found || false,
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
  
  private countSerpFeatures(serpData: any): number {
    if (!serpData) return 0;
    
    let count = 0;
    if (serpData.featuredSnippets?.found) count++;
    if (serpData.knowledgePanel?.found) count++;
    if (serpData.mapsResults?.found) count++;
    if (serpData.newsResults?.found) count++;
    if (serpData.videoResults?.found) count++;
    if (serpData.imagesResults?.found) count++;
    
    return count;
  }
}

// User Experience Agent
class UserExperienceAgent extends AnalysisAgent {
  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    super('user_experience', domain, businessIntel, basicAnalysis);
  }

  async analyze(): Promise<AgentAnalysis> {
    const result: AgentAnalysis = {
      ...this.createBaseResult(),
      findings: [],
      recommendations: [],
    } as AgentAnalysis;
    
    try {
      result.progress = 25;
      
      const pageSpeed = this.basicAnalysis?.pageSpeed;
      
      const prompt = `
        User experience analysis for: ${this.domain}
        
        Performance Metrics:
        - Mobile Score: ${pageSpeed?.mobile}/100
        - Desktop Score: ${pageSpeed?.desktop}/100
        - First Contentful Paint: ${pageSpeed?.firstContentfulPaint}s
        - Largest Contentful Paint: ${pageSpeed?.largestContentfulPaint}s
        - Cumulative Layout Shift: ${pageSpeed?.cumulativeLayoutShift}
        
        Business Context: ${this.businessIntel?.businessType} serving ${this.businessIntel?.location}
        
        Analyze and provide:
        1. 5 user experience findings
        2. 5 UX improvement recommendations
        3. Mobile optimization opportunities
        4. Performance enhancement strategies
      `;
      
      result.progress = 50;
      const aiResponse = await this.callOpenAI(prompt, 1500);
      
      result.progress = 75;
      
      // Parse response
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const findings: string[] = [];
      const recommendations: string[] = [];
      
      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('finding') || line.toLowerCase().includes('experience')) {
          currentSection = 'findings';
        } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('improvement')) {
          currentSection = 'recommendations';
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          const cleanLine = line.trim().replace(/^[-\d.)\s]+/, '');
          if (currentSection === 'findings') {
            findings.push(cleanLine);
          } else if (currentSection === 'recommendations') {
            recommendations.push(cleanLine);
          }
        }
      }
      
      result.progress = 100;
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.findings = findings.slice(0, 5);
      result.recommendations = recommendations.slice(0, 5);
      result.data = {
        uxScore: this.calculateUXScore(pageSpeed),
        mobileOptimization: pageSpeed?.mobile || 0,
        coreWebVitalsGrade: this.getCoreWebVitalsGrade(pageSpeed),
      };
      
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.progress = 0;
    }
    
    return result;
  }
  
  private calculateUXScore(pageSpeed: any): number {
    if (!pageSpeed) return 0;
    
    const mobileScore = pageSpeed.mobile || 0;
    const lcp = pageSpeed.largestContentfulPaint || 0;
    const cls = pageSpeed.cumulativeLayoutShift || 0;
    
    let score = mobileScore;
    
    // Adjust based on Core Web Vitals
    if (lcp > 2.5) score -= 10;
    if (cls > 0.1) score -= 10;
    
    return Math.max(score, 0);
  }
  
  private getCoreWebVitalsGrade(pageSpeed: any): string {
    if (!pageSpeed) return 'F';
    
    const lcp = pageSpeed.largestContentfulPaint || 0;
    const cls = pageSpeed.cumulativeLayoutShift || 0;
    const fcp = pageSpeed.firstContentfulPaint || 0;
    
    let goodMetrics = 0;
    if (lcp <= 2.5) goodMetrics++;
    if (cls <= 0.1) goodMetrics++;
    if (fcp <= 1.8) goodMetrics++;
    
    if (goodMetrics === 3) return 'A';
    if (goodMetrics === 2) return 'B';
    if (goodMetrics === 1) return 'C';
    return 'D';
  }
}

// Agent Factory
export class AnalysisAgentFactory {
  static createAgent(
    agentType: AgentAnalysis['agentType'], 
    domain: string, 
    businessIntel?: BusinessIntelligence,
    basicAnalysis?: SEOAnalysisResult
  ): AnalysisAgent {
    switch (agentType) {
      case 'technical_seo':
        return new TechnicalSEOAgent(domain, businessIntel, basicAnalysis);
      case 'content_analysis':
        return new ContentAnalysisAgent(domain, businessIntel, basicAnalysis);
      case 'competitor_intelligence':
        return new CompetitorIntelligenceAgent(domain, businessIntel, basicAnalysis);
      case 'keyword_research':
        return new KeywordResearchAgent(domain, businessIntel, basicAnalysis);
      case 'serp_analysis':
        return new SERPAnalysisAgent(domain, businessIntel, basicAnalysis);
      case 'user_experience':
        return new UserExperienceAgent(domain, businessIntel, basicAnalysis);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }
}

// Multi-Agent Coordinator
export class MultiAgentCoordinator {
  private domain: string;
  private businessIntel?: BusinessIntelligence;
  private basicAnalysis?: SEOAnalysisResult;
  private agents: AnalysisAgent[] = [];
  private results: AgentAnalysis[] = [];

  constructor(domain: string, businessIntel?: BusinessIntelligence, basicAnalysis?: SEOAnalysisResult) {
    this.domain = domain;
    this.businessIntel = businessIntel;
    this.basicAnalysis = basicAnalysis;
  }

  async runComprehensiveAnalysis(): Promise<AgentAnalysis[]> {
    const agentTypes: AgentAnalysis['agentType'][] = [
      'technical_seo',
      'content_analysis', 
      'competitor_intelligence',
      'keyword_research',
      'serp_analysis',
      'user_experience'
    ];

    console.log('🚀 Starting multi-agent comprehensive analysis...');

    // Create all agents
    this.agents = agentTypes.map(type => 
      AnalysisAgentFactory.createAgent(type, this.domain, this.businessIntel, this.basicAnalysis)
    );

    // Run agents in parallel
    const agentPromises = this.agents.map(async (agent, index) => {
      try {
        console.log(`🤖 Starting ${agentTypes[index]} agent...`);
        const result = await agent.analyze();
        console.log(`✅ ${agentTypes[index]} agent completed`);
        return result;
      } catch (error) {
        console.error(`❌ ${agentTypes[index]} agent failed:`, error);
        return {
          agentType: agentTypes[index],
          status: 'failed' as const,
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          startTime: new Date().toISOString(),
        };
      }
    });

    this.results = await Promise.all(agentPromises);
    
    console.log('🎉 Multi-agent analysis completed');
    return this.results;
  }

  getResults(): AgentAnalysis[] {
    return this.results;
  }

  getProgress(): number {
    if (this.results.length === 0) return 0;
    
    const totalProgress = this.results.reduce((sum, result) => sum + result.progress, 0);
    return Math.round(totalProgress / this.results.length);
  }

  getStatus(): 'pending' | 'running' | 'completed' | 'failed' {
    if (this.results.length === 0) return 'pending';
    
    const failed = this.results.some(result => result.status === 'failed');
    const running = this.results.some(result => result.status === 'running');
    const completed = this.results.every(result => result.status === 'completed');
    
    if (failed) return 'failed';
    if (running) return 'running';
    if (completed) return 'completed';
    return 'running';
  }
}