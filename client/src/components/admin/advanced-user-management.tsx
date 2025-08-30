import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Calendar,
  Activity,
  Edit3,
  Trash2,
  MoreHorizontal,
  Download,
  Upload
} from "lucide-react";
import { User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/apiRequest";

interface BulkOperationRequest {
  operation: string;
  userIds: number[];
  data?: any;
}

interface UserStats {
  totalMeals: number;
  lastLoginAt: string;
  subscriptionStatus: string;
  totalSpent: number;
  registrationDate: string;
}

interface ExtendedUser extends UserType {
  stats?: UserStats;
}

export default function AdvancedUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterPremium, setFilterPremium] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with advanced filtering
  const { data: users = [], isLoading, refetch } = useQuery<ExtendedUser[]>({
    queryKey: ['admin-users', searchTerm, filterRole, filterPremium],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterPremium !== 'all') params.append('premium', filterPremium);

      const response = await apiRequest(`/api/admin/users/advanced?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // User statistics
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/users/stats');
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: userData,
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
      setShowCreateDialog(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: data,
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User updated successfully" });
      setEditUser(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    },
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, userIds, data }: BulkOperationRequest) => {
      const response = await apiRequest('/api/admin/users/bulk', {
        method: 'POST',
        body: { operation, userIds, data } as any,
      });
      if (!response.ok) throw new Error('Failed to perform bulk operation');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bulk operation completed successfully" });
      setSelectedUsers([]);
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Error performing bulk operation", description: error.message, variant: "destructive" });
    },
  });

  const handleUserSelect = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const exportUsers = () => {
    // Create CSV export
    const csvContent = [
      ['ID', 'Username', 'Email', 'Role', 'Premium', 'Registration Date'],
      ...users.map(user => [
        user.id,
        user.username,
        user.email || '',
        user.role,
        user.isPremium ? 'Yes' : 'No',
        new Date(user.stats?.registrationDate || '').toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Advanced User Management</h2>
            <p className="text-neutral-600">Comprehensive user administration and analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportUsers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{userStats?.newUsersThisWeek || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.premiumUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {((userStats?.premiumUsers || 0) / (userStats?.totalUsers || 1) * 100).toFixed(1)}% conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.activeToday || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {((userStats?.activeToday || 0) / (userStats?.totalUsers || 1) * 100).toFixed(1)}% engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Revenue</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${userStats?.avgRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Per premium user
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users by username or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPremium} onValueChange={setFilterPremium}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="premium">Premium Only</SelectItem>
                    <SelectItem value="free">Free Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                {selectedUsers.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBulkActions(true)}
                  >
                    Bulk Actions ({selectedUsers.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.isPremium && (
                              <Badge variant="default">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                            {user.onboardingCompleted && (
                              <Badge variant="outline">Onboarded</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {user.stats?.lastLoginAt ? 
                              new Date(user.stats.lastLoginAt).toLocaleDateString() : 
                              'Never'
                            }
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditUser(user)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <Badge variant="default">+{userStats?.newUsersThisMonth || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <Badge variant="outline">+{userStats?.newUsersLastMonth || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Growth Rate</span>
                    <Badge variant="secondary">
                      {userStats?.growthRate ? `${userStats.growthRate}%` : 'N/A'}
                    </Badge>
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
                    <span className="text-sm">Daily Active Users</span>
                    <Badge variant="default">{userStats?.dailyActiveUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weekly Active Users</span>
                    <Badge variant="default">{userStats?.weeklyActiveUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Session Duration</span>
                    <Badge variant="outline">{userStats?.avgSessionDuration || 'N/A'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select users from the Users tab to perform bulk operations.
              </p>
              
              {selectedUsers.length > 0 ? (
                <div className="space-y-4">
                  <p className="font-medium">{selectedUsers.length} users selected</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => bulkOperationMutation.mutate({ 
                        operation: 'make_premium', 
                        userIds: selectedUsers 
                      })}
                      disabled={bulkOperationMutation.isPending}
                    >
                      Make Premium
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => bulkOperationMutation.mutate({ 
                        operation: 'remove_premium', 
                        userIds: selectedUsers 
                      })}
                      disabled={bulkOperationMutation.isPending}
                    >
                      Remove Premium
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => bulkOperationMutation.mutate({ 
                        operation: 'send_email', 
                        userIds: selectedUsers,
                        data: { subject: 'System Notification', message: 'Important update...' }
                      })}
                      disabled={bulkOperationMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No users selected for bulk operations.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm">{selectedUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm">{selectedUser.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {selectedUser.isPremium && <Badge>Premium</Badge>}
                    <Badge variant="outline">
                      {selectedUser.onboardingCompleted ? 'Onboarded' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedUser.stats && (
                <div>
                  <Label className="text-sm font-medium">Statistics</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Meals</p>
                      <p className="text-sm font-medium">{selectedUser.stats.totalMeals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedUser.stats.lastLoginAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editUser.email || ''}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editUser.role || 'user'}
                  onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!editUser.isPremium}
                  onCheckedChange={(checked) => setEditUser({ ...editUser, isPremium: checked })}
                />
                <Label>Premium User</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editUser && updateUserMutation.mutate({ id: editUser.id, data: editUser })}
              disabled={updateUserMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm onSubmit={(data) => createUserMutation.mutate(data)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isPremium: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isPremium}
          onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
        />
        <Label>Premium User</Label>
      </div>
      
      <DialogFooter>
        <Button type="submit">Create User</Button>
      </DialogFooter>
    </form>
  );
}