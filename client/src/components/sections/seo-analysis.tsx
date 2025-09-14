import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, Users, Target, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface AnalysisResults {
  seoScore: number;
  domain: string;
  competitors: Array<{
    name: string;
    score: number;
    ranking: number;
  }>;
  keywords: Array<{
    keyword: string;
    position: number;
    difficulty: string;
    volume: number;
  }>;
  improvements: Array<{
    title: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    marketShare: number;
  };
}

const sampleResults: AnalysisResults = {
  seoScore: 72,
  domain: "example.com",
  competitors: [
    { name: "competitor1.com", score: 85, ranking: 1 },
    { name: "competitor2.com", score: 78, ranking: 2 },
    { name: "yoursite.com", score: 72, ranking: 3 },
    { name: "competitor3.com", score: 69, ranking: 4 },
  ],
  keywords: [
    { keyword: "digital marketing", position: 8, difficulty: "high", volume: 12000 },
    { keyword: "seo services", position: 15, difficulty: "medium", volume: 8500 },
    { keyword: "website optimization", position: 3, difficulty: "low", volume: 3200 },
  ],
  improvements: [
    {
      title: "Improve Page Load Speed",
      impact: "high",
      description: "Your pages take 4.2s to load. Optimize images and minify CSS/JS to improve Core Web Vitals."
    },
    {
      title: "Add Missing Meta Descriptions", 
      impact: "high",
      description: "23 pages are missing meta descriptions. Add unique, compelling descriptions for each page."
    },
    {
      title: "Build Quality Backlinks",
      impact: "medium", 
      description: "You have 45% fewer backlinks than top competitors. Focus on earning links from industry publications."
    },
    {
      title: "Optimize for Local Search",
      impact: "medium",
      description: "Claim and optimize your Google Business Profile to improve local visibility."
    }
  ],
  marketPosition: {
    rank: 3,
    totalCompetitors: 15,
    marketShare: 12.5
  }
};

export default function SEOAnalysis() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setResults({
        ...sampleResults,
        domain: url.replace(/^https?:\/\//, '').replace(/\/$/, '')
      });
      setIsAnalyzing(false);
    }, 3000);
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
                  disabled={!url || isAnalyzing}
                  className="sm:w-auto"
                  data-testid="analyze-button"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                </Button>
              </div>
              {isAnalyzing && (
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
                        <span className="font-medium">Good (78/100)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Content Quality</span>
                        <span className="font-medium">Excellent (92/100)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Backlink Profile</span>
                        <span className="font-medium">Needs Work (45/100)</span>
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
                    {results.competitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 2 ? "default" : "secondary"}>#{competitor.ranking}</Badge>
                          <span className={`font-medium ${index === 2 ? 'text-primary' : ''}`}>
                            {competitor.name}
                          </span>
                          {index === 2 && <Badge variant="outline">Your Site</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">Score: {competitor.score}/100</div>
                      </div>
                    ))}
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
                  <CardTitle>Top Keywords Performance</CardTitle>
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
                          <div className="font-medium">Position #{keyword.position}</div>
                          <div className="text-muted-foreground">{keyword.volume.toLocaleString()} searches/mo</div>
                        </div>
                      </div>
                    ))}
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