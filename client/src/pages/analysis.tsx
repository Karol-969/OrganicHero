import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Target, CheckCircle, Users, BarChart3, Zap, Star, TrendingDown, ArrowRight, Activity, Sparkles, Rocket, ExternalLink, Shield, Globe, Search, FileText, Smartphone, Clock, Award, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import type { SEOAnalysisResult, ComprehensiveAnalysis } from '@shared/schema';

export default function AnalysisPage() {
  const params = useParams<{ analysisId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [basicResults, setBasicResults] = useState<SEOAnalysisResult | null>(null);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveAnalysis | null>(null);
  const [analysisUrl, setAnalysisUrl] = useState<string>('');

  // Extract URL from localStorage if available
  useEffect(() => {
    const storedUrl = localStorage.getItem('currentAnalysisUrl');
    if (storedUrl) {
      setAnalysisUrl(storedUrl);
    }
  }, []);

  // Progress tracking query for comprehensive analysis
  const { data: comprehensiveProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/analyze-comprehensive', params.analysisId],
    queryFn: async () => {
      if (!params.analysisId) return null;
      const response = await fetch(`/api/analyze-comprehensive/${params.analysisId}`);
      if (!response.ok) {
        throw new Error('Failed to get analysis progress');
      }
      return response.json() as Promise<ComprehensiveAnalysis>;
    },
    enabled: !!params.analysisId,
    refetchInterval: (query) => {
      // Stop polling when analysis is complete or failed
      const data = query?.state?.data;
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Update comprehensive results when progress changes
  useEffect(() => {
    if (comprehensiveProgress) {
      setComprehensiveResults(comprehensiveProgress);
      if (comprehensiveProgress.basicAnalysis) {
        setBasicResults(comprehensiveProgress.basicAnalysis);
      }
      
      if (comprehensiveProgress.status === 'completed') {
        toast({
          title: "Analysis Complete! 🎉",
          description: `Your comprehensive SEO analysis is ready with ${comprehensiveProgress.actionPlan.items.length} actionable recommendations.`,
        });
      } else if (comprehensiveProgress.status === 'failed') {
        toast({
          title: "Analysis Failed",
          description: "There was an issue with your analysis. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [comprehensiveProgress, toast]);

  const goBackHome = () => {
    localStorage.removeItem('currentAnalysisUrl');
    setLocation('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'medium': return <BarChart3 className="w-5 h-5 text-yellow-500" />;
      case 'low': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (isLoadingProgress && !comprehensiveResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={goBackHome}
              className="mb-6"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Loading Analysis...</h2>
              <p className="text-muted-foreground">Preparing your comprehensive SEO analysis</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={goBackHome}
              className="flex items-center gap-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            
            {analysisUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                Analyzing: <span className="font-medium">{formatDomain(analysisUrl)}</span>
              </div>
            )}
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Multi-Agent SEO Analysis
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI agents are conducting the most comprehensive SEO analysis on the web, 
              analyzing every aspect of your website to dominate search rankings.
            </p>
          </div>

          {comprehensiveResults ? (
            <>
              {/* Progress Card */}
              <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Analysis Progress
                    {comprehensiveResults.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {comprehensiveResults.status === 'completed' 
                      ? 'Your comprehensive analysis is complete! Review the insights below.' 
                      : comprehensiveResults.status === 'failed' 
                      ? 'Analysis encountered an issue' 
                      : 'Multiple AI agents are analyzing your website...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{comprehensiveResults.progress}%</span>
                    </div>
                    <Progress value={comprehensiveResults.progress} className="w-full h-3" />
                    
                    {/* Agent Status Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {comprehensiveResults.agentResults.map((agent, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">
                              {agent.agentType.replace('_', ' ')} Agent
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.status === 'completed' ? 'Analysis Complete' :
                               agent.status === 'running' ? `${agent.progress}% Complete` :
                               agent.status === 'failed' ? 'Failed' :
                               'Waiting to Start'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              {comprehensiveResults.status === 'completed' && (
                <div className="space-y-8">
                  {/* Overall Score Summary */}
                  {basicResults && (
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <Award className="w-5 h-5" />
                          SEO Score Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-4 gap-6 text-center">
                          <div>
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                              {basicResults.seoScore}
                            </div>
                            <div className="text-sm text-muted-foreground">Overall SEO Score</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {comprehensiveResults.actionPlan.potentialImprovement}
                            </div>
                            <div className="text-sm text-muted-foreground">Potential Score</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                              {comprehensiveResults.actionPlan.items.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Action Items</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                              {comprehensiveResults.actionPlan.quickWins.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Quick Wins</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Plan */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Target className="w-5 h-5" />
                        Your SEO Action Plan
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Comprehensive strategy to improve your search rankings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
                        <p className="text-sm leading-relaxed">{comprehensiveResults.actionPlan.summary}</p>
                      </div>

                      {/* Quick Wins */}
                      {comprehensiveResults.actionPlan.quickWins.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Quick Wins (Start Here)
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {comprehensiveResults.actionPlan.quickWins.map((win, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {win}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Detailed Action Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Detailed Action Items
                      </CardTitle>
                      <CardDescription>
                        Prioritized recommendations with step-by-step implementation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {comprehensiveResults.actionPlan.items.map((item, index) => (
                          <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Badge variant={item.priority === 'critical' ? 'destructive' : 
                                              item.priority === 'high' ? 'default' : 'secondary'}>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {item.timeframe.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Impact:</span>
                                <Badge variant={item.impact === 'high' ? 'default' : 'secondary'} className={
                                  item.impact === 'high' ? 'bg-green-100 text-green-700' :
                                  item.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }>
                                  {item.impact}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Effort:</span>
                                <Badge variant="outline" className={
                                  item.effort === 'low' ? 'border-green-300 text-green-600' :
                                  item.effort === 'medium' ? 'border-yellow-300 text-yellow-600' :
                                  'border-red-300 text-red-600'
                                }>
                                  {item.effort}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Category:</span>
                                <span className="capitalize">{item.category.replace('_', ' ')}</span>
                              </div>
                            </div>

                            {item.steps.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-medium text-sm mb-2">Implementation Steps:</h5>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                  {item.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="leading-relaxed">{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Expected Improvement: </span>
                              <span className="text-sm text-blue-600 dark:text-blue-400">{item.expectedImprovement}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competitive Intelligence */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Competitive Intelligence
                      </CardTitle>
                      <CardDescription>
                        How you stack up against competitors and opportunities to gain advantage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 text-green-600 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Competitive Advantages
                          </h4>
                          <div className="space-y-3">
                            {comprehensiveResults.competitiveIntelligence.competitiveAdvantages.map((advantage, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {advantage}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3 text-orange-600 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Areas for Improvement
                          </h4>
                          <div className="space-y-3">
                            {comprehensiveResults.competitiveIntelligence.competitiveGaps.map((gap, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                {gap}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Market Position Analysis</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {comprehensiveResults.competitiveIntelligence.marketPosition}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Success Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Success Metrics & Timeline
                      </CardTitle>
                      <CardDescription>
                        Track your progress with these key performance indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {comprehensiveResults.progressTracking.kpis.map((kpi, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                            <h5 className="font-medium text-sm mb-2">{kpi.metric}</h5>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl font-bold">{kpi.current}</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <span className="text-2xl font-bold text-green-600">{kpi.target}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{kpi.timeframe}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Call to Action */}
                  <Card className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
                    <CardContent className="pt-8 pb-8">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Rocket className="w-6 h-6" />
                        <h3 className="text-2xl font-bold">Ready to Implement Your Strategy?</h3>
                      </div>
                      <p className="mb-6 text-blue-100 text-lg max-w-2xl mx-auto">
                        Your comprehensive SEO analysis is complete. Start implementing these recommendations to dominate search rankings.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button 
                          onClick={goBackHome}
                          size="lg" 
                          className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
                          data-testid="button-new-analysis"
                        >
                          <Search className="w-5 h-5 mr-2" />
                          Analyze Another Site
                        </Button>
                        <Button 
                          variant="outline"
                          size="lg" 
                          className="border-white text-white hover:bg-white hover:text-blue-600 font-bold"
                          onClick={() => window.print()}
                          data-testid="button-print-report"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Print Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Initializing Analysis...</h2>
              <p className="text-muted-foreground">Setting up your comprehensive SEO analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}