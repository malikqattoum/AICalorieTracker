import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiRequest";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Zap
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  channels: ('email' | 'push' | 'sms' | 'slack' | 'discord')[];
  recipients: {
    type: 'all' | 'premium' | 'free' | 'custom';
    customList?: string[];
    count: number;
  };
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  openRate?: number;
  clickRate?: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'push' | 'sms';
  variables: string[];
  isActive: boolean;
}

interface NotificationStats {
  totalSent: number;
  totalScheduled: number;
  averageOpenRate: number;
  averageClickRate: number;
  failedDeliveries: number;
  activeSubscribers: number;
}

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    channels: [] as string[],
    recipients: { type: 'all' as const, count: 0 }
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification stats
  const { data: notificationStats } = useQuery<NotificationStats>({
    queryKey: ['admin-notification-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications/stats');
      if (!response.ok) throw new Error('Failed to fetch notification stats');
      return response.json();
    },
  });

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['admin-notifications', selectedType, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: selectedType,
        status: selectedStatus
      });
      const response = await fetch(`/api/admin/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  // Fetch notification templates
  const { data: templates } = useQuery<NotificationTemplate[]>({
    queryKey: ['admin-notification-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/admin/notifications', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Failed to create notification');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notification created successfully" });
      refetchNotifications();
      setIsCreating(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        channels: [],
        recipients: { type: 'all', count: 0 }
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating notification", description: error.message, variant: "destructive" });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`/api/admin/notifications/${notificationId}/send`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notification sent successfully" });
      refetchNotifications();
    },
    onError: (error: Error) => {
      toast({ title: "Error sending notification", description: error.message, variant: "destructive" });
    },
  });

  const getTypeBadge = (type: string) => {
    const variants = {
      info: <Badge variant="secondary">Info</Badge>,
      warning: <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>,
      error: <Badge variant="destructive">Error</Badge>,
      success: <Badge variant="default">Success</Badge>,
    };
    return variants[type as keyof typeof variants] || <Badge>{type}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: <Badge variant="outline">Low</Badge>,
      medium: <Badge variant="secondary">Medium</Badge>,
      high: <Badge className="bg-orange-100 text-orange-800">High</Badge>,
      urgent: <Badge variant="destructive">Urgent</Badge>,
    };
    return variants[priority as keyof typeof variants] || <Badge>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: <Badge variant="outline">Draft</Badge>,
      scheduled: <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>,
      sent: <Badge variant="default">Sent</Badge>,
      failed: <Badge variant="destructive">Failed</Badge>,
    };
    return variants[status as keyof typeof variants] || <Badge>{status}</Badge>;
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    await createNotificationMutation.mutateAsync(newNotification);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Notification Center</h2>
            <p className="text-neutral-600">Manage system notifications and alerts</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Stats Cards */}
      {notificationStats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationStats.totalSent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationStats.totalScheduled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationStats.averageOpenRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationStats.averageClickRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notificationStats.failedDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationStats.activeSubscribers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications?.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {getTypeBadge(notification.type)}
                        {getPriorityBadge(notification.priority)}
                        {getStatusBadge(notification.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {notification.recipients.count} recipients
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.openRate && (
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {notification.openRate}% open rate
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {notification.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {notification.status === 'draft' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => sendNotificationMutation.mutate(notification.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!notifications || notifications.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications found for the selected criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Templates</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates?.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline">{template.type}</Badge>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS notifications</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">Send notifications to Slack</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Send Time</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>

                <div className="space-y-2">
                  <Label>Max Daily Notifications</Label>
                  <Input type="number" defaultValue="5" />
                </div>

                <div className="space-y-2">
                  <Label>Retry Failed Deliveries</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 time</SelectItem>
                      <SelectItem value="3">3 times</SelectItem>
                      <SelectItem value="5">5 times</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Delivery Confirmation</Label>
                    <p className="text-sm text-muted-foreground">Track delivery status</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Email Delivery Rate</span>
                    <span className="font-medium">95.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Push Delivery Rate</span>
                    <span className="font-medium">87.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SMS Delivery Rate</span>
                    <span className="font-medium">99.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Open Rate</span>
                    <span className="font-medium">24.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Click-through Rate</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unsubscribe Rate</span>
                    <span className="font-medium">0.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bounce Rate</span>
                    <span className="font-medium">2.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Complaint Rate</span>
                    <span className="font-medium">0.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Notification Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value: any) => setNewNotification({...newNotification, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newNotification.priority}
                    onValueChange={(value: any) => setNewNotification({...newNotification, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Channels</Label>
                <div className="flex items-center space-x-4 mt-2">
                  {['email', 'push', 'sms', 'slack'].map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newNotification.channels.includes(channel)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewNotification({
                              ...newNotification,
                              channels: [...newNotification.channels, channel]
                            });
                          } else {
                            setNewNotification({
                              ...newNotification,
                              channels: newNotification.channels.filter(c => c !== channel)
                            });
                          }
                        }}
                      />
                      <Label className="capitalize">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNotification} disabled={createNotificationMutation.isPending}>
                Create Notification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}