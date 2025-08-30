import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiRequest";
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Crown,
  Calendar,
  Search
} from "lucide-react";

interface Subscription {
  id: string;
  userId: number;
  username: string;
  email: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  userId: number;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  userId: number;
  username: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  description: string;
  createdAt: string;
  subscriptionId?: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

interface ReferralSettings {
  commission_percent: number;
  is_recurring: boolean;
}

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    commission_percent: 0,
    is_recurring: false
  });

  // Fetch revenue metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<RevenueMetrics>({
    queryKey: ['admin-revenue-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/metrics');
      if (!response.ok) throw new Error('Failed to fetch revenue metrics');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<Subscription[]>({
    queryKey: ['admin-subscriptions', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/payments/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/methods');
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return response.json();
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest(`/api/admin/payments/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription canceled successfully" });
      refetchSubscriptions();
    },
    onError: (error: Error) => {
      toast({ title: "Error canceling subscription", description: error.message, variant: "destructive" });
    },
  });

  // Refund payment mutation
  const refundPaymentMutation = useMutation({
    mutationFn: async (data: { transactionId: string; amount: number; reason: string }) => {
      const response = await apiRequest(`/api/admin/payments/refund`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to process refund');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Refund processed successfully" });
      setShowRefundDialog(false);
      setRefundAmount("");
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error processing refund", description: error.message, variant: "destructive" });
    },
  });

  // Update referral settings mutation
  const updateReferralSettings = useMutation({
    mutationFn: async (settings: ReferralSettings) => {
      const response = await apiRequest('/api/admin/referral-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to update referral settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Referral settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-settings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating referral settings", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'canceled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Canceled</Badge>;
      case 'past_due':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Past Due</Badge>;
      case 'incomplete':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Incomplete</Badge>;
      case 'succeeded':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Succeeded</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportData = (type: 'subscriptions' | 'transactions') => {
    const data = type === 'subscriptions' ? subscriptions : transactions;
    const csvContent = [
      type === 'subscriptions' 
        ? ['ID', 'User', 'Email', 'Plan', 'Status', 'Amount', 'Created']
        : ['ID', 'User', 'Amount', 'Status', 'Description', 'Created'],
      ...(data || []).map(item => 
        type === 'subscriptions' 
          ? [
              (item as Subscription).id,
              (item as Subscription).username,
              (item as Subscription).email,
              (item as Subscription).planName,
              (item as Subscription).status,
              (item as Subscription).amount,
              new Date((item as Subscription).createdAt).toLocaleDateString()
            ]
          : [
              (item as Transaction).id,
              (item as Transaction).username,
              (item as Transaction).amount,
              (item as Transaction).status,
              (item as Transaction).description,
              new Date((item as Transaction).createdAt).toLocaleDateString()
            ]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Payment Management</h2>
            <p className="text-neutral-600">Manage subscriptions, transactions, and revenue</p>
          </div>
        </div>
        <Button onClick={() => queryClient.invalidateQueries()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics?.totalRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics?.monthlyRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.canceledSubscriptions || 0} canceled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.churnRate || 0}%</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Subscriptions</span>
                    <span className="font-medium">${metrics?.monthlyRevenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Yearly Subscriptions</span>
                    <span className="font-medium">${metrics?.yearlyRevenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Revenue Per User</span>
                    <span className="font-medium">${metrics?.averageRevenuePerUser || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Lifetime Value</span>
                    <span className="font-medium">${metrics?.lifetimeValue || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active</span>
                    <Badge variant="default">{metrics?.activeSubscriptions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Canceled</span>
                    <Badge variant="destructive">{metrics?.canceledSubscriptions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <Badge variant="outline">{metrics?.totalSubscriptions || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by username or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => exportData('subscriptions')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions ({subscriptions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions?.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.username}</p>
                            <p className="text-sm text-muted-foreground">{subscription.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span>{subscription.planName}</span>
                            <Badge variant="outline">{subscription.interval}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          ${subscription.amount} {subscription.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {subscription.status === 'active' ? (
                            <div>
                              <p className="text-sm">
                                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </p>
                              {subscription.cancelAt && (
                                <p className="text-xs text-muted-foreground">
                                  Cancels: {new Date(subscription.cancelAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubscription(subscription)}
                            >
                              View
                            </Button>
                            {subscription.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                                disabled={cancelSubscriptionMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button onClick={() => exportData('transactions')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{transaction.username}</p>
                        </TableCell>
                        <TableCell>
                          ${transaction.amount} {transaction.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'succeeded' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubscription(null);
                                setShowRefundDialog(true);
                                setRefundAmount(transaction.amount.toString());
                              }}
                            >
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods?.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>{method.userId}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="capitalize">{method.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{method.brand}</span> •••• {method.last4}
                        </TableCell>
                        <TableCell>
                          {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                        </TableCell>
                        <TableCell>
                          {method.isDefault && <Badge variant="default">Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Stripe Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Publishable Key</Label>
                      <Input placeholder="pk_..." disabled />
                    </div>
                    <div>
                      <Label>Webhook Endpoint</Label>
                      <Input value="/api/webhooks/stripe" disabled />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Plan Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Monthly Plan</p>
                        <p className="text-sm text-muted-foreground">$9.99/month</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Yearly Plan</p>
                        <p className="text-sm text-muted-foreground">$99.99/year</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Referral Program</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Commission Percentage</Label>
                      <Input
                        type="number"
                        value={referralSettings.commission_percent}
                        onChange={(e) => setReferralSettings({
                          ...referralSettings,
                          commission_percent: parseFloat(e.target.value)
                        })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="recurring-commissions"
                        checked={referralSettings.is_recurring}
                        onCheckedChange={(checked) => setReferralSettings({
                          ...referralSettings,
                          is_recurring: checked
                        })}
                      />
                      <Label htmlFor="recurring-commissions">Recurring Commissions</Label>
                    </div>
                    <Button
                      onClick={() => updateReferralSettings.mutate(referralSettings)}
                      disabled={updateReferralSettings.isPending}
                    >
                      Save Referral Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Details Dialog */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subscription ID</Label>
                  <p className="text-sm font-mono">{selectedSubscription.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedSubscription.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm">{selectedSubscription.planName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">
                    ${selectedSubscription.amount} {selectedSubscription.currency.toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Billing Cycle</Label>
                  <p className="text-sm capitalize">{selectedSubscription.interval}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Period</Label>
                  <p className="text-sm">
                    {new Date(selectedSubscription.currentPeriodStart).toLocaleDateString()} - {" "}
                    {new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">
                    {new Date(selectedSubscription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason</Label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested_by_customer">Requested by customer</SelectItem>
                  <SelectItem value="duplicate">Duplicate charge</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                  <SelectItem value="subscription_cancellation">Subscription cancellation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => refundPaymentMutation.mutate({
                transactionId: 'tx_123', // This should be the actual transaction ID
                amount: parseFloat(refundAmount),
                reason: refundReason
              })}
              disabled={refundPaymentMutation.isPending || !refundAmount || !refundReason}
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}