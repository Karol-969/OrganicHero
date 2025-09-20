import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Save, 
  Plus, 
  Search, 
  Target, 
  BarChart3, 
  Settings, 
  Download,
  Upload,
  Trash2,
  Eye,
  Database,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  MousePointer,
  Workflow,
  GitBranch
} from "lucide-react";

// Google Ads Node Types
export const GOOGLE_ADS_NODE_TYPES = {
  // Authentication & Setup
  CONNECT_ACCOUNT: 'google-ads-connect',
  ACCOUNT_INFO: 'google-ads-account-info',
  
  // Campaign Management
  CREATE_CAMPAIGN: 'google-ads-create-campaign',
  UPDATE_CAMPAIGN: 'google-ads-update-campaign',
  LIST_CAMPAIGNS: 'google-ads-list-campaigns',
  PAUSE_CAMPAIGN: 'google-ads-pause-campaign',
  
  // Ad Group Management
  CREATE_AD_GROUP: 'google-ads-create-ad-group',
  UPDATE_AD_GROUP: 'google-ads-update-ad-group',
  LIST_AD_GROUPS: 'google-ads-list-ad-groups',
  
  // Keyword Management
  KEYWORD_RESEARCH: 'google-ads-keyword-research',
  ADD_KEYWORDS: 'google-ads-add-keywords',
  UPDATE_KEYWORDS: 'google-ads-update-keywords',
  NEGATIVE_KEYWORDS: 'google-ads-negative-keywords',
  
  // Ad Creation & Management
  CREATE_TEXT_AD: 'google-ads-create-text-ad',
  CREATE_RESPONSIVE_AD: 'google-ads-create-responsive-ad',
  UPDATE_ADS: 'google-ads-update-ads',
  
  // Bidding & Budget
  SET_BIDDING_STRATEGY: 'google-ads-set-bidding',
  UPDATE_BUDGETS: 'google-ads-update-budgets',
  BID_ADJUSTMENTS: 'google-ads-bid-adjustments',
  
  // Audience & Targeting
  CREATE_AUDIENCE: 'google-ads-create-audience',
  DEMOGRAPHIC_TARGETING: 'google-ads-demographic-targeting',
  LOCATION_TARGETING: 'google-ads-location-targeting',
  DEVICE_TARGETING: 'google-ads-device-targeting',
  
  // Analytics & Reporting
  PERFORMANCE_REPORT: 'google-ads-performance-report',
  KEYWORD_PERFORMANCE: 'google-ads-keyword-performance',
  AD_PERFORMANCE: 'google-ads-ad-performance',
  CONVERSION_TRACKING: 'google-ads-conversion-tracking',
  
  // Optimization
  QUALITY_SCORE_ANALYSIS: 'google-ads-quality-score',
  SEARCH_TERMS_REPORT: 'google-ads-search-terms',
  AUTOMATED_RULES: 'google-ads-automated-rules',
  
  // Data Processing
  DATA_TRANSFORM: 'data-transform',
  FILTER_DATA: 'filter-data',
  AGGREGATE_DATA: 'aggregate-data',
  EXPORT_DATA: 'export-data',
} as const;

