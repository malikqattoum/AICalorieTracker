import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Cpu, 
 
  Wifi,
  RefreshCw
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalMeals: number;
  aiAnalysesCount: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
}

interface ErrorLog {
  id: number;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: number;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  userId?: number;
  action: string;
  details: string;
  ipAddress?: string;
}

export default function SystemMonitorPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Fetch system statistics
  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<SystemStats>({
    queryKey: ['admin-system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/stats');
      if (!response.ok) throw new Error('Failed to fetch system stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch error logs
  const { data: errorLogs, isLoading: logsLoading } = useQuery<ErrorLog[]>({
    queryKey: ['admin-error-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/logs/errors');
      if (!response.ok) throw new Error('Failed to fetch error logs');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch activity logs
  const { data: activityLogs, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/logs/activity');
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetchStats();
    toast({
      title: "Refreshed",
      description: "System statistics updated",
    });
  };

  const getStatusColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 80, critical: 90 }
    };
    
    const threshold = thresholds[type];
    if (value >= threshold.critical) return 'destructive';
    if (value >= threshold.warning) return 'secondary';
    return 'default';
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'info':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">System Monitor</h2>
            <p className="text-neutral-600">Monitor system health and performance</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats?.activeUsers || 0} active today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.aiAnalysesCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total meals analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.systemUptime || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Since last restart
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connections</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.activeConnections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <Badge variant={getStatusColor(systemStats?.cpuUsage || 0, 'cpu')}>
                      {systemStats?.cpuUsage || 0}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${systemStats?.cpuUsage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <Badge variant={getStatusColor(systemStats?.memoryUsage || 0, 'memory')}>
                      {systemStats?.memoryUsage || 0}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${systemStats?.memoryUsage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <Badge variant={getStatusColor(systemStats?.diskUsage || 0, 'disk')}>
                      {systemStats?.diskUsage || 0}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${systemStats?.diskUsage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Average</span>
                    <Badge variant="default">125ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Analysis</span>
                    <Badge variant="secondary">2.3s</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Query</span>
                    <Badge variant="default">45ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak CPU Today</span>
                    <Badge variant="secondary">87%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak Memory</span>
                    <Badge variant="secondary">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network I/O</span>
                    <Badge variant="default">Normal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                        <TableCell className="max-w-md truncate">{log.message}</TableCell>
                        <TableCell>{log.userId || 'System'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.userId || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{log.details}</TableCell>
                        <TableCell className="text-sm">{log.ipAddress || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}