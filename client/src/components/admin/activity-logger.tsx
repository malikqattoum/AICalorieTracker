import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity,
  Clock,
  User,
  Shield,
  Database,
  Server,
  Bot,
  CreditCard,
  Settings,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  MapPin,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  category: 'auth' | 'user' | 'admin' | 'system' | 'payment' | 'ai' | 'security' | 'data';
  description: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata?: {
    [key: string]: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    country: string;
    city: string;
    region: string;
  };
}

interface ActivityStats {
  totalActivities: number;
  activitiesLast24h: number;
  activitiesLast7d: number;
  topActions: { action: string; count: number }[];
  topUsers: { email: string; count: number }[];
  securityEvents: number;
  failedAttempts: number;
  uniqueIPs: number;
}

export default function ActivityLogger() {
  const [activeTab, setActiveTab] = useState("logs");
  const [filters, setFilters] = useState({
    category: 'all',
    severity: 'all',
    success: 'all',
    timeRange: '24h',
    userId: '',
    action: '',
    ipAddress: ''
  });
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  // Fetch activity statistics
  const { data: activityStats } = useQuery<ActivityStats>({
    queryKey: ['admin-activity-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity/stats');
      if (!response.ok) throw new Error('Failed to fetch activity stats');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch activity logs
  const { data: activityLogs, refetch } = useQuery<ActivityLog[]>({
    queryKey: ['admin-activity-logs', filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        search: searchTerm
      } as any);
      const response = await fetch(`/api/admin/activity/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    refetchInterval: 15000,
  });

  // Export logs mutation
  const exportLogsMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const params = new URLSearchParams({
        ...filters,
        search: searchTerm,
        format
      } as any);
      const response = await fetch(`/api/admin/activity/export?${params}`);
      if (!response.ok) throw new Error('Failed to export logs');
      return response.blob();
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: `Activity logs exported as ${format.toUpperCase()}` });
    },
    onError: (error: Error) => {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    },
  });

  const getCategoryIcon = (category: string) => {
    const icons = {
      auth: Shield,
      user: User,
      admin: Settings,
      system: Server,
      payment: CreditCard,
      ai: Bot,
      security: Shield,
      data: Database
    };
    const IconComponent = icons[category as keyof typeof icons] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      payment: 'bg-emerald-100 text-emerald-800',
      ai: 'bg-orange-100 text-orange-800',
      security: 'bg-red-100 text-red-800',
      data: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Activity Logger</h2>
            <p className="text-neutral-600">Comprehensive system activity tracking and audit logs</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => exportLogsMutation.mutate('csv')}
            disabled={exportLogsMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportLogsMutation.mutate('json')}
            disabled={exportLogsMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Activity Statistics */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.totalActivities.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {activityStats.activitiesLast24h} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.securityEvents}</div>
              <p className="text-xs text-muted-foreground">
                {activityStats.failedAttempts} failed attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.uniqueIPs}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityStats.activitiesLast7d}</div>
              <p className="text-xs text-muted-foreground">
                Activities this week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Search and Quick Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="user">User Actions</SelectItem>
                      <SelectItem value="admin">Admin Actions</SelectItem>
                      <SelectItem value="system">System Events</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="ai">AI Operations</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="data">Data Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Success</Label>
                  <Select value={filters.success} onValueChange={(value) => setFilters({...filters, success: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Success</SelectItem>
                      <SelectItem value="false">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Range</Label>
                  <Select value={filters.timeRange} onValueChange={(value) => setFilters({...filters, timeRange: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity Logs</CardTitle>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {activityLogs?.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(log.category)}
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium truncate">{log.action}</h3>
                          <Badge className={getCategoryColor(log.category)}>
                            {log.category}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(log.timestamp)}
                          </span>
                          
                          {log.userEmail && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {log.userEmail}
                            </span>
                          )}
                          
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {log.ipAddress}
                          </span>

                          {log.location && (
                            <span>
                              {log.location.city}, {log.location.country}
                            </span>
                          )}
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Show metadata
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {(!activityLogs || activityLogs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity logs found for the current filters.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityStats?.topActions.map((item, index) => (
                    <div key={item.action} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{item.action}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityStats?.topUsers.map((item, index) => (
                    <div key={item.email} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm truncate">{item.email}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    placeholder="Filter by user ID"
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="action">Action</Label>
                  <Input
                    id="action"
                    placeholder="Filter by action"
                    value={filters.action}
                    onChange={(e) => setFilters({...filters, action: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="Filter by IP address"
                    value={filters.ipAddress}
                    onChange={(e) => setFilters({...filters, ipAddress: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}