// Node Categories for the palette
export const NODE_CATEGORIES = {
  'Authentication': [
    { type: GOOGLE_ADS_NODE_TYPES.CONNECT_ACCOUNT, label: 'Connect Account', icon: Database, color: 'blue' },
    { type: GOOGLE_ADS_NODE_TYPES.ACCOUNT_INFO, label: 'Account Info', icon: Settings, color: 'blue' },
  ],
  'Campaign Management': [
    { type: GOOGLE_ADS_NODE_TYPES.CREATE_CAMPAIGN, label: 'Create Campaign', icon: Plus, color: 'green' },
    { type: GOOGLE_ADS_NODE_TYPES.UPDATE_CAMPAIGN, label: 'Update Campaign', icon: Settings, color: 'yellow' },
    { type: GOOGLE_ADS_NODE_TYPES.LIST_CAMPAIGNS, label: 'List Campaigns', icon: Eye, color: 'purple' },
    { type: GOOGLE_ADS_NODE_TYPES.PAUSE_CAMPAIGN, label: 'Pause Campaign', icon: Trash2, color: 'red' },
  ],
  'Ad Groups': [
    { type: GOOGLE_ADS_NODE_TYPES.CREATE_AD_GROUP, label: 'Create Ad Group', icon: Plus, color: 'green' },
    { type: GOOGLE_ADS_NODE_TYPES.UPDATE_AD_GROUP, label: 'Update Ad Group', icon: Settings, color: 'yellow' },
    { type: GOOGLE_ADS_NODE_TYPES.LIST_AD_GROUPS, label: 'List Ad Groups', icon: Eye, color: 'purple' },
  ],
  'Keywords': [
    { type: GOOGLE_ADS_NODE_TYPES.KEYWORD_RESEARCH, label: 'Keyword Research', icon: Search, color: 'cyan' },
    { type: GOOGLE_ADS_NODE_TYPES.ADD_KEYWORDS, label: 'Add Keywords', icon: Plus, color: 'green' },
    { type: GOOGLE_ADS_NODE_TYPES.UPDATE_KEYWORDS, label: 'Update Keywords', icon: Settings, color: 'yellow' },
    { type: GOOGLE_ADS_NODE_TYPES.NEGATIVE_KEYWORDS, label: 'Negative Keywords', icon: Trash2, color: 'red' },
  ],
  'Ads': [
    { type: GOOGLE_ADS_NODE_TYPES.CREATE_TEXT_AD, label: 'Create Text Ad', icon: Plus, color: 'green' },
    { type: GOOGLE_ADS_NODE_TYPES.CREATE_RESPONSIVE_AD, label: 'Create Responsive Ad', icon: Plus, color: 'green' },
    { type: GOOGLE_ADS_NODE_TYPES.UPDATE_ADS, label: 'Update Ads', icon: Settings, color: 'yellow' },
  ],
  'Bidding & Budget': [
    { type: GOOGLE_ADS_NODE_TYPES.SET_BIDDING_STRATEGY, label: 'Set Bidding Strategy', icon: Target, color: 'orange' },
    { type: GOOGLE_ADS_NODE_TYPES.UPDATE_BUDGETS, label: 'Update Budgets', icon: DollarSign, color: 'orange' },
    { type: GOOGLE_ADS_NODE_TYPES.BID_ADJUSTMENTS, label: 'Bid Adjustments', icon: TrendingUp, color: 'orange' },
  ],
  'Targeting': [
    { type: GOOGLE_ADS_NODE_TYPES.CREATE_AUDIENCE, label: 'Create Audience', icon: Users, color: 'indigo' },
    { type: GOOGLE_ADS_NODE_TYPES.DEMOGRAPHIC_TARGETING, label: 'Demographics', icon: Users, color: 'indigo' },
    { type: GOOGLE_ADS_NODE_TYPES.LOCATION_TARGETING, label: 'Location Targeting', icon: Target, color: 'indigo' },
    { type: GOOGLE_ADS_NODE_TYPES.DEVICE_TARGETING, label: 'Device Targeting', icon: MousePointer, color: 'indigo' },
  ],
  'Analytics': [
    { type: GOOGLE_ADS_NODE_TYPES.PERFORMANCE_REPORT, label: 'Performance Report', icon: BarChart3, color: 'pink' },
    { type: GOOGLE_ADS_NODE_TYPES.KEYWORD_PERFORMANCE, label: 'Keyword Performance', icon: BarChart3, color: 'pink' },
    { type: GOOGLE_ADS_NODE_TYPES.AD_PERFORMANCE, label: 'Ad Performance', icon: BarChart3, color: 'pink' },
    { type: GOOGLE_ADS_NODE_TYPES.CONVERSION_TRACKING, label: 'Conversion Tracking', icon: Target, color: 'pink' },
  ],
  'Optimization': [
    { type: GOOGLE_ADS_NODE_TYPES.QUALITY_SCORE_ANALYSIS, label: 'Quality Score', icon: TrendingUp, color: 'emerald' },
    { type: GOOGLE_ADS_NODE_TYPES.SEARCH_TERMS_REPORT, label: 'Search Terms', icon: Search, color: 'emerald' },
    { type: GOOGLE_ADS_NODE_TYPES.AUTOMATED_RULES, label: 'Automated Rules', icon: Zap, color: 'emerald' },
  ],
  'Data Processing': [
    { type: GOOGLE_ADS_NODE_TYPES.DATA_TRANSFORM, label: 'Transform Data', icon: GitBranch, color: 'gray' },
    { type: GOOGLE_ADS_NODE_TYPES.FILTER_DATA, label: 'Filter Data', icon: Search, color: 'gray' },
    { type: GOOGLE_ADS_NODE_TYPES.AGGREGATE_DATA, label: 'Aggregate Data', icon: BarChart3, color: 'gray' },
    { type: GOOGLE_ADS_NODE_TYPES.EXPORT_DATA, label: 'Export Data', icon: Download, color: 'gray' },
  ],
};

