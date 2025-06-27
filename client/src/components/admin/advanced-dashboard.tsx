import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Users, 
  DollarSign, 
  Bot, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Brain,
  Zap,
  Database,
  Shield,
  Bell,
  RefreshCw
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    premium: number;
    active: number;
    newToday: number;
    growthRate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    daily: number;
    growthRate: number;
  };
  ai: {
    totalAnalyses: number;
    successRate: number;
    averageResponseTime: number;
    costToday: number;
  };
  system: {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  security: {
    threatsBlocked: number;
    failedLogins: number;
    activeThreats: number;
    lastIncident: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'premium_upgrade' | 'ai_analysis' | 'system_alert' | 'security_event';
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  user?: {
    name: string;
    email: string;
  };
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export default function AdvancedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard stats
  const { data: dashboardStats, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery<RecentActivity[]>({
    queryKey: ['admin-dashboard-activity'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/activity');
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    },
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds
  });

  // Fetch system alerts
  const { data: systemAlerts } = useQuery<SystemAlert[]>({
    queryKey: ['admin-dashboard-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch system alerts');
      return response.json();
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  const getActivityIcon = (type: string) => {
    const icons = {
      user_registration: Users,
      premium_upgrade: DollarSign,
      ai_analysis: Bot,
      system_alert: AlertTriangle,
      security_event: Shield,
    };
    const IconComponent = icons[type as keyof typeof icons] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>
          <p className="text-neutral-600">Real-time system monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <Activity className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {autoRefresh ? 'Live' : 'Manual'}
          </Button>
          <Button onClick={() => refetchStats()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(systemAlerts?.filter(alert => alert.severity === 'critical' && !alert.acknowledged).length || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts Require Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(systemAlerts || [])
                .filter(alert => alert.severity === 'critical' && !alert.acknowledged)
                .map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium text-red-900">{alert.title}</p>
                      <p className="text-sm text-red-700">{alert.message}</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Acknowledge
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Stats Grid */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.users.total.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      {dashboardStats.users.growthRate > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={dashboardStats.users.growthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(dashboardStats.users.growthRate)}%
                      </span>
                    </div>
                    <span>•</span>
                    <span>{dashboardStats.users.newToday} new today</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Premium: {dashboardStats.users.premium}</span>
                      <span>Active: {dashboardStats.users.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardStats.revenue.total.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      {dashboardStats.revenue.growthRate > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={dashboardStats.revenue.growthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(dashboardStats.revenue.growthRate)}%
                      </span>
                    </div>
                    <span>•</span>
                    <span>${dashboardStats.revenue.daily} today</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">
                      Monthly: ${dashboardStats.revenue.monthly.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Performance */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.ai.totalAnalyses.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{dashboardStats.ai.successRate}% success rate</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Avg Response: {dashboardStats.ai.averageResponseTime}ms</span>
                      <span>Cost Today: ${dashboardStats.ai.costToday}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.system.uptime}%</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>System Online</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>CPU: {dashboardStats.system.cpuUsage}%</span>
                      <span>Memory: {dashboardStats.system.memoryUsage}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dashboardStats.system.activeConnections} active connections
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Resources */}
          {dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{dashboardStats.system.cpuUsage}%</span>
                    </div>
                    <Progress 
                      value={dashboardStats.system.cpuUsage} 
                      className={`h-2 ${getUsageColor(dashboardStats.system.cpuUsage)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{dashboardStats.system.memoryUsage}%</span>
                    </div>
                    <Progress 
                      value={dashboardStats.system.memoryUsage} 
                      className={`h-2 ${getUsageColor(dashboardStats.system.memoryUsage)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disk Usage</span>
                      <span>{dashboardStats.system.diskUsage}%</span>
                    </div>
                    <Progress 
                      value={dashboardStats.system.diskUsage} 
                      className={`h-2 ${getUsageColor(dashboardStats.system.diskUsage)}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dashboardStats.security.threatsBlocked}</div>
                      <div className="text-sm text-muted-foreground">Threats Blocked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{dashboardStats.security.failedLogins}</div>
                      <div className="text-sm text-muted-foreground">Failed Logins</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Threats</span>
                    <Badge variant={dashboardStats.security.activeThreats > 0 ? "destructive" : "default"}>
                      {dashboardStats.security.activeThreats}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last incident: {dashboardStats.security.lastIncident}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-medium">{dashboardStats?.ai.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{dashboardStats?.ai.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Cost</span>
                  <span className="font-medium">${dashboardStats?.ai.costToday}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Query Time</span>
                  <span className="font-medium">12ms avg</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections</span>
                  <span className="font-medium">{dashboardStats?.system.activeConnections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Rate</span>
                  <span className="font-medium">94.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="font-medium">{dashboardStats?.system.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time</span>
                  <span className="font-medium">45ms avg</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className="font-medium">0.02%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.user && (
                          <>
                            <span>•</span>
                            <span>{activity.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {activity.severity && (
                      <Badge 
                        variant={activity.severity === 'critical' ? 'destructive' : 'secondary'}
                        className={getSeverityColor(activity.severity)}
                      >
                        {activity.severity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts?.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        className={getSeverityColor(alert.severity)}
                      >
                        {alert.severity}
                      </Badge>
                      {!alert.acknowledged && (
                        <Button variant="outline" size="sm">
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!systemAlerts || systemAlerts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active system alerts. All systems operating normally.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}