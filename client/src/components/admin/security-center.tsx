import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Activity, 
  Ban, 
  CheckCircle, 
  XCircle,
  Key,
  Globe,
  Smartphone,
  Clock,
  UserX,
  TrendingUp,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'password_change' | 'admin_action' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: {
    id: string;
    email: string;
    name: string;
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  details: string;
  status: 'resolved' | 'investigating' | 'blocked' | 'pending';
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  failedLogins: number;
  suspiciousActivities: number;
  activeThreats: number;
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  attempts: number;
  isActive: boolean;
}

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch security metrics
  const { data: securityMetrics } = useQuery<SecurityMetrics>({
    queryKey: ['admin-security-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/security/metrics');
      if (!response.ok) throw new Error('Failed to fetch security metrics');
      return response.json();
    },
  });

  // Fetch security events
  const { data: securityEvents, refetch: refetchEvents } = useQuery<SecurityEvent[]>({
    queryKey: ['admin-security-events', selectedSeverity, selectedTimeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        severity: selectedSeverity,
        timeRange: selectedTimeRange
      });
      const response = await fetch(`/api/admin/security/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch security events');
      return response.json();
    },
  });

  // Fetch blocked IPs
  const { data: blockedIPs, refetch: refetchBlockedIPs } = useQuery<BlockedIP[]>({
    queryKey: ['admin-security-blocked-ips'],
    queryFn: async () => {
      const response = await fetch('/api/admin/security/blocked-ips');
      if (!response.ok) throw new Error('Failed to fetch blocked IPs');
      return response.json();
    },
  });

  // Block IP mutation
  const blockIPMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string }) => {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to block IP');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "IP address blocked successfully" });
      refetchBlockedIPs();
    },
    onError: (error: Error) => {
      toast({ title: "Error blocking IP", description: error.message, variant: "destructive" });
    },
  });

  // Unblock IP mutation
  const unblockIPMutation = useMutation({
    mutationFn: async (ipId: string) => {
      const response = await fetch(`/api/admin/security/unblock-ip/${ipId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to unblock IP');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "IP address unblocked successfully" });
      refetchBlockedIPs();
    },
    onError: (error: Error) => {
      toast({ title: "Error unblocking IP", description: error.message, variant: "destructive" });
    },
  });

  // Resolve security event mutation
  const resolveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/admin/security/events/${eventId}/resolve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resolve event');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Security event resolved" });
      refetchEvents();
    },
    onError: (error: Error) => {
      toast({ title: "Error resolving event", description: error.message, variant: "destructive" });
    },
  });

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: <Badge variant="secondary">Low</Badge>,
      medium: <Badge variant="outline">Medium</Badge>,
      high: <Badge className="bg-orange-100 text-orange-800">High</Badge>,
      critical: <Badge variant="destructive">Critical</Badge>,
    };
    return variants[severity as keyof typeof variants] || <Badge>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      resolved: <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>,
      investigating: <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Investigating</Badge>,
      blocked: <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Blocked</Badge>,
      pending: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>,
    };
    return variants[status as keyof typeof variants] || <Badge>{status}</Badge>;
  };

  const getEventIcon = (type: string) => {
    const icons = {
      login_attempt: Activity,
      failed_login: XCircle,
      suspicious_activity: AlertTriangle,
      password_change: Key,
      admin_action: Shield,
      api_abuse: Globe,
    };
    const IconComponent = icons[type as keyof typeof icons] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Security Center</h2>
            <p className="text-neutral-600">Monitor and manage system security</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetchEvents()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{securityMetrics.criticalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.blockedIPs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityMetrics.failedLogins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
              <Eye className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{securityMetrics.suspiciousActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{securityMetrics.activeThreats}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="blocked-ips">Blocked IPs</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Recent Critical Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents?.filter(e => e.severity === 'critical').slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getEventIcon(event.type)}
                        <div>
                          <p className="font-medium text-sm">{event.details}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{event.user.email}</span>
                            <span>•</span>
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {getSeverityBadge(event.severity)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-500" />
                  Recent Blocked IPs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blockedIPs?.filter(ip => ip.isActive).slice(0, 5).map((ip) => (
                    <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{ip.ipAddress}</p>
                        <p className="text-xs text-muted-foreground">{ip.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {ip.attempts} attempts • Blocked {new Date(ip.blockedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockIPMutation.mutate(ip.id)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Security Events</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents?.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{event.details}</p>
                          {getSeverityBadge(event.severity)}
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <UserX className="h-3 w-3 mr-1" />
                            {event.user.email}
                          </span>
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {event.ipAddress}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.location} • {event.userAgent.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {event.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveEventMutation.mutate(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => blockIPMutation.mutate({
                          ipAddress: event.ipAddress,
                          reason: `Security event: ${event.details}`
                        })}
                      >
                        Block IP
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!securityEvents || securityEvents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security events found for the selected criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked-ips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input placeholder="Enter IP address to block..." className="flex-1" />
                  <Input placeholder="Reason..." className="flex-1" />
                  <Button>Block IP</Button>
                </div>

                <div className="space-y-3">
                  {blockedIPs?.map((ip) => (
                    <div key={ip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{ip.ipAddress}</p>
                          <Badge variant={ip.isActive ? "destructive" : "secondary"}>
                            {ip.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ip.reason}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{ip.attempts} attempts</span>
                          <span>Blocked by {ip.blockedBy}</span>
                          <span>{new Date(ip.blockedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {ip.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unblockIPMutation.mutate(ip.id)}
                          >
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => blockIPMutation.mutate({
                              ipAddress: ip.ipAddress,
                              reason: ip.reason
                            })}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-block Suspicious IPs</Label>
                    <p className="text-sm text-muted-foreground">Automatically block IPs with suspicious activity</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">Enable API rate limiting</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Failed Login Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Monitor and alert on failed login attempts</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input type="number" defaultValue="5" />
                </div>

                <div className="space-y-2">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input type="number" defaultValue="15" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send email alerts for security events</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Slack Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Slack channel</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Alert Threshold</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low and above</SelectItem>
                      <SelectItem value="medium">Medium and above</SelectItem>
                      <SelectItem value="high">High and above</SelectItem>
                      <SelectItem value="critical">Critical only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input type="email" placeholder="admin@example.com" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}