// Custom Node Component
function GoogleAdsNode({ data, selected }: { data: any; selected: boolean }) {
  const IconComponent = data.icon || Workflow;
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    green: 'border-green-500 bg-green-50 dark:bg-green-950',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
    red: 'border-red-500 bg-red-50 dark:bg-red-950',
    cyan: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
    indigo: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950',
    pink: 'border-pink-500 bg-pink-50 dark:bg-pink-950',
    emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
    gray: 'border-gray-500 bg-gray-50 dark:bg-gray-950',
  };

  return (
    <Card className={`min-w-[200px] transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''} ${colorClasses[data.color as keyof typeof colorClasses] || colorClasses.gray}`} data-testid={`node-${data.type}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md bg-${data.color}-500 text-white`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
        </div>
      </CardHeader>
      {data.showConfig && (
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            Configuration required
          </div>
        </CardContent>
      )}
      {/* Node handles for connections */}
      <div className="absolute -left-2 top-1/2 w-4 h-4 bg-gray-400 rounded-full transform -translate-y-1/2" />
      <div className="absolute -right-2 top-1/2 w-4 h-4 bg-gray-400 rounded-full transform -translate-y-1/2" />
    </Card>
  );
}

// Node types for React Flow
const nodeTypes = {
  googleAdsNode: GoogleAdsNode,
};

// Initial nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function WorkflowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('My Google Ads Workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowConfig(true);
  }, []);

  const addNode = useCallback((nodeType: string, nodeData: any) => {
    const id = `${nodeType}-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'googleAdsNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        ...nodeData,
        type: nodeType,
        showConfig: true,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const runWorkflow = useCallback(() => {
    setIsRunning(true);
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  }, []);

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving workflow:', workflowData);
    // TODO: Implement actual save functionality
  }, [workflowName, nodes, edges]);

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Node Palette */}
      <div className="w-80 border-r bg-card p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2" data-testid="text-workflow-title">Google Ads Operations</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop nodes to build your workflow
          </p>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name"
            className="mb-4"
            data-testid="input-workflow-name"
          />
          <div className="flex gap-2">
            <Button 
              onClick={runWorkflow} 
              disabled={isRunning || nodes.length === 0}
              className="flex-1"
              data-testid="button-run-workflow"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button 
              onClick={saveWorkflow} 
              variant="outline"
              disabled={nodes.length === 0}
              data-testid="button-save-workflow"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="nodes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nodes" data-testid="tab-nodes">Nodes</TabsTrigger>
            <TabsTrigger value="saved" data-testid="tab-saved">Saved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nodes" className="space-y-4">
            {Object.entries(NODE_CATEGORIES).map(([category, categoryNodes]) => (
              <div key={category}>
                <h3 className="font-medium text-sm mb-2 text-muted-foreground">{category}</h3>
                <div className="space-y-2">
                  {categoryNodes.map((nodeConfig) => {
                    const IconComponent = nodeConfig.icon;
                    return (
                      <Button
                        key={nodeConfig.type}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => addNode(nodeConfig.type, nodeConfig)}
                        data-testid={`button-add-${nodeConfig.type}`}
                      >
                        <div className={`p-1 rounded-md bg-${nodeConfig.color}-500 text-white mr-3`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{nodeConfig.label}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="text-center text-muted-foreground py-8">
              <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved workflows yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ready</span>
            </div>
            <div>Nodes: {nodes.length}</div>
            <div>Connections: {edges.length}</div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Node Configuration */}
      {showConfig && selectedNode && (
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Node Configuration</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfig(false)}
                data-testid="button-close-config"
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{selectedNode.data.label}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="node-name">Node Name</Label>
              <Input
                id="node-name"
                value={selectedNode.data.label}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((node) =>
                      node.id === selectedNode.id
                        ? { ...node, data: { ...node.data, label: e.target.value } }
                        : node
                    )
                  );
                }}
                data-testid="input-node-name"
              />
            </div>

            {/* Dynamic configuration based on node type */}
            {selectedNode.data.type === GOOGLE_ADS_NODE_TYPES.CREATE_CAMPAIGN && (
              <div className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input placeholder="Enter campaign name" data-testid="input-campaign-name" />
                </div>
                <div>
                  <Label>Campaign Type</Label>
                  <Select>
                    <SelectTrigger data-testid="select-campaign-type">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="search">Search</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Daily Budget ($)</Label>
                  <Input type="number" placeholder="10.00" data-testid="input-daily-budget" />
                </div>
              </div>
            )}

            {selectedNode.data.type === GOOGLE_ADS_NODE_TYPES.KEYWORD_RESEARCH && (
              <div className="space-y-4">
                <div>
                  <Label>Seed Keywords</Label>
                  <Textarea 
                    placeholder="Enter keywords, one per line"
                    data-testid="textarea-seed-keywords"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g., United States" data-testid="input-location" />
                </div>
                <div>
                  <Label>Language</Label>
                  <Select>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Add more configuration options for other node types */}
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
                setShowConfig(false);
              }}
              data-testid="button-delete-node"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Node
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}