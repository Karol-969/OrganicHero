import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Target, CheckCircle, Users, BarChart3, Zap, Star, TrendingDown, ArrowRight, Activity, Sparkles, Rocket, ExternalLink, Shield, Globe, Search, FileText, Smartphone, Clock, Award, AlertTriangle, Info, TrendingUp, Download, Eye, ChevronDown, ChevronUp, Settings, Monitor, MessageSquare, Key, Layout, Palette, RotateCcw } from 'lucide-react';
import type { SEOAnalysisResult, ComprehensiveAnalysis } from '@shared/schema';

export default function AnalysisPage() {
  const params = useParams<{ analysisId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [basicResults, setBasicResults] = useState<SEOAnalysisResult | null>(null);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveAnalysis | null>(null);
  const [analysisUrl, setAnalysisUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'dashboard'>('overview');
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

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

  const toggleAgentExpansion = (agentType: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agentType)) {
      newExpanded.delete(agentType);
    } else {
      newExpanded.add(agentType);
    }
    setExpandedAgents(newExpanded);
  };

  const downloadAnalysisReport = () => {
    if (!comprehensiveResults) return;
    
    const reportData = {
      domain: formatDomain(analysisUrl),
      analysisDate: new Date().toISOString(),
      overallScore: basicResults?.seoScore,
      potentialScore: comprehensiveResults.actionPlan.potentialImprovement,
      agentResults: comprehensiveResults.agentResults,
      actionPlan: comprehensiveResults.actionPlan,
      competitiveIntelligence: comprehensiveResults.competitiveIntelligence,
      progressTracking: comprehensiveResults.progressTracking
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-analysis-${formatDomain(analysisUrl)}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded! 📄",
      description: "Your comprehensive SEO analysis report has been downloaded.",
    });
  };

  const downloadAgentData = (agentType: string) => {
    if (!comprehensiveResults) return;
    
    const agent = comprehensiveResults.agentResults.find(a => a.agentType === agentType);
    if (!agent) return;
    
    const agentData = {
      agent: agentType,
      domain: formatDomain(analysisUrl),
      analysisDate: new Date().toISOString(),
      status: agent.status,
      findings: agent.findings,
      recommendations: agent.recommendations,
      data: agent.data
    };
    
    const blob = new Blob([JSON.stringify(agentData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentType}-analysis-${formatDomain(analysisUrl)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Agent Data Downloaded! 📊",
      description: `${agentType.replace('_', ' ')} agent analysis data has been downloaded.`,
    });
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'technical_seo': return <Settings className="w-5 h-5" />;
      case 'content_analysis': return <FileText className="w-5 h-5" />;
      case 'competitor_intelligence': return <Users className="w-5 h-5" />;
      case 'keyword_research': return <Key className="w-5 h-5" />;
      case 'serp_analysis': return <Search className="w-5 h-5" />;
      case 'user_experience': return <Palette className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'technical_seo': return 'from-blue-500 to-indigo-600';
      case 'content_analysis': return 'from-green-500 to-emerald-600';
      case 'competitor_intelligence': return 'from-purple-500 to-violet-600';
      case 'keyword_research': return 'from-orange-500 to-red-600';
      case 'serp_analysis': return 'from-pink-500 to-rose-600';
      case 'user_experience': return 'from-teal-500 to-cyan-600';
      default: return 'from-gray-500 to-slate-600';
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
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" />
                      Analysis Progress
                      {comprehensiveResults.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    {comprehensiveResults.status === 'completed' && (
                      <Button
                        onClick={downloadAnalysisReport}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid="button-download-report"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </Button>
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

              {/* Tab Navigation */}
              {comprehensiveResults.status === 'completed' && (
                <div className="mb-8">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      data-testid="tab-overview"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Overview & Action Plan
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('agents')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'agents'
                          ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      data-testid="tab-agents"
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Agent Analysis Details
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'dashboard'
                          ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      data-testid="tab-dashboard"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Comprehensive Dashboard
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              {comprehensiveResults.status === 'completed' && (
                <div className="space-y-8">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
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
                    </>
                  )}

                  {/* Agent Details Tab */}
                  {activeTab === 'agents' && (
                    <div className="space-y-6">
                      {comprehensiveResults.agentResults.map((agent, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader 
                            className={`bg-gradient-to-r ${getAgentColor(agent.agentType)} text-white cursor-pointer transition-all hover:shadow-lg`}
                            onClick={() => toggleAgentExpansion(agent.agentType)}
                          >
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getAgentIcon(agent.agentType)}
                                <div>
                                  <h3 className="text-xl font-bold capitalize">
                                    {agent.agentType.replace('_', ' ')} Agent
                                  </h3>
                                  <p className="text-white/90 text-sm font-normal">
                                    {agent.findings.length} findings • {agent.recommendations.length} recommendations
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadAgentData(agent.agentType);
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                  data-testid={`button-download-${agent.agentType}`}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                {expandedAgents.has(agent.agentType) ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          
                          {expandedAgents.has(agent.agentType) && (
                            <CardContent className="p-6">
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Findings */}
                                <div>
                                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    Key Findings
                                  </h4>
                                  <div className="space-y-3">
                                    {agent.findings.map((finding, findingIndex) => (
                                      <div key={findingIndex} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                                        <p className="text-sm leading-relaxed">{finding}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Recommendations */}
                                <div>
                                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-green-500" />
                                    Recommendations
                                  </h4>
                                  <div className="space-y-3">
                                    {agent.recommendations.map((recommendation, recIndex) => (
                                      <div key={recIndex} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                                        <p className="text-sm leading-relaxed">{recommendation}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Additional Data */}
                              {agent.data && Object.keys(agent.data).length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-purple-500" />
                                    Analysis Data
                                  </h4>
                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(agent.data).map(([key, value], dataIndex) => (
                                      <div key={dataIndex} className="bg-white dark:bg-gray-700 p-3 rounded border">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                        <div className="text-sm font-medium mt-1">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Dashboard Tab */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                      {/* Executive Summary */}
                      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <Award className="w-6 h-6" />
                            Executive Dashboard
                          </CardTitle>
                          <CardDescription className="text-indigo-600 dark:text-indigo-400">
                            Comprehensive overview of your SEO performance and opportunities
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                {basicResults?.seoScore || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">Current SEO Score</div>
                              <div className="text-xs text-green-600 mt-1">
                                +{comprehensiveResults.actionPlan.potentialImprovement - (basicResults?.seoScore || 0)} potential
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                {comprehensiveResults.agentResults.filter(a => a.status === 'completed').length}
                              </div>
                              <div className="text-sm text-muted-foreground">Agents Completed</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {comprehensiveResults.agentResults.reduce((sum, a) => sum + a.findings.length, 0)} total findings
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                {comprehensiveResults.actionPlan.quickWins.length}
                              </div>
                              <div className="text-sm text-muted-foreground">Quick Wins</div>
                              <div className="text-xs text-purple-600 mt-1">
                                {comprehensiveResults.actionPlan.items.filter(i => i.priority === 'high').length} high priority
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                {comprehensiveResults.actionPlan.items.length}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Actions</div>
                              <div className="text-xs text-red-600 mt-1">
                                {comprehensiveResults.actionPlan.items.filter(i => i.priority === 'critical').length} critical
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Agent Performance Grid */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            Agent Performance Overview
                          </CardTitle>
                          <CardDescription>
                            Detailed breakdown of what each AI agent discovered
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {comprehensiveResults.agentResults.map((agent, index) => (
                              <div key={index} className={`p-4 rounded-lg bg-gradient-to-br ${getAgentColor(agent.agentType)} text-white`}>
                                <div className="flex items-center gap-3 mb-3">
                                  {getAgentIcon(agent.agentType)}
                                  <h4 className="font-semibold capitalize">
                                    {agent.agentType.replace('_', ' ')}
                                  </h4>
                                </div>
                                <div className="space-y-2 text-white/90 text-sm">
                                  <div className="flex justify-between">
                                    <span>Findings:</span>
                                    <span className="font-bold">{agent.findings.length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Recommendations:</span>
                                    <span className="font-bold">{agent.recommendations.length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Status:</span>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                      {agent.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Priority Matrix */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Implementation Priority Matrix
                          </CardTitle>
                          <CardDescription>
                            Strategic roadmap for implementing SEO improvements
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Critical Priority
                              </h4>
                              <div className="space-y-2">
                                {comprehensiveResults.actionPlan.items
                                  .filter(item => item.priority === 'critical')
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                                      <div className="font-medium text-sm">{item.title}</div>
                                      <div className="text-xs text-muted-foreground">{item.category.replace('_', ' ')}</div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                High Priority
                              </h4>
                              <div className="space-y-2">
                                {comprehensiveResults.actionPlan.items
                                  .filter(item => item.priority === 'high')
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded border-l-4 border-orange-500">
                                      <div className="font-medium text-sm">{item.title}</div>
                                      <div className="text-xs text-muted-foreground">{item.category.replace('_', ' ')}</div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Medium Priority
                              </h4>
                              <div className="space-y-2">
                                {comprehensiveResults.actionPlan.items
                                  .filter(item => item.priority === 'medium')
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                                      <div className="font-medium text-sm">{item.title}</div>
                                      <div className="text-xs text-muted-foreground">{item.category.replace('_', ' ')}</div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Competitive Intelligence Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Competitive Position Summary
                          </CardTitle>
                          <CardDescription>
                            How you stack up against competitors and market opportunities
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-3 text-green-600 flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Your Advantages ({comprehensiveResults.competitiveIntelligence.competitiveAdvantages.length})
                              </h4>
                              <div className="space-y-2">
                                {comprehensiveResults.competitiveIntelligence.competitiveAdvantages.slice(0, 3).map((advantage, index) => (
                                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {advantage}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-3 text-orange-600 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                Improvement Areas ({comprehensiveResults.competitiveIntelligence.competitiveGaps.length})
                              </h4>
                              <div className="space-y-2">
                                {comprehensiveResults.competitiveIntelligence.competitiveGaps.slice(0, 3).map((gap, index) => (
                                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    {gap}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-300">Market Position</h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400 leading-relaxed">
                              {comprehensiveResults.competitiveIntelligence.marketPosition}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Action Summary CTA */}
                      <Card className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
                        <CardContent className="pt-8 pb-8">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Rocket className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">Ready to Dominate Search Rankings?</h3>
                          </div>
                          <p className="mb-6 text-blue-100 text-lg max-w-2xl mx-auto">
                            Your comprehensive SEO analysis is complete with {comprehensiveResults.agentResults.reduce((sum, a) => sum + a.findings.length, 0)} findings and {comprehensiveResults.actionPlan.items.length} actionable recommendations.
                          </p>
                          <div className="flex gap-4 justify-center flex-wrap">
                            <Button 
                              onClick={downloadAnalysisReport}
                              size="lg" 
                              className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
                              data-testid="button-download-dashboard-report"
                            >
                              <Download className="w-5 h-5 mr-2" />
                              Download Full Report
                            </Button>
                            <Button 
                              onClick={goBackHome}
                              size="lg" 
                              className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
                              data-testid="button-new-analysis-dashboard"
                            >
                              <Search className="w-5 h-5 mr-2" />
                              Analyze Another Site
                            </Button>
                            <Button 
                              variant="outline"
                              size="lg" 
                              className="border-white text-white hover:bg-white hover:text-blue-600 font-bold"
                              onClick={() => window.print()}
                              data-testid="button-print-dashboard"
                            >
                              <FileText className="w-5 h-5 mr-2" />
                              Print Report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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