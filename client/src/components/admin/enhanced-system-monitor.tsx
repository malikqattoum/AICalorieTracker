import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiRequest";
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
 
  Network, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Users,
  Bot,
  DollarSign,
  ShieldCheck,
  Gauge,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature: number;
    processes: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    cached: number;
    buffers: number;
  };
  disk: {
    used: number;
    total: number;
    available: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    queryTime: number;
    cacheHitRate: number;
    indexUsage: number;
  };
  application: {
    uptime: number;
    responseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    userSessions: number;
  };
  ai: {
    apiCalls: number;
    successRate: number;
    averageLatency: number;
    costPerHour: number;
    queueLength: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  lastCheck: string;
  responseTime: number;
  dependencies: string[];
  endpoints: {
    name: string;
    url: string;
    status: number;
    responseTime: number;
  }[];
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'error' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  metadata?: any;
}

export default function EnhancedSystemMonitor() {
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [alertFilters, setAlertFilters] = useState({
    type: 'all',
    severity: 'all',
    resolved: 'all'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system metrics with real-time updates
  const { data: systemMetrics, isLoading } = useQuery<SystemMetrics>({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/metrics/detailed');
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 1000,
  });

  // Fetch service status
  const { data: serviceStatus } = useQuery<ServiceStatus[]>({
    queryKey: ['service-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/services/status');
      if (!response.ok) throw new Error('Failed to fetch service status');
      return response.json();
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch system alerts
  const { data: systemAlerts } = useQuery<SystemAlert[]>({
    queryKey: ['system-alerts', alertFilters],
    queryFn: async () => {
      const params = new URLSearchParams(alertFilters as any);
      const response = await fetch(`/api/admin/system/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch system alerts');
      return response.json();
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Fetch system logs
  const { data: systemLogs } = useQuery<LogEntry[]>({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system/logs?limit=100');
      if (!response.ok) throw new Error('Failed to fetch system logs');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Restart service mutation
  const restartServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await apiRequest(`/api/admin/system/services/${serviceName}/restart`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restart service');
      return response.json();
    },
    onSuccess: (data, serviceName) => {
      toast({ title: `Service ${serviceName} restarted successfully` });
      queryClient.invalidateQueries({ queryKey: ['service-status'] });
    },
    onError: (error: Error, serviceName) => {
      toast({ 
        title: `Failed to restart ${serviceName}`, 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest(`/api/admin/system/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Alert resolved successfully" });
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to resolve alert", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      critical: 'text-red-600 bg-red-100',
      offline: 'text-gray-600 bg-gray-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'border-l-green-500 bg-green-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      high: 'border-l-orange-500 bg-orange-50',
      critical: 'border-l-red-500 bg-red-50'
    };
    return colors[severity as keyof typeof colors] || 'border-l-gray-500 bg-gray-50';
  };

  const getLogLevelColor = (level: string) => {
    const colors = {
      debug: 'text-gray-600',
      info: 'text-blue-600',
      warn: 'text-yellow-600',
      error: 'text-red-600',
      fatal: 'text-red-800 font-bold'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Gauge className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Enhanced System Monitor</h2>
            <p className="text-neutral-600">Real-time system performance and health monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          {autoRefresh && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="refresh-interval">Interval (ms)</Label>
              <Input
                id="refresh-interval"
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-20"
                min="1000"
                max="60000"
                step="1000"
              />
            </div>
          )}
          <Button onClick={() => queryClient.invalidateQueries()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {(systemAlerts?.filter(alert => alert.severity === 'critical' && !alert.resolved).length || 0) > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Critical System Alerts:</strong> {(systemAlerts || []).filter(alert => alert.severity === 'critical' && !alert.resolved).length} critical issues require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {systemMetrics && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatUptime(systemMetrics.application.uptime)}</div>
                    <p className="text-xs text-muted-foreground">
                      {systemMetrics.application.uptime > 604800 ? 'Excellent' : 'Good'} uptime
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.application.responseTime}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemMetrics.application.userSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      Current active sessions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Cost/Hour</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${systemMetrics.ai.costPerHour.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Current AI usage cost
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      CPU & Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>CPU Usage</span>
                        <span className="font-medium">{systemMetrics.cpu.usage}%</span>
                      </div>
                      <Progress value={systemMetrics.cpu.usage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{systemMetrics.cpu.cores} cores @ {systemMetrics.cpu.frequency}GHz</span>
                        <span>{systemMetrics.cpu.temperature}°C</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span className="font-medium">
                          {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
                        </span>
                      </div>
                      <Progress 
                        value={(systemMetrics.memory.used / systemMetrics.memory.total) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Available: {formatBytes(systemMetrics.memory.available)}</span>
                        <span>Cached: {formatBytes(systemMetrics.memory.cached)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      Storage & Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Disk Usage</span>
                        <span className="font-medium">
                          {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}
                        </span>
                      </div>
                      <Progress 
                        value={(systemMetrics.disk.used / systemMetrics.disk.total) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Read: {formatBytes(systemMetrics.disk.readSpeed)}/s</span>
                        <span>Write: {formatBytes(systemMetrics.disk.writeSpeed)}/s</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Network Traffic</span>
                        <span className="font-medium">{systemMetrics.network.connections} connections</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          {formatBytes(systemMetrics.network.bytesIn)}/s
                        </span>
                        <span className="flex items-center">
                          <Upload className="h-3 w-3 mr-1" />
                          {formatBytes(systemMetrics.network.bytesOut)}/s
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Database & AI Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="font-medium">{systemMetrics.database.connections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Queries</span>
                      <span className="font-medium">{systemMetrics.database.activeQueries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Query Time</span>
                      <span className="font-medium">{systemMetrics.database.queryTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-medium">{systemMetrics.database.cacheHitRate}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Service Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">API Calls (Last Hour)</span>
                      <span className="font-medium">{systemMetrics.ai.apiCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">{systemMetrics.ai.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Latency</span>
                      <span className="font-medium">{systemMetrics.ai.averageLatency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Queue Length</span>
                      <span className="font-medium">{systemMetrics.ai.queueLength}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceStatus?.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : 
                        service.status === 'warning' ? 'bg-yellow-500' : 
                        service.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uptime: {formatUptime(service.uptime)} • Response: {service.responseTime}ms
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {service.dependencies.map((dep) => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      {service.status !== 'healthy' && (
                        <Button
                          size="sm"
                          onClick={() => restartServiceMutation.mutate(service.name)}
                          disabled={restartServiceMutation.isPending}
                        >
                          Restart
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Alerts
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <select
                    value={alertFilters.severity}
                    onChange={(e) => setAlertFilters({...alertFilters, severity: e.target.value})}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={alertFilters.resolved}
                    onChange={(e) => setAlertFilters({...alertFilters, resolved: e.target.value})}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Alerts</option>
                    <option value="false">Unresolved</option>
                    <option value="true">Resolved</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {systemAlerts?.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{alert.title}</h3>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                            {alert.resolvedBy && (
                              <span> • Resolved by {alert.resolvedBy} at {new Date(alert.resolvedAt!).toLocaleString()}</span>
                            )}
                          </p>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!systemAlerts || systemAlerts.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No system alerts match the current filters.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {systemLogs?.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getLogLevelColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{log.service}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                      {log.metadata && (
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time Trend</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Improving</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate Trend</span>
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Decreasing</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage Trend</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-600">Increasing</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Resource Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="font-medium">{systemMetrics?.cpu.usage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="font-medium">
                      {systemMetrics ? Math.round((systemMetrics.memory.used / systemMetrics.memory.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Disk Usage</span>
                    <span className="font-medium">
                      {systemMetrics ? Math.round((systemMetrics.disk.used / systemMetrics.disk.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}