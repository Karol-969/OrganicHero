import { useState } from "react";
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
import { Plus, FolderPlus, Play, Pause, BarChart3, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Enhanced schemas for the forms
const createGroupSchema = insertCampaignGroupSchema.extend({
  name: z.string().min(1, "Group name is required"),
});

const createCampaignSchema = insertCampaignSchema.extend({
  name: z.string().min(1, "Campaign name is required"),
  objective: z.string().min(1, "Objective is required"),
  budgetType: z.string().min(1, "Budget type is required"),
  platformCredentialId: z.string().min(1, "Platform credential is required"),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;
type CreateCampaignForm = z.infer<typeof createCampaignSchema>;

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const { toast } = useToast();

  // Fetch campaign groups
  const { data: campaignGroups, isLoading: groupsLoading } = useQuery<CampaignGroup[]>({
    queryKey: ['/api/campaigns/me/groups'],
    select: (data: any) => data?.data || [],
  });

  // Fetch campaigns for selected group
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns', selectedGroupId],
    enabled: !!selectedGroupId,
    select: (data: any) => data?.data || [],
  });

  // Fetch platforms for campaign creation
  const { data: platforms } = useQuery({
    queryKey: ['/api/campaigns/platforms'],
    select: (data: any) => data?.data || [],
  });

  // Fetch user's platform credentials
  const { data: platformCredentials, isLoading: credentialsLoading } = useQuery<any[]>({
    queryKey: ['/api/campaigns/me/platforms'],
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
      const response = await apiRequest('POST', '/api/campaigns', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', selectedGroupId] });
      setCreateCampaignOpen(false);
      campaignForm.reset();
      toast({ title: "Success", description: "Campaign created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create campaign",
        variant: "destructive" 
      });
    },
  });

  const onCreateGroup = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  const onCreateCampaign = (data: CreateCampaignForm) => {
    const campaignData = {
      ...data,
      groupId: selectedGroupId,
    };
    createCampaignMutation.mutate(campaignData);
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
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-campaigns">
            <TabsTrigger value="groups" data-testid="tab-groups">Campaign Groups</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
}