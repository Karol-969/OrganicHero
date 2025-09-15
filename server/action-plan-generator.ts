import { OpenAI } from 'openai';
import { 
  ActionItem, 
  AgentAnalysis, 
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

export class ActionPlanGenerator {
  private domain: string;
  private businessIntel?: BusinessIntelligence;
  private basicAnalysis?: SEOAnalysisResult;
  private agentResults: AgentAnalysis[];

  constructor(
    domain: string,
    agentResults: AgentAnalysis[],
    businessIntel?: BusinessIntelligence,
    basicAnalysis?: SEOAnalysisResult
  ) {
    this.domain = domain;
    this.agentResults = agentResults;
    this.businessIntel = businessIntel;
    this.basicAnalysis = basicAnalysis;
  }

  async generateComprehensiveActionPlan(): Promise<ComprehensiveAnalysis['actionPlan']> {
    console.log('🎯 Generating comprehensive action plan...');

    // Collect all findings and recommendations from agents
    const allFindings = this.agentResults.flatMap(agent => agent.findings || []);
    const allRecommendations = this.agentResults.flatMap(agent => agent.recommendations || []);

    // Generate action items using AI
    const actionItems = await this.generateActionItems(allFindings, allRecommendations);

    // Calculate scores and generate summary
    const overallScore = this.calculateOverallScore();
    const potentialImprovement = this.calculatePotentialImprovement();
    const summary = await this.generateSummary(actionItems, overallScore, potentialImprovement);
    const timeline = this.generateTimeline(actionItems);
    const quickWins = this.extractQuickWins(actionItems);
    const longTermGoals = this.extractLongTermGoals(actionItems);

    return {
      summary,
      overallScore,
      potentialImprovement,
      timeline,
      items: actionItems,
      quickWins,
      longTermGoals,
    };
  }

  private async generateActionItems(findings: string[], recommendations: string[]): Promise<ActionItem[]> {
    const prompt = `
      Create a comprehensive SEO action plan for: ${this.domain}
      
      Business Context:
      - Type: ${this.businessIntel?.businessType}
      - Industry: ${this.businessIntel?.industry}
      - Location: ${this.businessIntel?.location}
      - Current SEO Score: ${this.basicAnalysis?.seoScore}/100
      
      Analysis Findings:
      ${findings.map((finding, i) => `${i + 1}. ${finding}`).join('\n')}
      
      Recommendations:
      ${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
      
      Create 8-12 prioritized action items with EXTREMELY DETAILED step-by-step implementation directions. Each step must be actionable with specific instructions like "go to Google Search Console, click on...", "add this code to your website", "go to Google Maps and do...", etc.
      
      For each action item, provide:
      - Title (clear, specific action)
      - Description (detailed explanation)
      - Priority (critical/high/medium/low)
      - Impact (high/medium/low)
      - Effort (high/medium/low)
      - Category (technical/content/keywords/competitors/user_experience/local_seo)
      - Timeframe (immediate/this_week/this_month/next_quarter)
      - Steps (8-15 VERY DETAILED step-by-step implementation instructions with specific actions like "Go to Google Search Console → Performance → Click on...", "Add this HTML code: <meta name=... ", "Create a new page at yoursite.com/...", "Go to Google My Business and update...", etc.)
      - Tools (specific tools needed)
      - Expected improvement (what improvement to expect)
      - Dependencies (if any action items depend on others)
      
      CRITICAL: Make steps extremely specific and actionable. Include:
      - Exact URLs to visit (google.com/search, search.google.com/search-console, etc.)
      - Specific buttons/links to click
      - Exact code snippets to add
      - Precise file locations to modify
      - Step-by-step navigation instructions
      - Specific form fields to fill out
      - Exact configuration settings to change
      
      Example of detailed steps:
      [
        "Step 1: Go to https://search.google.com/search-console and verify domain ownership",
        "Step 2: Click on 'Performance' in left sidebar → Click 'Pages' tab",
        "Step 3: Identify pages with high impressions but low click-through rates",
        "Step 4: For each underperforming page, click 'View page' → 'Source' to edit HTML",
        "Step 5: Add this meta description code: <meta name='description' content='Your optimized description here'>",
        "Step 6: Update title tag to: <title>Primary Keyword | Business Name - Location</title>",
        "Step 7: Go to Google PageSpeed Insights (pagespeed.web.dev) and test the updated page",
        "Step 8: Fix any Core Web Vitals issues by compressing images using TinyPNG.com"
      ]
      
      Format as JSON array:
      [
        {
          "id": "action_1",
          "title": "Optimize Google My Business for Local SEO Dominance",
          "description": "Complete and optimize Google My Business listing to rank #1 in local search results and Google Maps",
          "priority": "critical",
          "impact": "high", 
          "effort": "medium",
          "category": "local_seo",
          "timeframe": "this_week",
          "steps": [
            "Step 1: Go to business.google.com and sign in with business Google account",
            "Step 2: Search for your business name '${this.domain}' - if not found, click 'Add your business'",
            "Step 3: Fill in exact business address, phone number, and website URL",
            "Step 4: Choose the most specific business category (e.g., 'Nepalese Restaurant' not just 'Restaurant')",
            "Step 5: Upload high-quality photos: storefront, interior, menu items, team (minimum 10 photos)",
            "Step 6: Add business description with local keywords: 'Best ${this.businessIntel?.businessType} in ${this.businessIntel?.location}'",
            "Step 7: Set accurate business hours including holiday hours",
            "Step 8: Add all services offered as separate service listings",
            "Step 9: Create Google Posts weekly with local events, menu updates, special offers",
            "Step 10: Respond to ALL customer reviews within 24 hours",
            "Step 11: Add FAQ section with common customer questions",
            "Step 12: Enable messaging to allow direct customer contact"
          ],
          "tools": ["Google My Business", "Google Posts", "Canva for images"],
          "expectedImprovement": "Appear in Google Maps top 3 results, 40-60% increase in local visibility",
          "dependencies": []
        }
      ]
      
      Return ONLY valid JSON with no additional text.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO strategist. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Clean and parse JSON response
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonStart = cleanResponse.indexOf('[');
      const jsonEnd = cleanResponse.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON array found in AI response');
      }
      
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
      
      const actionItems = JSON.parse(cleanResponse) as ActionItem[];
      
      // Validate and ensure proper structure
      return actionItems.map((item, index) => ({
        id: item.id || `action_${index + 1}`,
        title: item.title || 'Untitled Action',
        description: item.description || 'No description provided',
        priority: ['critical', 'high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        impact: ['high', 'medium', 'low'].includes(item.impact) ? item.impact : 'medium',
        effort: ['high', 'medium', 'low'].includes(item.effort) ? item.effort : 'medium',
        category: ['technical', 'content', 'keywords', 'competitors', 'user_experience', 'local_seo'].includes(item.category) ? item.category : 'technical',
        timeframe: ['immediate', 'this_week', 'this_month', 'next_quarter'].includes(item.timeframe) ? item.timeframe : 'this_week',
        steps: Array.isArray(item.steps) ? item.steps : ['Review and implement this action'],
        tools: Array.isArray(item.tools) ? item.tools : undefined,
        expectedImprovement: item.expectedImprovement || 'Improved SEO performance',
        dependencies: Array.isArray(item.dependencies) ? item.dependencies : undefined,
      })) as ActionItem[];

    } catch (error) {
      console.error('❌ Action plan generation failed:', error);
      
      // Fallback action items based on basic analysis
      return this.generateFallbackActionItems();
    }
  }

  private generateFallbackActionItems(): ActionItem[] {
    const fallbackItems: ActionItem[] = [
      {
        id: 'action_1',
        title: 'Optimize Google My Business for Local SEO Dominance',
        description: 'Complete and optimize Google My Business listing to rank #1 in local search results and Google Maps',
        priority: 'critical',
        impact: 'high',
        effort: 'medium',
        category: 'local_seo',
        timeframe: 'this_week',
        steps: [
          'Step 1: Go to business.google.com and sign in with your business Google account',
          'Step 2: Search for your business name - if not found, click "Add your business to Google"',
          'Step 3: Fill in exact business address, phone number, and website URL (must match website)',
          'Step 4: Choose the most specific business category (e.g., "Nepalese Restaurant" not just "Restaurant")',
          'Step 5: Upload high-quality photos: storefront, interior, menu items, team (minimum 10 photos)',
          'Step 6: Add business description with local keywords: "Best [business type] in [location]"',
          'Step 7: Set accurate business hours including holiday hours and special event times',
          'Step 8: Add all services offered as separate service listings in the Services section',
          'Step 9: Create Google Posts weekly with local events, menu updates, special offers',
          'Step 10: Respond to ALL customer reviews within 24 hours with personalized messages',
          'Step 11: Add FAQ section with common customer questions about location, hours, services',
          'Step 12: Enable messaging to allow direct customer contact through Google'
        ],
        tools: ['Google My Business', 'Google Posts', 'Canva for images', 'Business phone'],
        expectedImprovement: 'Appear in Google Maps top 3 results, 40-60% increase in local visibility',
      },
      {
        id: 'action_2',
        title: 'Implement Page Speed Optimization for Core Web Vitals',
        description: 'Optimize website loading speed to meet Google Core Web Vitals requirements and improve search rankings',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        category: 'technical',
        timeframe: 'this_week',
        steps: [
          'Step 1: Go to pagespeed.web.dev and test your website homepage',
          'Step 2: Go to search.google.com/search-console → Core Web Vitals section',
          'Step 3: Identify pages marked as "Poor" or "Needs Improvement"',
          'Step 4: Download all images from your website and go to tinypng.com',
          'Step 5: Compress each image (aim for under 100KB per image)',
          'Step 6: Replace original images with compressed versions on your website',
          'Step 7: Go to your website hosting control panel → Enable Gzip compression',
          'Step 8: If using WordPress: Install WP Rocket plugin → Enable all speed optimizations',
          'Step 9: If using custom code: Minify CSS/JS files using tools like minifier.org',
          'Step 10: Test again on PageSpeed Insights - aim for 90+ mobile score',
          'Step 11: Go to GTmetrix.com and run speed test → Fix any remaining issues',
          'Step 12: Submit improved pages to Google Search Console for re-indexing'
        ],
        tools: ['Google PageSpeed Insights', 'GTmetrix', 'TinyPNG', 'WP Rocket', 'Google Search Console'],
        expectedImprovement: '15-25 point improvement in PageSpeed scores, better mobile rankings',
      },
      {
        id: 'action_3',
        title: 'Create SEO-Optimized Content for Target Keywords',
        description: 'Develop high-quality content targeting primary keywords to rank #1 in search results',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        category: 'content',
        timeframe: 'this_month',
        steps: [
          'Step 1: Go to search.google.com and search for your main business keywords',
          'Step 2: Analyze top 3 competitors - note their content length, headings, topics covered',
          'Step 3: Go to answerthepublic.com and enter your main keyword for content ideas',
          'Step 4: Create a new page/blog post with URL: yoursite.com/[primary-keyword]',
          'Step 5: Write title tag: "[Primary Keyword] | [Business Name] - [Location]"',
          'Step 6: Add meta description (150-160 chars): Include keyword and call-to-action',
          'Step 7: Structure content with H1 (primary keyword), H2s (related keywords)',
          'Step 8: Write 1500+ words covering: what, why, how, benefits, local relevance',
          'Step 9: Add internal links to 3-5 other relevant pages on your website',
          'Step 10: Include 2-3 high-quality images with alt text containing keywords',
          'Step 11: Add FAQ section answering common customer questions',
          'Step 12: Go to Google Search Console → URL Inspection → Request indexing for new page'
        ],
        tools: ['Google Search', 'AnswerThePublic', 'Google Search Console', 'Yoast SEO', 'Google Keyword Planner'],
        expectedImprovement: 'Rank in top 10 for target keywords, 30-50% increase in organic traffic',
      },
      {
        id: 'action_4',
        title: 'Fix Critical Technical SEO Issues',
        description: 'Address technical issues that prevent Google from properly crawling and ranking your website',
        priority: 'high',
        impact: 'medium',
        effort: 'low',
        category: 'technical',
        timeframe: 'this_week',
        steps: [
          'Step 1: Go to search.google.com/search-console → Coverage section',
          'Step 2: Fix all "Error" pages listed (404s, server errors, redirect loops)',
          'Step 3: Go to search.google.com/search-console → Sitemaps → Submit XML sitemap',
          'Step 4: Check your website code: Add <title> tags to ALL pages',
          'Step 5: Add meta descriptions to ALL pages (unique, 150-160 characters each)',
          'Step 6: Go through your website and add alt text to ALL images',
          'Step 7: Fix any broken internal links (use tools like brokenlinkcheck.com)',
          'Step 8: Ensure your website has SSL certificate (URL starts with https://)',
          'Step 9: Create robots.txt file and upload to yoursite.com/robots.txt',
          'Step 10: Add structured data markup for business information (use schema.org)',
          'Step 11: Go to search.google.com/search-console → Mobile Usability → Fix issues',
          'Step 12: Test website on mobile phone - ensure all buttons/links work'
        ],
        tools: ['Google Search Console', 'Broken Link Checker', 'SSL Certificate Check', 'Schema Markup Generator'],
        expectedImprovement: 'Better crawlability, indexing, and mobile rankings',
      },
      {
        id: 'action_5',
        title: 'Build Local Citations and Business Listings',
        description: 'Create consistent business listings across the web to improve local search authority',
        priority: 'medium',
        impact: 'high',
        effort: 'medium',
        category: 'local_seo',
        timeframe: 'this_month',
        steps: [
          'Step 1: Create accounts on Yelp.com, Facebook Business, TripAdvisor',
          'Step 2: Ensure NAP (Name, Address, Phone) is EXACTLY the same across all platforms',
          'Step 3: Go to moz.com/local/search and find other relevant local directories',
          'Step 4: Submit business to Yellow Pages, Foursquare, and industry-specific directories',
          'Step 5: Create profiles on review sites specific to your industry',
          'Step 6: Add your website URL, business hours, and description to each listing',
          'Step 7: Upload the same business photos across all platforms',
          'Step 8: Set up Google Alerts for your business name to monitor mentions',
          'Step 9: Encourage satisfied customers to leave reviews on these platforms',
          'Step 10: Respond to all reviews (positive and negative) professionally',
          'Step 11: Join local business associations and get listed on their websites',
          'Step 12: Reach out to local news websites and offer to write expert articles'
        ],
        tools: ['Yelp', 'Facebook Business', 'TripAdvisor', 'Yellow Pages', 'Google Alerts', 'Moz Local'],
        expectedImprovement: 'Higher local search rankings, increased online authority, more customer trust',
      }
    ];

    return fallbackItems;
  }

  private calculateOverallScore(): number {
    // Calculate based on current SEO score and agent findings
    let score = this.basicAnalysis?.seoScore || 60;
    
    // Adjust based on agent results
    const completedAgents = this.agentResults.filter(agent => agent.status === 'completed');
    if (completedAgents.length > 0) {
      // Factor in agent-specific scores if available
      completedAgents.forEach(agent => {
        if (agent.data?.technicalScore) {
          score = (score + agent.data.technicalScore) / 2;
        }
        if (agent.data?.contentScore) {
          score = (score + agent.data.contentScore) / 2;
        }
        if (agent.data?.uxScore) {
          score = (score + agent.data.uxScore) / 2;
        }
      });
    }

    return Math.round(Math.max(Math.min(score, 100), 0));
  }

  private calculatePotentialImprovement(): number {
    const currentScore = this.calculateOverallScore();
    
    // Estimate potential improvement based on identified issues
    let potentialGain = 0;
    
    // Technical improvements
    const techAgent = this.agentResults.find(agent => agent.agentType === 'technical_seo');
    if (techAgent?.data?.criticalIssues) {
      potentialGain += techAgent.data.criticalIssues * 5; // 5 points per critical issue
    }
    
    // Content improvements
    const contentAgent = this.agentResults.find(agent => agent.agentType === 'content_analysis');
    if (contentAgent?.data?.keywordCoverage < 10) {
      potentialGain += 15; // Significant keyword opportunity
    }
    
    // UX improvements
    const uxAgent = this.agentResults.find(agent => agent.agentType === 'user_experience');
    if (uxAgent?.data?.mobileOptimization < 70) {
      potentialGain += 20; // Mobile optimization opportunity
    }

    const maxPossibleScore = Math.min(currentScore + potentialGain, 95); // Cap at 95
    return Math.round(maxPossibleScore);
  }

  private async generateSummary(
    actionItems: ActionItem[], 
    overallScore: number, 
    potentialImprovement: number
  ): Promise<string> {
    const criticalItems = actionItems.filter(item => item.priority === 'critical').length;
    const highPriorityItems = actionItems.filter(item => item.priority === 'high').length;
    
    const prompt = `
      Generate a concise executive summary for an SEO action plan:
      
      Domain: ${this.domain}
      Business: ${this.businessIntel?.businessType} in ${this.businessIntel?.industry}
      Current SEO Score: ${overallScore}/100
      Potential Score: ${potentialImprovement}/100
      
      Action Items:
      - ${criticalItems} critical priority items
      - ${highPriorityItems} high priority items
      - ${actionItems.length} total action items
      
      Write a 2-3 sentence summary focusing on the biggest opportunities and expected outcomes.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert writing executive summaries. Be concise and focus on business impact.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || `Your website currently scores ${overallScore}/100 for SEO performance. By implementing the ${actionItems.length} recommended actions, you could potentially reach ${potentialImprovement}/100, significantly improving your search visibility and organic traffic.`;
    } catch (error) {
      console.error('Summary generation failed:', error);
      return `Your website currently scores ${overallScore}/100 for SEO performance. By implementing the ${actionItems.length} recommended actions, you could potentially reach ${potentialImprovement}/100, significantly improving your search visibility and organic traffic.`;
    }
  }

  private generateTimeline(actionItems: ActionItem[]): string {
    const immediateItems = actionItems.filter(item => item.timeframe === 'immediate').length;
    const weekItems = actionItems.filter(item => item.timeframe === 'this_week').length;
    const monthItems = actionItems.filter(item => item.timeframe === 'this_month').length;
    const quarterItems = actionItems.filter(item => item.timeframe === 'next_quarter').length;

    let timeline = '';
    if (immediateItems > 0) timeline += `${immediateItems} immediate actions, `;
    if (weekItems > 0) timeline += `${weekItems} this week, `;
    if (monthItems > 0) timeline += `${monthItems} this month, `;
    if (quarterItems > 0) timeline += `${quarterItems} next quarter`;
    
    return timeline.replace(/, $/, '') || '4-6 weeks for full implementation';
  }

  private extractQuickWins(actionItems: ActionItem[]): string[] {
    return actionItems
      .filter(item => 
        (item.timeframe === 'immediate' || item.timeframe === 'this_week') &&
        item.effort === 'low' &&
        (item.impact === 'high' || item.impact === 'medium')
      )
      .map(item => item.title)
      .slice(0, 5);
  }

  private extractLongTermGoals(actionItems: ActionItem[]): string[] {
    return actionItems
      .filter(item => 
        (item.timeframe === 'this_month' || item.timeframe === 'next_quarter') &&
        item.impact === 'high'
      )
      .map(item => item.title)
      .slice(0, 5);
  }

  // Generate competitive intelligence
  async generateCompetitiveIntelligence(): Promise<ComprehensiveAnalysis['competitiveIntelligence']> {
    const competitorAgent = this.agentResults.find(agent => agent.agentType === 'competitor_intelligence');
    const competitors = this.basicAnalysis?.competitors || [];
    
    try {
      const prompt = `
        Analyze competitive positioning for: ${this.domain}
        
        Business: ${this.businessIntel?.businessType} in ${this.businessIntel?.industry}
        Current SEO Score: ${this.basicAnalysis?.seoScore}/100
        Market Position: Rank ${this.basicAnalysis?.marketPosition?.rank} of ${this.basicAnalysis?.marketPosition?.totalCompetitors}
        
        Competitors:
        ${competitors.map(comp => `- ${comp.name} (Score: ${comp.score})`).join('\n')}
        
        Agent Findings: ${competitorAgent?.findings?.join('; ') || 'None available'}
        
        Provide competitive analysis in this format:
        {
          "marketPosition": "Brief description of current market position",
          "competitiveAdvantages": ["advantage 1", "advantage 2", "advantage 3"],
          "competitiveGaps": ["gap 1", "gap 2", "gap 3"],
          "opportunityAreas": ["opportunity 1", "opportunity 2", "opportunity 3"]
        }
        
        Return only valid JSON.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a competitive intelligence expert. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (aiResponse) {
        const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const competitiveData = JSON.parse(cleanResponse);
        
        return {
          marketPosition: competitiveData.marketPosition || 'Middle tier competitor',
          competitiveAdvantages: competitiveData.competitiveAdvantages || [],
          competitiveGaps: competitiveData.competitiveGaps || [],
          opportunityAreas: competitiveData.opportunityAreas || [],
          benchmarkScores: {
            content: this.calculateBenchmarkScore('content'),
            technical: this.calculateBenchmarkScore('technical'),
            authority: this.calculateBenchmarkScore('authority'),
            userExperience: this.calculateBenchmarkScore('userExperience'),
          },
        };
      }
    } catch (error) {
      console.error('Competitive intelligence generation failed:', error);
    }

    // Fallback competitive intelligence
    return {
      marketPosition: `Positioned as a ${this.businessIntel?.businessType} competitor in the ${this.businessIntel?.industry} space`,
      competitiveAdvantages: ['Unique business positioning', 'Local market presence', 'Specialized services'],
      competitiveGaps: ['SEO optimization needed', 'Digital presence improvement', 'Content strategy enhancement'],
      opportunityAreas: ['Local SEO optimization', 'Content marketing expansion', 'Technical SEO improvements'],
      benchmarkScores: {
        content: this.calculateBenchmarkScore('content'),
        technical: this.calculateBenchmarkScore('technical'),
        authority: this.calculateBenchmarkScore('authority'),
        userExperience: this.calculateBenchmarkScore('userExperience'),
      },
    };
  }

  private calculateBenchmarkScore(category: string): number {
    const baseScore = this.basicAnalysis?.seoScore || 60;
    const competitors = this.basicAnalysis?.competitors || [];
    const avgCompetitorScore = competitors.length > 0 
      ? competitors.reduce((sum, comp) => sum + comp.score, 0) / competitors.length 
      : 75;

    // Adjust based on category and available data
    switch (category) {
      case 'technical':
        return Math.round((this.basicAnalysis?.technicalSeo.score || baseScore) * 0.9);
      case 'content':
        const contentAgent = this.agentResults.find(agent => agent.agentType === 'content_analysis');
        return Math.round(contentAgent?.data?.contentScore || baseScore * 0.85);
      case 'userExperience':
        const uxAgent = this.agentResults.find(agent => agent.agentType === 'user_experience');
        return Math.round(uxAgent?.data?.uxScore || baseScore * 0.8);
      case 'authority':
        // Estimate based on SERP presence and competitive position
        const serpAgent = this.agentResults.find(agent => agent.agentType === 'serp_analysis');
        const serpFeatures = serpAgent?.data?.serpFeatures || 0;
        return Math.round(Math.min(baseScore + (serpFeatures * 5), 90));
      default:
        return Math.round(baseScore);
    }
  }

  // Generate content strategy
  async generateContentStrategy(): Promise<ComprehensiveAnalysis['contentStrategy']> {
    const contentAgent = this.agentResults.find(agent => agent.agentType === 'content_analysis');
    const keywords = this.basicAnalysis?.keywords || [];
    
    try {
      const prompt = `
        Create a content strategy for: ${this.domain}
        
        Business: ${this.businessIntel?.businessType} in ${this.businessIntel?.industry}
        Location: ${this.businessIntel?.location}
        Services: ${this.businessIntel?.services?.join(', ')}
        Current Keywords: ${keywords.map(k => k.keyword).join(', ')}
        
        Content Agent Findings: ${contentAgent?.findings?.join('; ') || 'None available'}
        
        Generate content strategy with:
        1. 5 content gaps to address
        2. 3 topic clusters with keywords
        3. 4-week content calendar
        
        Format as JSON:
        {
          "contentGaps": ["gap 1", "gap 2", ...],
          "topicClusters": [
            {"topic": "cluster name", "keywords": ["kw1", "kw2"], "priority": "high"}
          ],
          "contentCalendar": [
            {"week": "Week 1", "contentType": "Blog Post", "topic": "topic", "targetKeyword": "keyword"}
          ]
        }
        
        Return only valid JSON.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a content strategy expert. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (aiResponse) {
        const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanResponse);
      }
    } catch (error) {
      console.error('Content strategy generation failed:', error);
    }

    // Fallback content strategy
    return {
      contentGaps: [
        'Service pages need optimization',
        'Blog content for target keywords',
        'Local content for geographic targeting',
        'FAQ section for common queries',
        'Case studies and testimonials'
      ],
      topicClusters: [
        {
          topic: `${this.businessIntel?.industry} Services`,
          keywords: this.businessIntel?.services?.slice(0, 3) || ['services', 'solutions'],
          priority: 'high' as const,
        },
        {
          topic: `Local ${this.businessIntel?.businessType}`,
          keywords: [`${this.businessIntel?.location} ${this.businessIntel?.businessType}`, 'local services'],
          priority: 'medium' as const,
        },
      ],
      contentCalendar: [
        { week: 'Week 1', contentType: 'Service Page', topic: 'Core Services Overview', targetKeyword: this.businessIntel?.services?.[0] || 'services' },
        { week: 'Week 2', contentType: 'Blog Post', topic: 'Industry Insights', targetKeyword: `${this.businessIntel?.industry} tips` },
        { week: 'Week 3', contentType: 'FAQ Page', topic: 'Common Questions', targetKeyword: `${this.businessIntel?.businessType} questions` },
        { week: 'Week 4', contentType: 'Case Study', topic: 'Success Stories', targetKeyword: `${this.businessIntel?.businessType} results` },
      ],
    };
  }

  // Generate progress tracking structure
  generateProgressTracking(actionItems: ActionItem[]): ComprehensiveAnalysis['progressTracking'] {
    const milestones = this.generateMilestones(actionItems);
    const kpis = this.generateKPIs();

    return {
      milestones,
      kpis,
    };
  }

  private generateMilestones(actionItems: ActionItem[]): ComprehensiveAnalysis['progressTracking']['milestones'] {
    const now = new Date();
    
    return [
      {
        title: 'Quick Wins Implementation',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week
        status: 'not_started' as const,
        actionItems: actionItems
          .filter(item => item.timeframe === 'immediate' || item.timeframe === 'this_week')
          .map(item => item.id)
          .slice(0, 3),
      },
      {
        title: 'Technical SEO Improvements',
        dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks
        status: 'not_started' as const,
        actionItems: actionItems
          .filter(item => item.category === 'technical')
          .map(item => item.id),
      },
      {
        title: 'Content Strategy Launch',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month
        status: 'not_started' as const,
        actionItems: actionItems
          .filter(item => item.category === 'content')
          .map(item => item.id),
      },
      {
        title: 'Comprehensive SEO Optimization',
        dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months
        status: 'not_started' as const,
        actionItems: actionItems.map(item => item.id),
      },
    ];
  }

  private generateKPIs(): ComprehensiveAnalysis['progressTracking']['kpis'] {
    const currentScore = this.basicAnalysis?.seoScore || 60;
    const currentMobileSpeed = this.basicAnalysis?.pageSpeed?.mobile || 70;
    const currentKeywordCount = this.basicAnalysis?.keywords?.length || 5;

    return [
      {
        metric: 'Overall SEO Score',
        current: currentScore,
        target: Math.min(currentScore + 25, 90),
        timeframe: '3 months',
      },
      {
        metric: 'Mobile Speed Score',
        current: currentMobileSpeed,
        target: Math.min(currentMobileSpeed + 15, 95),
        timeframe: '1 month',
      },
      {
        metric: 'Keyword Rankings (Top 10)',
        current: 0, // Assume starting from scratch
        target: Math.min(currentKeywordCount * 2, 15),
        timeframe: '3 months',
      },
      {
        metric: 'Organic Traffic Increase (%)',
        current: 0,
        target: 50,
        timeframe: '6 months',
      },
      {
        metric: 'Technical SEO Score',
        current: this.basicAnalysis?.technicalSeo.score || 75,
        target: 95,
        timeframe: '2 months',
      },
    ];
  }
}