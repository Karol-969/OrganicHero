import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Users, Target, CheckCircle, AlertCircle, XCircle } from "lucide-react";
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
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analyzing your website...
                  </div>
                  <Progress value={60} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Our AI agents are analyzing SEO, competitors, and market positioning...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {results && (
            <div className="space-y-6 scroll-fade-in" data-testid="analysis-results">
              {/* SEO Score Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    SEO Score & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-2">{results.seoScore}</div>
                      <div className="text-muted-foreground">Overall SEO Score</div>
                      <Progress value={results.seoScore} className="mt-3" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Technical SEO</span>
                        <span className="font-medium">{results.technicalSeo.score >= 80 ? 'Excellent' : results.technicalSeo.score >= 60 ? 'Good' : 'Needs Work'} ({results.technicalSeo.score}/100)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mobile Performance</span>
                        <span className="font-medium">{results.pageSpeed.mobile >= 90 ? 'Excellent' : results.pageSpeed.mobile >= 70 ? 'Good' : 'Poor'} ({results.pageSpeed.mobile}/100)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Desktop Performance</span>
                        <span className="font-medium">{results.pageSpeed.desktop >= 90 ? 'Excellent' : results.pageSpeed.desktop >= 70 ? 'Good' : 'Poor'} ({results.pageSpeed.desktop}/100)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Competitor Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.competitors.map((competitor, index) => {
                      const isUserSite = competitor.name === results.domain;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={isUserSite ? "default" : "secondary"}>#{competitor.ranking}</Badge>
                            <span className={`font-medium ${isUserSite ? 'text-primary' : ''}`}>
                              {competitor.name}
                            </span>
                            {isUserSite && <Badge variant="outline">Your Site</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">Score: {competitor.score}/100</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Market Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Market Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary">#{results.marketPosition.rank}</div>
                      <div className="text-sm text-muted-foreground">Market Ranking</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{results.marketPosition.marketShare}%</div>
                      <div className="text-sm text-muted-foreground">Market Share</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{results.marketPosition.totalCompetitors}</div>
                      <div className="text-sm text-muted-foreground">Total Competitors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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