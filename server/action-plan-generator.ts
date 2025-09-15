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
      
      Create 8-12 prioritized action items. For each action item, provide:
      - Title (clear, specific action)
      - Description (detailed explanation)
      - Priority (critical/high/medium/low)
      - Impact (high/medium/low)
      - Effort (high/medium/low)
      - Category (technical/content/keywords/competitors/user_experience/local_seo)
      - Timeframe (immediate/this_week/this_month/next_quarter)
      - Steps (3-5 specific steps to implement)
      - Tools (optional tools that can help)
      - Expected improvement (what improvement to expect)
      - Dependencies (if any action items depend on others)
      
      Format as JSON array with this structure:
      [
        {
          "id": "action_1",
          "title": "Improve Mobile Page Speed",
          "description": "Optimize mobile performance to improve user experience and search rankings",
          "priority": "high",
          "impact": "high",
          "effort": "medium",
          "category": "technical",
          "timeframe": "this_week",
          "steps": ["Compress images", "Minify CSS/JS", "Enable compression", "Optimize server response"],
          "tools": ["Google PageSpeed Insights", "GTmetrix", "WebP converters"],
          "expectedImprovement": "10-15 point improvement in mobile speed score",
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
        title: 'Improve Page Speed Performance',
        description: 'Optimize website loading speed for better user experience and search rankings',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        category: 'technical',
        timeframe: 'this_week',
        steps: [
          'Run Google PageSpeed Insights analysis',
          'Compress and optimize images',
          'Minify CSS and JavaScript files',
          'Enable gzip compression'
        ],
        tools: ['Google PageSpeed Insights', 'GTmetrix', 'TinyPNG'],
        expectedImprovement: '10-20 point improvement in speed scores',
      },
      {
        id: 'action_2',
        title: 'Optimize Content for Target Keywords',
        description: 'Improve content relevance and keyword targeting for better rankings',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        category: 'content',
        timeframe: 'this_month',
        steps: [
          'Conduct keyword research for your industry',
          'Update page titles and meta descriptions',
          'Optimize existing content with target keywords',
          'Create new content for high-value keywords'
        ],
        tools: ['Google Keyword Planner', 'SEMrush', 'Ahrefs'],
        expectedImprovement: 'Improved keyword rankings and organic traffic',
      },
      {
        id: 'action_3',
        title: 'Fix Technical SEO Issues',
        description: 'Address technical issues that may be hindering search performance',
        priority: 'medium',
        impact: 'medium',
        effort: 'low',
        category: 'technical',
        timeframe: 'this_week',
        steps: [
          'Check for broken links and fix them',
          'Ensure proper URL structure',
          'Add missing alt tags to images',
          'Improve internal linking structure'
        ],
        tools: ['Google Search Console', 'Screaming Frog', 'Ahrefs'],
        expectedImprovement: 'Better crawlability and indexing',
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