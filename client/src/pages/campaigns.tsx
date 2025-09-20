import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignGroupSchema, insertCampaignSchema } from "@shared/schema";
import type { CampaignGroup, Campaign } from "@shared/schema";
import { Plus, FolderPlus, Play, Pause, BarChart3, Settings, Trash2, Lock, User, ExternalLink, CheckCircle, AlertCircle, TrendingUp, Users, DollarSign, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link } from "wouter";

// Enhanced schemas for the forms
const createGroupSchema = insertCampaignGroupSchema.omit({
  userId: true,
}).extend({
  name: z.string().min(1, "Group name is required"),
});

const createCampaignSchema = insertCampaignSchema.extend({
  name: z.string().min(1, "Campaign name is required"),
  objective: z.string().min(1, "Objective is required"),
  budgetType: z.string().min(1, "Budget type is required"),
  platformCredentialId: z.string().min(1, "Platform credential is required"),
});

const connectPlatformSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  accountName: z.string().min(1, "Account name is required"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;
type CreateCampaignForm = z.infer<typeof createCampaignSchema>;
type ConnectPlatformForm = z.infer<typeof connectPlatformSchema>;

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState("platforms");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [connectPlatformOpen, setConnectPlatformOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        try {
          JSON.parse(userData); // Validate userData is valid JSON
          setIsAuthenticated(true);
        } catch {
          // Invalid user data, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Fetch campaign groups - only when authenticated
  const { data: campaignGroups, isLoading: groupsLoading } = useQuery<CampaignGroup[]>({
    queryKey: ['/api/campaigns/me/groups'],
    enabled: isAuthenticated,
    select: (data: any) => data?.data || [],
  });

  // Get user email from localStorage for API calls
  const getUserEmail = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.email;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  // Fetch campaigns for selected group - only when authenticated
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns/me/campaigns', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) {
        throw new Error('Group ID missing');
      }
      const response = await apiRequest('GET', `/api/campaigns/me/campaigns?groupId=${selectedGroupId}`);
      return await response.json();
    },
    enabled: isAuthenticated && !!selectedGroupId,
    select: (data: any) => data?.data || [],
  });

  // Fetch platforms for campaign creation
  const { data: platforms } = useQuery({
    queryKey: ['/api/campaigns/platforms'],
    select: (data: any) => data?.data || [],
  });

  // Fetch user's platform credentials - only when authenticated
  const { data: platformCredentials, isLoading: credentialsLoading } = useQuery<any[]>({
    queryKey: ['/api/campaigns/me/platforms'],
    enabled: isAuthenticated,
    select: (data: any) => data?.data || [],
  });

  // Form handlers
  const groupForm = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      tags: [],
    },
  });

  const campaignForm = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      objective: "awareness",
      status: "draft",
      budgetType: "daily",
      timezone: "UTC",
      tags: [],
      platformCredentialId: "",
    },
  });

  const platformForm = useForm<ConnectPlatformForm>({
    resolver: zodResolver(connectPlatformSchema),
    defaultValues: {
      accountId: "",
      accountName: "",
      accessToken: "",
      refreshToken: "",
    },
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await apiRequest('POST', '/api/campaigns/me/groups', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/me/groups'] });
      setCreateGroupOpen(false);
      groupForm.reset();
      toast({ title: "Success", description: "Campaign group created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create campaign group",
        variant: "destructive" 
      });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CreateCampaignForm) => {
      console.log('🔍 createCampaignMutation.mutationFn called with:', data);
      console.log('🔍 JWT token in localStorage:', localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
      try {
        const response = await apiRequest('POST', '/api/campaigns/me/campaigns', data);
        console.log('🔍 API response received:', response.status, response.statusText);
        return await response.json();
      } catch (error) {
        console.error('❌ API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Campaign creation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', selectedGroupId] });
      setCreateCampaignOpen(false);
      campaignForm.reset();
      toast({ title: "Success", description: "Campaign created successfully" });
    },
    onError: (error: any) => {
      console.error('❌ Campaign creation failed:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create campaign",
        variant: "destructive" 
      });
    },
  });

  const connectPlatformMutation = useMutation({
    mutationFn: async (data: ConnectPlatformForm & { platformId: string }) => {
      const response = await apiRequest('POST', '/api/campaigns/me/platforms', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/me/platforms'] });
      setConnectPlatformOpen(false);
      platformForm.reset();
      setSelectedPlatform(null);
      toast({ title: "Success", description: "Platform connected successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to connect platform",
        variant: "destructive" 
      });
    },
  });

  const disconnectPlatformMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const response = await apiRequest('DELETE', `/api/campaigns/me/platforms/${credentialId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/me/platforms'] });
      toast({ title: "Success", description: "Platform disconnected successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to disconnect platform",
        variant: "destructive" 
      });
    },
  });

  const onCreateGroup = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  const onCreateCampaign = (data: CreateCampaignForm) => {
    console.log('🔍 onCreateCampaign called with data:', data);
    console.log('🔍 selectedGroupId:', selectedGroupId);
    console.log('🔍 createCampaignMutation state:', { isPending: createCampaignMutation.isPending });
    const campaignData = {
      ...data,
      groupId: selectedGroupId,
    };
    console.log('🚀 Making campaign creation request with:', campaignData);
    createCampaignMutation.mutate(campaignData);
  };

  const onConnectPlatform = (data: ConnectPlatformForm) => {
    if (!selectedPlatform) return;
    connectPlatformMutation.mutate({
      ...data,
      platformId: selectedPlatform.id,
    });
  };

  const handleConnectPlatform = (platform: any) => {
    setSelectedPlatform(platform);
    setConnectPlatformOpen(true);
  };

  const handleDisconnectPlatform = (credentialId: string) => {
    disconnectPlatformMutation.mutate(credentialId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatBudget = (budgetAmountCents: number | null, budgetType: string) => {
    if (!budgetAmountCents) return 'No budget set';
    const amount = budgetAmountCents / 100;
    return `$${amount.toFixed(2)} ${budgetType}`;
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-md mx-auto mt-16">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Authentication Required</CardTitle>
                <CardDescription>
                  Please log in to access campaign management features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  You need to be logged in to create and manage campaign groups
                </div>
                <Link href="/auth">
                  <Button className="w-full" data-testid="button-go-to-login">
                    <User className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-campaigns-title">
              Campaign Management
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-campaigns-description">
              Organize and manage your advertising campaigns across platforms
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary" data-testid="button-create-group">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Campaign Group</DialogTitle>
                  <DialogDescription>
                    Campaign groups help organize related campaigns together
                  </DialogDescription>
                </DialogHeader>
                <Form {...groupForm}>
                  <form onSubmit={groupForm.handleSubmit(onCreateGroup)} className="space-y-4">
                    <FormField
                      control={groupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Q1 Brand Awareness" {...field} data-testid="input-group-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={groupForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the purpose of this campaign group..."
                              {...field}
                              value={field.value || ""}
                              data-testid="input-group-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateGroupOpen(false)}
                        data-testid="button-cancel-group"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createGroupMutation.isPending}
                        data-testid="button-submit-group"
                      >
                        {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {selectedGroupId && (
              <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-create-campaign">
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>
                      Create a new advertising campaign in the selected group
                    </DialogDescription>
                  </DialogHeader>
                  {!credentialsLoading && platformCredentials?.length === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <div className="text-yellow-600 dark:text-yellow-400">
                          <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            No Platform Accounts Connected
                          </h3>
                          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                            You need to connect at least one advertising platform account before creating campaigns.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Form {...campaignForm}>
                    <form onSubmit={campaignForm.handleSubmit(onCreateCampaign)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Summer Sale 2024" {...field} data-testid="input-campaign-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="objective"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objective</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-campaign-objective">
                                    <SelectValue placeholder="Select objective" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                                  <SelectItem value="consideration">Consideration</SelectItem>
                                  <SelectItem value="conversion">Conversion</SelectItem>
                                  <SelectItem value="retention">Retention</SelectItem>
                                  <SelectItem value="loyalty">Loyalty</SelectItem>
                                  <SelectItem value="app_install">App Install</SelectItem>
                                  <SelectItem value="lead_generation">Lead Generation</SelectItem>
                                  <SelectItem value="sales">Sales</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={campaignForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your campaign goals and strategy..."
                                {...field}
                                value={field.value || ""}
                                data-testid="input-campaign-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="platformCredentialId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform Account</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-platform-credential">
                                  <SelectValue placeholder="Select platform account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {credentialsLoading ? (
                                  <SelectItem value="" disabled>Loading accounts...</SelectItem>
                                ) : platformCredentials?.length === 0 ? (
                                  <SelectItem value="" disabled>No connected accounts. Connect a platform first.</SelectItem>
                                ) : (
                                  platformCredentials?.map((credential: any) => (
                                    <SelectItem key={credential.id} value={credential.id}>
                                      {credential.accountName || credential.platformName} 
                                      {credential.accountId && ` (${credential.accountId})`}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="budgetType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-budget-type">
                                    <SelectValue placeholder="Select budget type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily Budget</SelectItem>
                                  <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                                  <SelectItem value="monthly">Monthly Budget</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="budgetAmountCents"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Amount ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || "0") * 100))}
                                  value={field.value ? (field.value / 100).toFixed(2) : ""}
                                  data-testid="input-budget-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateCampaignOpen(false)}
                          data-testid="button-cancel-campaign"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            createCampaignMutation.isPending ||
                            credentialsLoading ||
                            !platformCredentials?.length ||
                            !campaignForm.watch('platformCredentialId') ||
                            !campaignForm.watch('name')
                          }
                          onClick={() => {
                            console.log('🔍 Campaign submit button clicked');
                            console.log('🔍 Button disabled state:', {
                              isPending: createCampaignMutation.isPending,
                              credentialsLoading,
                              platformCredentialsLength: platformCredentials?.length,
                              platformCredentialId: campaignForm.watch('platformCredentialId'),
                              name: campaignForm.watch('name'),
                              formErrors: campaignForm.formState.errors,
                              formIsValid: campaignForm.formState.isValid,
                              selectedGroupId: selectedGroupId,
                              allFormData: campaignForm.getValues()
                            });
                            // Force trigger submit to debug
                            setTimeout(() => {
                              console.log('🔍 Attempting to trigger form submission...');
                              campaignForm.handleSubmit(onCreateCampaign)();
                            }, 100);
                          }}
                          data-testid="button-submit-campaign"
                        >
                          {createCampaignMutation.isPending 
                            ? "Creating..." 
                            : !platformCredentials?.length 
                              ? "No Connected Accounts" 
                              : "Create Campaign"
                          }
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-campaigns">
            <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
            <TabsTrigger value="groups" data-testid="tab-groups">Campaign Groups</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="metrics" data-testid="tab-metrics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground" data-testid="text-platforms-title">
                  Advertising Platforms
                </h2>
                <p className="text-muted-foreground mt-1" data-testid="text-platforms-description">
                  Connect your advertising accounts to manage campaigns across platforms
                </p>
              </div>
            </div>

            {/* Connected Platforms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground" data-testid="text-connected-platforms">
                Connected Platforms
              </h3>
              {credentialsLoading ? (
                <div className="text-center py-8" data-testid="loading-credentials">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading connected accounts...</p>
                </div>
              ) : platformCredentials?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-connected-platforms">
                      No Connected Platforms
                    </h3>
                    <p className="text-muted-foreground">
                      Connect your first advertising platform to start creating campaigns
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {platformCredentials?.map((credential: any) => (
                    <Card key={credential.id} data-testid={`card-connected-platform-${credential.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-sm" data-testid={`text-platform-name-${credential.id}`}>
                                {credential.platformDisplayName}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground" data-testid={`text-account-name-${credential.id}`}>
                                {credential.accountName}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Connected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            <p data-testid={`text-account-id-${credential.id}`}>
                              ID: {credential.accountId}
                            </p>
                            <p data-testid={`text-last-sync-${credential.id}`}>
                              {credential.lastSyncAt 
                                ? `Last sync: ${new Date(credential.lastSyncAt).toLocaleDateString()}`
                                : 'Never synced'
                              }
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectPlatform(credential.id)}
                            disabled={disconnectPlatformMutation.isPending}
                            data-testid={`button-disconnect-${credential.id}`}
                          >
                            {disconnectPlatformMutation.isPending ? "Disconnecting..." : "Disconnect"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Available Platforms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground" data-testid="text-available-platforms">
                Available Platforms
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms?.map((platform: any) => {
                  const isConnected = platformCredentials?.some((cred: any) => cred.platformId === platform.id);
                  return (
                    <Card key={platform.id} className="relative" data-testid={`card-platform-${platform.id}`}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <img 
                              src={platform.iconUrl} 
                              alt={platform.displayName}
                              className="w-8 h-8"
                              onError={(e) => {
                                // Fallback to icon based on platform name
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg" data-testid={`text-platform-display-name-${platform.id}`}>
                              {platform.displayName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground" data-testid={`text-platform-version-${platform.id}`}>
                              API {platform.apiVersion}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={isConnected ? "default" : "secondary"}>
                              {isConnected ? "Connected" : "Available"}
                            </Badge>
                            <Badge variant="outline">
                              {platform.supportsOAuth ? "OAuth" : "API Key"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Supported objectives:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {platform.configuration?.supportedObjectives?.slice(0, 3)?.map((objective: string) => (
                                <Badge key={objective} variant="outline" className="text-xs">
                                  {objective.replace('_', ' ')}
                                </Badge>
                              ))}
                              {platform.configuration?.supportedObjectives?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{platform.configuration.supportedObjectives.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleConnectPlatform(platform)}
                              disabled={isConnected || connectPlatformMutation.isPending}
                              data-testid={`button-connect-${platform.id}`}
                            >
                              {isConnected ? "Connected" : "Connect"}
                            </Button>
                            {platform.documentationUrl && (
                              <Button variant="outline" size="icon" asChild>
                                <a 
                                  href={platform.documentationUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  data-testid={`link-docs-${platform.id}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Connect Platform Dialog */}
            <Dialog open={connectPlatformOpen} onOpenChange={setConnectPlatformOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Connect {selectedPlatform?.displayName}</DialogTitle>
                  <DialogDescription>
                    Enter your account credentials to connect this advertising platform
                  </DialogDescription>
                </DialogHeader>
                <Form {...platformForm}>
                  <form onSubmit={platformForm.handleSubmit(onConnectPlatform)} className="space-y-4">
                    <FormField
                      control={platformForm.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 123456789" 
                              {...field} 
                              data-testid="input-account-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={platformForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., My Business Account" 
                              {...field} 
                              data-testid="input-account-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={platformForm.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Token</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your API access token" 
                              {...field} 
                              data-testid="input-access-token"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={platformForm.control}
                      name="refreshToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refresh Token (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter refresh token if available" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-refresh-token"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setConnectPlatformOpen(false);
                          setSelectedPlatform(null);
                          platformForm.reset();
                        }}
                        data-testid="button-cancel-connect"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={connectPlatformMutation.isPending}
                        data-testid="button-submit-connect"
                      >
                        {connectPlatformMutation.isPending ? "Connecting..." : "Connect Platform"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            {groupsLoading ? (
              <div className="text-center py-8" data-testid="loading-groups">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading campaign groups...</p>
              </div>
            ) : campaignGroups?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-no-groups">No Campaign Groups</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first campaign group to organize your advertising campaigns
                  </p>
                  <Button onClick={() => setCreateGroupOpen(true)} data-testid="button-create-first-group">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create Campaign Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaignGroups?.map((group) => (
                  <Card 
                    key={group.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedGroupId === group.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setActiveTab('campaigns');
                    }}
                    data-testid={`card-group-${group.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg" data-testid={`text-group-name-${group.id}`}>
                          {group.name}
                        </CardTitle>
                        <Badge className={getStatusColor(group.status || 'active')} data-testid={`badge-group-status-${group.id}`}>
                          {group.status}
                        </Badge>
                      </div>
                      {group.description && (
                        <CardDescription data-testid={`text-group-description-${group.id}`}>
                          {group.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span data-testid={`text-group-created-${group.id}`}>
                          Created {new Date(group.createdAt!).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" data-testid={`button-group-actions-${group.id}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            {!selectedGroupId ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-select-group">Select a Campaign Group</h3>
                  <p className="text-muted-foreground">
                    Choose a campaign group from the Groups tab to view its campaigns
                  </p>
                </CardContent>
              </Card>
            ) : campaignsLoading ? (
              <div className="text-center py-8" data-testid="loading-campaigns">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading campaigns...</p>
              </div>
            ) : campaigns?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-no-campaigns">No Campaigns</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first campaign in this group
                  </p>
                  <Button onClick={() => setCreateCampaignOpen(true)} data-testid="button-create-first-campaign">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns?.map((campaign) => (
                  <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl" data-testid={`text-campaign-name-${campaign.id}`}>
                            {campaign.name}
                          </CardTitle>
                          {campaign.description && (
                            <CardDescription className="mt-1" data-testid={`text-campaign-description-${campaign.id}`}>
                              {campaign.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(campaign.status)} data-testid={`badge-campaign-status-${campaign.id}`}>
                            {campaign.status}
                          </Badge>
                          <Button variant="ghost" size="sm" data-testid={`button-campaign-actions-${campaign.id}`}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Objective</p>
                          <p className="font-medium capitalize" data-testid={`text-campaign-objective-${campaign.id}`}>
                            {campaign.objective.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium" data-testid={`text-campaign-budget-${campaign.id}`}>
                            {formatBudget(campaign.budgetAmountCents, campaign.budgetType)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium" data-testid={`text-campaign-start-${campaign.id}`}>
                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actions</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" data-testid={`button-campaign-play-${campaign.id}`}>
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`button-campaign-pause-${campaign.id}`}>
                              <Pause className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`button-campaign-analytics-${campaign.id}`}>
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground" data-testid="text-analytics-title">
                  Campaign Analytics
                </h2>
                <p className="text-muted-foreground mt-1" data-testid="text-analytics-description">
                  Monitor performance and optimize your advertising campaigns
                </p>
              </div>
            </div>

            {/* Overview Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-metric-impressions">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-impressions">1,234,567</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12.5%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-metric-clicks">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-clicks">45,678</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+8.2%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-metric-conversions">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-conversions">2,156</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+15.1%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-metric-spend">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-spend">$12,450</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-600">+5.4%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Charts Placeholder */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card data-testid="card-chart-performance">
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>
                    Overview of key metrics over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Performance chart would appear here</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Connect platforms and create campaigns to see data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-chart-spend">
                <CardHeader>
                  <CardTitle>Spend Analysis</CardTitle>
                  <CardDescription>
                    Daily spend breakdown by platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Spend analysis chart would appear here</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Real-time data will sync from connected platforms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Performance Table */}
            <Card data-testid="card-platform-performance">
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>
                  Compare performance across connected advertising platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformCredentials?.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No connected platforms</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect advertising platforms to see performance data
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('platforms')}
                      data-testid="button-go-to-platforms"
                    >
                      Connect Platforms
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                      <div>Platform</div>
                      <div>Impressions</div>
                      <div>Clicks</div>
                      <div>CTR</div>
                      <div>Spend</div>
                      <div>ROAS</div>
                    </div>
                    {platformCredentials?.map((credential: any) => (
                      <div 
                        key={credential.id} 
                        className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-border/50"
                        data-testid={`row-platform-performance-${credential.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="font-medium">{credential.platformDisplayName}</span>
                        </div>
                        <div className="font-mono" data-testid={`text-impressions-${credential.id}`}>
                          {Math.floor(Math.random() * 100000).toLocaleString()}
                        </div>
                        <div className="font-mono" data-testid={`text-clicks-${credential.id}`}>
                          {Math.floor(Math.random() * 5000).toLocaleString()}
                        </div>
                        <div className="font-mono" data-testid={`text-ctr-${credential.id}`}>
                          {(Math.random() * 5 + 1).toFixed(2)}%
                        </div>
                        <div className="font-mono" data-testid={`text-spend-${credential.id}`}>
                          ${Math.floor(Math.random() * 5000).toLocaleString()}
                        </div>
                        <div className="font-mono" data-testid={`text-roas-${credential.id}`}>
                          {(Math.random() * 3 + 1).toFixed(2)}x
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}