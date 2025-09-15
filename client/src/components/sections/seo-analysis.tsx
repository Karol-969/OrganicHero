import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Users, Target, CheckCircle, AlertCircle, XCircle, Globe, MapPin, Eye, Building2, BarChart3, PieChart, Activity, Bot, Rocket, Star, Clock, Calendar, TrendingDown, ArrowRight, Zap, Crown, Sparkles } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, Cell, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SEOAnalysisResult, ComprehensiveAnalysis } from "@shared/schema";


export default function SEOAnalysis() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);
  const [comprehensiveAnalysisId, setComprehensiveAnalysisId] = useState<string | null>(null);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (urlToAnalyze: string) => {
      const response = await apiRequest('POST', '/api/analyze-seo', { url: urlToAnalyze });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to analyze website');
      }
      return response.json() as Promise<SEOAnalysisResult>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${data.domain}. Your SEO score is ${data.seoScore}/100.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze your website. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Comprehensive Analysis Mutation
  const comprehensiveAnalysisMutation = useMutation({
    mutationFn: async (urlToAnalyze: string) => {
      const response = await apiRequest('POST', '/api/analyze-comprehensive', { url: urlToAnalyze });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to start comprehensive analysis');
      }
      return response.json() as Promise<{ analysisId: string; status: string; message: string }>;
    },
    onSuccess: (data) => {
      setComprehensiveAnalysisId(data.analysisId);
      toast({
        title: "Comprehensive Analysis Started!",
        description: "Your detailed SEO analysis is running. This may take a few minutes to complete.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to start comprehensive analysis. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Progress tracking query for comprehensive analysis
  const { data: comprehensiveProgress } = useQuery({
    queryKey: ['/api/analyze-comprehensive', comprehensiveAnalysisId],
    queryFn: async () => {
      if (!comprehensiveAnalysisId) return null;
      const response = await fetch(`/api/analyze-comprehensive/${comprehensiveAnalysisId}`);
      if (!response.ok) {
        throw new Error('Failed to get analysis progress');
      }
      return response.json() as Promise<ComprehensiveAnalysis>;
    },
    enabled: !!comprehensiveAnalysisId,
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
      if (comprehensiveProgress.status === 'completed') {
        toast({
          title: "Comprehensive Analysis Complete!",
          description: `Your detailed SEO action plan is ready with ${comprehensiveProgress.actionPlan.items.length} recommended actions.`,
        });
      }
    }
  }, [comprehensiveProgress, toast]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    analyzeMutation.mutate(url.trim());
  };

  const handleComprehensiveAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL for comprehensive analysis.",
        variant: "destructive",
      });
      return;
    }
    
    comprehensiveAnalysisMutation.mutate(url.trim());
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <XCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <section id="analysis" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Try Organic Hero Free</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Get instant insights into your website's SEO performance, competitor analysis, and market positioning. Enter your URL to start your free analysis.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* URL Input Form */}
          <Card className="mb-8 scroll-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Enter Your Website URL
              </CardTitle>
              <CardDescription>
                Our AI agents will analyze your website's SEO, research your competitors, and provide actionable insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  data-testid="url-input"
                />
                <Button 
                  onClick={handleAnalyze}
                  disabled={!url || analyzeMutation.isPending}
                  className="sm:w-auto"
                  data-testid="analyze-button"
                >
                  {analyzeMutation.isPending ? "Analyzing..." : "Analyze Now"}
                </Button>
              </div>
              {analyzeMutation.isPending && (
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 text-lg font-semibold text-blue-700 dark:text-blue-300 mb-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 rounded-full h-6 w-6 border-3 border-transparent border-t-blue-400 animate-spin animation-delay-150"></div>
                      </div>
                      AI Analysis in Progress...
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-blue-600">Step 3 of 6</span>
                      </div>
                      
                      <div className="relative">
                        <Progress value={50} className="w-full h-3" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Website Analysis
                        </div>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Speed Testing
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          SEO Scanning
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          Competitor Intel
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          Keyword Research
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          SERP Analysis
                        </div>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                          <Bot className="w-4 h-4 inline mr-2" />
                          Our AI agents are working hard...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Crawling your website, analyzing technical SEO factors, researching competitors, and identifying growth opportunities. This comprehensive analysis takes 3-5 seconds to ensure accuracy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {results && (
            <div className="space-y-6 scroll-fade-in" data-testid="analysis-results">
              {/* SEO Score Overview */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    SEO Score & Performance Dashboard
                  </CardTitle>
                  <CardDescription>Real-time analysis of your website's search engine optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Score with Circular Progress */}
                    <div className="text-center relative">
                      <div className="relative inline-block">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted stroke-current opacity-20"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className="text-blue-600"
                            strokeDasharray={`${(results.seoScore / 100) * 251.2} 251.2`}
                            style={{
                              transition: 'stroke-dasharray 1.5s ease-in-out',
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div>
                            <div className="text-3xl font-bold text-blue-600">{results.seoScore}</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">Overall SEO Performance</div>
                      <div className="mt-2">
                        <Badge variant={results.seoScore >= 80 ? "default" : results.seoScore >= 60 ? "secondary" : "destructive"}>
                          {results.seoScore >= 80 ? 'Excellent' : results.seoScore >= 60 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>

                    {/* Performance Metrics Chart */}
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Performance Breakdown
                      </h4>
                      <ChartContainer
                        config={{
                          score: {
                            label: "Score",
                            color: "hsl(221, 83%, 53%)",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <BarChart
                          data={[
                            { name: "Technical SEO", score: results.technicalSeo.score },
                            { name: "Mobile Performance", score: results.pageSpeed.mobile },
                            { name: "Desktop Performance", score: results.pageSpeed.desktop },
                            { name: "Overall SEO", score: results.seoScore },
                          ]}
                        >
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis domain={[0, 100]} fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{results.technicalSeo.score}</div>
                          <div className="text-xs text-muted-foreground">Technical</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{results.pageSpeed.mobile}</div>
                          <div className="text-xs text-muted-foreground">Mobile</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">{results.pageSpeed.desktop}</div>
                          <div className="text-xs text-muted-foreground">Desktop</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Intelligence */}
              {results.businessIntelligence && (
                <Card data-testid="business-intelligence-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Business Intelligence
                    </CardTitle>
                    <CardDescription>
                      Extracted insights from your website content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Business Type:</span>
                          <span className="ml-2 font-medium">{results.businessIntelligence.businessType}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Industry:</span>
                          <span className="ml-2 font-medium">{results.businessIntelligence.industry}</span>
                        </div>
                        {results.businessIntelligence.location && (
                          <div>
                            <span className="text-sm text-muted-foreground">Location:</span>
                            <span className="ml-2 font-medium">{results.businessIntelligence.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {results.businessIntelligence.products.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-1">Products:</span>
                            <div className="flex flex-wrap gap-1">
                              {results.businessIntelligence.products.slice(0, 4).map((product, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">{product}</Badge>
                              ))}
                              {results.businessIntelligence.products.length > 4 && (
                                <Badge variant="outline" className="text-xs">+{results.businessIntelligence.products.length - 4} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {results.businessIntelligence.services.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-1">Services:</span>
                            <div className="flex flex-wrap gap-1">
                              {results.businessIntelligence.services.slice(0, 4).map((service, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">{service}</Badge>
                              ))}
                              {results.businessIntelligence.services.length > 4 && (
                                <Badge variant="outline" className="text-xs">+{results.businessIntelligence.services.length - 4} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {results.businessIntelligence.description && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground italic">"{results.businessIntelligence.description}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Competitor Analysis */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Competitive Intelligence Dashboard
                  </CardTitle>
                  <CardDescription>AI-powered analysis of your market position and key competitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Competitor Ranking Chart */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        Market Position Analysis
                      </h4>
                      <ChartContainer
                        config={{
                          score: {
                            label: "SEO Score",
                            color: "hsl(142, 76%, 36%)",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <BarChart
                          data={results.competitors.map(comp => ({
                            name: comp.name === results.domain ? "Your Site" : comp.name.length > 15 ? comp.name.substring(0, 15) + "..." : comp.name,
                            score: comp.score,
                            isUserSite: comp.name === results.domain
                          }))}
                          layout="horizontal"
                        >
                          <XAxis domain={[0, 100]} fontSize={12} />
                          <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            labelFormatter={(value, payload) => {
                              const isUserSite = payload?.[0]?.payload?.isUserSite;
                              return isUserSite ? `${value} (Your Site)` : value;
                            }}
                          />
                          <Bar 
                            dataKey="score" 
                            fill="var(--color-score)" 
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => {
                              if (data?.payload?.isUserSite) {
                                // Could add some interaction for user's site
                              }
                            }}
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>

                    {/* Competitor List with Enhanced UI */}
                    <div>
                      <h4 className="font-semibold mb-4">Competitive Landscape</h4>
                      <div className="space-y-3">
                        {results.competitors.map((competitor, index) => {
                          const isUserSite = competitor.name === results.domain;
                          const getScoreColor = (score: number) => {
                            if (score >= 80) return "text-green-600";
                            if (score >= 60) return "text-yellow-600";
                            return "text-red-600";
                          };
                          
                          return (
                            <div key={index} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                              isUserSite 
                                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                                : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                    isUserSite ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    #{competitor.ranking}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-medium ${isUserSite ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                      {competitor.name}
                                    </div>
                                    {isUserSite && (
                                      <Badge variant="outline" className="mt-1 text-xs">Your Website</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${getScoreColor(competitor.score)}`}>
                                    {competitor.score}
                                  </div>
                                  <div className="text-xs text-muted-foreground">SEO Score</div>
                                </div>
                              </div>
                              
                              {/* Progress bar for score */}
                              <div className="mt-3">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                      competitor.score >= 80 ? 'bg-green-500' : 
                                      competitor.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${competitor.score}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Position */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Market Position Analytics
                  </CardTitle>
                  <CardDescription>Your competitive standing in the digital marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Market Share Visualization */}
                    <div className="text-center">
                      <h4 className="font-semibold mb-4 flex items-center justify-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-600" />
                        Market Share Distribution
                      </h4>
                      <ChartContainer
                        config={{
                          yourShare: {
                            label: "Your Market Share",
                            color: "hsl(267, 84%, 64%)",
                          },
                          competitors: {
                            label: "Competitors",
                            color: "hsl(0, 0%, 80%)",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: "Your Market Share", value: results.marketPosition.marketShare, fill: "var(--color-yourShare)" },
                              { name: "Competitors", value: 100 - results.marketPosition.marketShare, fill: "var(--color-competitors)" }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {[
                              { name: "Your Market Share", value: results.marketPosition.marketShare },
                              { name: "Competitors", value: 100 - results.marketPosition.marketShare }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RechartsPieChart>
                      </ChartContainer>
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-purple-600">{results.marketPosition.marketShare}%</div>
                        <div className="text-sm text-muted-foreground">Your Market Share</div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Ranking */}
                        <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">Market Ranking</div>
                              <div className="text-2xl font-bold text-purple-600">#{results.marketPosition.rank}</div>
                            </div>
                            <div className="text-purple-600">
                              <Target className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="h-2 bg-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.max(10, 100 - (results.marketPosition.rank * 10))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Total Competitors */}
                        <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">Total Competitors</div>
                              <div className="text-2xl font-bold text-purple-600">{results.marketPosition.totalCompetitors}</div>
                            </div>
                            <div className="text-purple-600">
                              <Users className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Active competitors in your market segment
                          </div>
                        </div>

                        {/* Opportunity Score */}
                        <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">Growth Opportunity</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {results.marketPosition.marketShare < 30 ? 'High' : 
                                 results.marketPosition.marketShare < 60 ? 'Medium' : 'Saturated'}
                              </div>
                            </div>
                            <div className="text-purple-600">
                              <TrendingUp className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Based on current market share and position
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SERP Presence Analysis */}
              {results.serpPresence && (
                <Card data-testid="serp-presence-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Google SERP Presence Analysis
                    </CardTitle>
                    <CardDescription>
                      Your visibility across Google's search results features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Organic Results</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.organicResults.length > 0 ? (
                              <div>
                                <Badge variant="secondary">#{results.serpPresence.organicResults.filter(r => r.position).map(r => r.position!).reduce((min, pos) => Math.min(min, pos), Infinity)}</Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {results.serpPresence.organicResults.length} result{results.serpPresence.organicResults.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Not found</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="font-medium">Maps/Local</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.mapsResults.found ? (
                              <div>
                                <Badge variant="secondary">Listed</Badge>
                                {results.serpPresence.mapsResults.rating && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ⭐ {results.serpPresence.mapsResults.rating}/5
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline">Not listed</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Images</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.imagesResults.found ? (
                              <Badge variant="secondary">Present ({results.serpPresence.imagesResults.count})</Badge>
                            ) : (
                              <Badge variant="outline">Not found</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Paid Ads</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.paidAds.length > 0 ? (
                              <Badge variant="secondary">{results.serpPresence.paidAds.length} ads</Badge>
                            ) : (
                              <Badge variant="outline">No ads</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">People Also Ask</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.peopleAlsoAsk.questions.length > 0 ? (
                              <div>
                                <Badge variant="secondary">{results.serpPresence.peopleAlsoAsk.questions.length} questions</Badge>
                              </div>
                            ) : (
                              <Badge variant="outline">None found</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium">Featured Snippets</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.featuredSnippets.found ? (
                              <Badge variant="secondary">Featured</Badge>
                            ) : (
                              <Badge variant="outline">Not featured</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-800" />
                            <span className="font-medium">Knowledge Panel</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.knowledgePanel.found ? (
                              <Badge variant="secondary">Present</Badge>
                            ) : (
                              <Badge variant="outline">Not present</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">News & Video</span>
                          </div>
                          <div className="text-right">
                            {results.serpPresence.newsResults.found || results.serpPresence.videoResults.found ? (
                              <div className="flex gap-1">
                                {results.serpPresence.newsResults.found && <Badge variant="secondary" className="text-xs">News</Badge>}
                                {results.serpPresence.videoResults.found && <Badge variant="secondary" className="text-xs">Video</Badge>}
                              </div>
                            ) : (
                              <Badge variant="outline">None</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* People Also Ask questions preview */}
                    {results.serpPresence.peopleAlsoAsk.questions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-sm mb-3">Related Questions:</h4>
                        <div className="space-y-2">
                          {results.serpPresence.peopleAlsoAsk.questions.slice(0, 3).map((question, index) => (
                            <div key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary/30">
                              {question}
                            </div>
                          ))}
                          {results.serpPresence.peopleAlsoAsk.questions.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{results.serpPresence.peopleAlsoAsk.questions.length - 3} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Top Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>Keyword Analysis</CardTitle>
                  <CardDescription>
                    Estimated keyword performance based on domain analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{keyword.keyword}</span>
                          <Badge variant="secondary" className="ml-2">{keyword.difficulty}</Badge>
                        </div>
                        <div className="text-right text-sm">
                          {keyword.position && (
                            <div className="font-medium">Position #{keyword.position}</div>
                          )}
                          <div className="text-muted-foreground">{keyword.volume.toLocaleString()} searches/mo</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Page Speed Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Page Speed Analysis</CardTitle>
                  <CardDescription>
                    Core Web Vitals and performance metrics from Google PageSpeed Insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Performance Scores</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mobile</span>
                          <div className="flex items-center gap-2">
                            <Progress value={results.pageSpeed.mobile} className="w-20" />
                            <span className="font-medium">{results.pageSpeed.mobile}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Desktop</span>
                          <div className="flex items-center gap-2">
                            <Progress value={results.pageSpeed.desktop} className="w-20" />
                            <span className="font-medium">{results.pageSpeed.desktop}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Core Web Vitals</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>First Contentful Paint</span>
                          <span className={results.pageSpeed.firstContentfulPaint > 1.8 ? 'text-red-500' : results.pageSpeed.firstContentfulPaint > 1.0 ? 'text-yellow-500' : 'text-green-500'}>
                            {results.pageSpeed.firstContentfulPaint.toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Largest Contentful Paint</span>
                          <span className={results.pageSpeed.largestContentfulPaint > 2.5 ? 'text-red-500' : results.pageSpeed.largestContentfulPaint > 1.5 ? 'text-yellow-500' : 'text-green-500'}>
                            {results.pageSpeed.largestContentfulPaint.toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cumulative Layout Shift</span>
                          <span className={results.pageSpeed.cumulativeLayoutShift > 0.1 ? 'text-red-500' : results.pageSpeed.cumulativeLayoutShift > 0.05 ? 'text-yellow-500' : 'text-green-500'}>
                            {results.pageSpeed.cumulativeLayoutShift.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority Improvements</CardTitle>
                  <CardDescription>
                    Our AI agents identified these opportunities to boost your rankings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.improvements.map((improvement, index) => (
                      <div key={index} className="flex gap-3 p-4 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getImpactIcon(improvement.impact)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{improvement.title}</h4>
                            <Badge variant={getImpactColor(improvement.impact)}>
                              {improvement.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{improvement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Analysis CTA */}
              <Card className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
                <CardContent className="pt-8 pb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Rocket className="w-6 h-6" />
                    <h3 className="text-2xl font-bold">Ready to Dominate Your Competition?</h3>
                  </div>
                  <p className="mb-6 text-blue-100 text-lg max-w-2xl mx-auto">
                    Get the full Organic Hero treatment with detailed action plans and ongoing monitoring.
                  </p>
                  <Button 
                    onClick={handleComprehensiveAnalyze}
                    disabled={!results || comprehensiveAnalysisMutation.isPending || !!comprehensiveAnalysisId}
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 py-4 h-auto"
                    data-testid="get-full-analysis"
                  >
                    {comprehensiveAnalysisMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        Starting Analysis...
                      </>
                    ) : comprehensiveAnalysisId ? (
                      <>
                        <Activity className="w-5 h-5 mr-2" />
                        Analysis Running...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Get Full Analysis & Action Plan
                      </>
                    )}
                  </Button>
                  {!results && (
                    <p className="mt-4 text-blue-200 text-sm">Run a basic analysis first to unlock comprehensive insights</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comprehensive Analysis Progress */}
          {comprehensiveAnalysisId && comprehensiveResults && (
            <div className="mt-12 scroll-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  🤖 Multi-Agent Analysis in Progress
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our AI agents are working together to provide you with comprehensive SEO insights and a detailed action plan.
                </p>
              </div>

              {/* Progress Card */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Analysis Progress
                  </CardTitle>
                  <CardDescription>
                    {comprehensiveResults.status === 'completed' ? 'Analysis complete!' : 
                     comprehensiveResults.status === 'failed' ? 'Analysis failed' :
                     'Multiple AI agents analyzing your website...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{comprehensiveResults.progress}%</span>
                    </div>
                    <Progress value={comprehensiveResults.progress} className="w-full" />
                    
                    {/* Agent Status */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {comprehensiveResults.agentResults.map((agent, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${
                            agent.status === 'completed' ? 'bg-green-500' :
                            agent.status === 'running' ? 'bg-blue-500 animate-pulse' :
                            agent.status === 'failed' ? 'bg-red-500' :
                            'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">
                              {agent.agentType.replace('_', ' ')} Agent
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.status === 'completed' ? 'Complete' :
                               agent.status === 'running' ? `${agent.progress}%` :
                               agent.status === 'failed' ? 'Failed' :
                               'Pending'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Results */}
              {comprehensiveResults.status === 'completed' && (
                <div className="space-y-8">
                  {/* Action Plan Summary */}
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
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {comprehensiveResults.actionPlan.overallScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Current Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {comprehensiveResults.actionPlan.potentialImprovement}
                          </div>
                          <div className="text-sm text-muted-foreground">Potential Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {comprehensiveResults.actionPlan.items.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Action Items</div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <p className="text-sm leading-relaxed">{comprehensiveResults.actionPlan.summary}</p>
                      </div>

                      {/* Quick Wins */}
                      {comprehensiveResults.actionPlan.quickWins.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Quick Wins (Start Here)
                          </h4>
                          <div className="space-y-2">
                            {comprehensiveResults.actionPlan.quickWins.map((win, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
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
                      <div className="space-y-4">
                        {comprehensiveResults.actionPlan.items.slice(0, 6).map((item, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-lg">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
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
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Impact:</span>
                                <span className={`ml-1 ${
                                  item.impact === 'high' ? 'text-green-600' :
                                  item.impact === 'medium' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`}>
                                  {item.impact}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Effort:</span>
                                <span className={`ml-1 ${
                                  item.effort === 'low' ? 'text-green-600' :
                                  item.effort === 'medium' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {item.effort}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Category:</span>
                                <span className="ml-1 capitalize">{item.category.replace('_', ' ')}</span>
                              </div>
                            </div>

                            {item.steps.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-sm mb-2">Implementation Steps:</h5>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                  {item.steps.map((step, stepIndex) => (
                                    <li key={stepIndex}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Expected Improvement: </span>
                              <span className="text-sm text-blue-600 dark:text-blue-400">{item.expectedImprovement}</span>
                            </div>
                          </div>
                        ))}
                        
                        {comprehensiveResults.actionPlan.items.length > 6 && (
                          <div className="text-center pt-4">
                            <Badge variant="outline">
                              +{comprehensiveResults.actionPlan.items.length - 6} more action items available
                            </Badge>
                          </div>
                        )}
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
                          <h4 className="font-medium mb-3 text-green-600">Competitive Advantages</h4>
                          <div className="space-y-2">
                            {comprehensiveResults.competitiveIntelligence.competitiveAdvantages.map((advantage, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {advantage}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3 text-orange-600">Areas for Improvement</h4>
                          <div className="space-y-2">
                            {comprehensiveResults.competitiveIntelligence.competitiveGaps.map((gap, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                {gap}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Market Position</h4>
                        <p className="text-sm text-muted-foreground">
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
                          <div key={index} className="p-4 border rounded-lg">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}