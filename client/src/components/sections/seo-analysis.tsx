import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Users, Target, CheckCircle, AlertCircle, XCircle, Globe, MapPin, Eye, Building2, BarChart3, PieChart, Activity, Bot } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, Cell, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SEOAnalysisResult } from "@shared/schema";


export default function SEOAnalysis() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);
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

              {/* CTA */}
              <Card className="text-center bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">Ready to Dominate Your Competition?</h3>
                  <p className="mb-4 opacity-90">Get the full Organic Hero treatment with detailed action plans and ongoing monitoring.</p>
                  <Button variant="secondary" size="lg" data-testid="get-full-analysis">
                    Get Full Analysis & Action Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}