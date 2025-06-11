import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, MealAnalysis, WeeklyStats, AppConfig, InsertAppConfig } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [mealSearch, setMealSearch] = useState("");
  const [statsSearch, setStatsSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState<Partial<User>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Partial<AppConfig> & { id?: number }>({});
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Protect route: only allow admin (add your own admin check logic)
  useEffect(() => {
    // @ts-ignore
    if (!user || user.role !== 'admin') {
      toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, navigate, toast]);

  // API queries
  const { data: users = [], refetch: refetchUsers, isLoading: isLoadingUsers } = useQuery<User[]>({ // Added isLoadingUsers
    queryKey: ["/api/admin/users"],
  });
  const { data: meals = [], refetch: refetchMeals, isLoading: isLoadingMeals } = useQuery<MealAnalysis[]>({ // Added isLoadingMeals
    queryKey: ["/api/admin/data/meal-analyses"],
  });
  const { data: stats = [], refetch: refetchStats, isLoading: isLoadingStats } = useQuery<WeeklyStats[]>({ // Added isLoadingStats
    queryKey: ["/api/admin/data/weekly-stats"],
  });
  const { data: fetchedAppConfigs = [], refetch: refetchAppConfigs, isLoading: isLoadingAppConfigs } = useQuery<AppConfig[]>({ // Added isLoadingAppConfigs
    queryKey: ["/api/admin/config"],
    initialData: appConfigs,
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<User> & { id: number }) => {
      const res = await fetch(`/api/admin/users/${data.id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditUser(null);
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    }
  });
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User deleted" });
      setShowDeleteDialog(false);
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    }
  });

  // App Config Mutations
  const createAppConfigMutation = useMutation({
    mutationFn: async (data: InsertAppConfig) => {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create config' }));
        throw new Error(errorData.message || 'Failed to create config');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'App config created' });
      setShowConfigDialog(false);
      refetchAppConfigs();
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating config', description: error.message, variant: 'destructive' });
    },
  });

  const updateAppConfigMutation = useMutation({
    mutationFn: async (data: Partial<AppConfig> & { id: number }) => {
      const res = await fetch(`/api/admin/config/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update config' }));
        throw new Error(errorData.message || 'Failed to update config');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'App config updated' });
      setShowConfigDialog(false);
      refetchAppConfigs();
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating config', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAppConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/config/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete config' }));
        throw new Error(errorData.message || 'Failed to delete config');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'App config deleted' });
      refetchAppConfigs();
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting config', description: error.message, variant: 'destructive' });
    },
  });

  // Filtered data
  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredMeals = meals.filter(m =>
    (m.foodName || '').toLowerCase().includes(mealSearch.toLowerCase()) ||
    String(m.userId).includes(mealSearch)
  );
  const filteredStats = stats.filter(s =>
    String(s.userId).includes(statsSearch)
  );

  const handleSaveConfig = () => {
    if (isEditingConfig && currentConfig.id) {
      updateAppConfigMutation.mutate(currentConfig as Partial<AppConfig> & { id: number });
    } else {
      createAppConfigMutation.mutate(currentConfig as InsertAppConfig);
    }
  };

  const openEditConfigDialog = (config: AppConfig) => {
    setCurrentConfig(config);
    setIsEditingConfig(true);
    setShowConfigDialog(true);
  };

  const openNewConfigDialog = () => {
    setCurrentConfig({ key: '', value: '', description: '', type: 'string' });
    setIsEditingConfig(false);
    setShowConfigDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-gradient glass-effect shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-200">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="stats">Weekly Stats</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="config">App Config</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                <div className="flex items-center mb-4 gap-4">
                  <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-64" />
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Premium</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.isPremium ? "Yes" : "No"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" variant="accent" onClick={() => { setEditUser(user); setEditUserData(user); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setDeleteUserId(user.id); setShowDeleteDialog(true); }}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Edit User Dialog */}
                <Dialog open={!!editUser} onOpenChange={v => { if (!v) setEditUser(null); }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-primary-100 mb-1">Username</label>
                      <Input value={editUserData.username || ""} onChange={e => setEditUserData(d => ({ ...d, username: e.target.value }))} />
                      <label className="block text-sm font-medium text-primary-100 mb-1">Email</label>
                      <Input value={editUserData.email || ""} onChange={e => setEditUserData(d => ({ ...d, email: e.target.value }))} />
                      <label className="block text-sm font-medium text-primary-100 mb-1">Role (user, admin)</label>
                      <Input value={editUserData.role || ""} onChange={e => setEditUserData(d => ({ ...d, role: e.target.value }))} />
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!editUserData.isPremium} onChange={e => setEditUserData(d => ({ ...d, isPremium: e.target.checked }))} />
                        Premium
                      </label>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
                      <Button variant="accent" onClick={() => updateUserMutation.mutate(editUserData as Partial<User> & { id: number })} disabled={updateUserMutation.isPending}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Delete User Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={v => { if (!v) setShowDeleteDialog(false); }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete User</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this user?</p>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => { if (deleteUserId) deleteUserMutation.mutate(deleteUserId); }} disabled={deleteUserMutation.isPending}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              <TabsContent value="meals">
                <div className="flex items-center mb-4 gap-4">
                  <Input placeholder="Search meals or user ID..." value={mealSearch} onChange={e => setMealSearch(e.target.value)} className="w-64" />
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>User ID</TableCell>
                      <TableCell>Food</TableCell>
                      <TableCell>Calories</TableCell>
                      <TableCell>Protein</TableCell>
                      <TableCell>Carbs</TableCell>
                      <TableCell>Fat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMeals.map((meal) => (
                      <TableRow key={meal.id}>
                        <TableCell>{meal.id}</TableCell>
                        <TableCell>{meal.userId}</TableCell>
                        <TableCell>{meal.foodName}</TableCell>
                        <TableCell>{meal.calories}</TableCell>
                        <TableCell>{meal.protein}</TableCell>
                        <TableCell>{meal.carbs}</TableCell>
                        <TableCell>{meal.fat}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="stats">
                <div className="flex items-center mb-4 gap-4">
                  <Input placeholder="Search by user ID..." value={statsSearch} onChange={e => setStatsSearch(e.target.value)} className="w-64" />
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>User ID</TableCell>
                      <TableCell>Avg Calories</TableCell>
                      <TableCell>Meals Tracked</TableCell>
                      <TableCell>Protein</TableCell>
                      <TableCell>Healthiest Day</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStats.map((stat) => (
                      <TableRow key={stat.id}>
                        <TableCell>{stat.id}</TableCell>
                        <TableCell>{stat.userId}</TableCell>
                        <TableCell>{stat.averageCalories}</TableCell>
                        <TableCell>{stat.mealsTracked}</TableCell>
                        <TableCell>{stat.averageProtein}</TableCell>
                        <TableCell>{stat.healthiestDay}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="content">
                <h2 className="text-xl font-semibold mb-4 text-primary-100">Edit Site Content</h2>
                <ContentEditor />
              </TabsContent>
              <TabsContent value="config">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-primary-100">Application Configuration</h2>
                  <Button variant="accent" onClick={openNewConfigDialog}>Add New Config</Button>
                </div>
                {isLoadingAppConfigs && <p>Loading configurations...</p>}
                {!isLoadingAppConfigs && appConfigs.length === 0 && <p>No configurations found.</p>}
                {!isLoadingAppConfigs && appConfigs.length > 0 && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>{config.id}</TableCell>
                          <TableCell>{config.key}</TableCell>
                          <TableCell className="max-w-xs truncate">{String(config.value)}</TableCell>
                          <TableCell>{config.type}</TableCell>
                          <TableCell className="max-w-xs truncate">{config.description}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditConfigDialog(config)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteAppConfigMutation.mutate(config.id!)} disabled={deleteAppConfigMutation.isPending}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {/* App Config Dialog */}
                <Dialog open={showConfigDialog} onOpenChange={v => { if (!v) setShowConfigDialog(false); }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingConfig ? 'Edit' : 'Add'} App Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="block text-sm font-medium text-primary-100 mb-1">Key</label>
                        <Input value={currentConfig.key || ''} onChange={e => setCurrentConfig((c: typeof currentConfig) => ({ ...c, key: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-100 mb-1">Value</label>
                        <Input value={currentConfig.value || ''} onChange={e => setCurrentConfig((c: typeof currentConfig) => ({ ...c, value: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-100 mb-1">Type (string, boolean, number, json)</label>
                        <Input value={currentConfig.type || 'string'} onChange={e => setCurrentConfig((c: typeof currentConfig) => ({ ...c, type: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-100 mb-1">Description</label>
                        <Input value={currentConfig.description || ''} onChange={e => setCurrentConfig((c: typeof currentConfig) => ({ ...c, description: e.target.value }))} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
                      <Button variant="accent" onClick={handleSaveConfig} disabled={createAppConfigMutation.isPending || updateAppConfigMutation.isPending}>
                        {isEditingConfig ? 'Save Changes' : 'Create Config'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- ContentEditor component ---
function ContentEditor() {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<Array<{ key: string, value: string, label: string }>>([
    { key: 'home', value: '', label: 'Home Page Main Text' },
    { key: 'try-it', value: '', label: 'Try It Page Main Text' },
    { key: 'pricing', value: '', label: 'Pricing Page Main Text' },
    // Add more content keys here if needed
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content on mount
  useEffect(() => {
    setLoading(true);
    Promise.all(
      contentItems.map(item => 
        fetch(`/api/admin/content/${item.key}`)
          .then(r => r.json())
          .then(data => ({ key: item.key, value: data.value || '' }))
      )
    ).then(fetchedContents => {
      setContentItems(currentItems => 
        currentItems.map(item => {
          const fetched = fetchedContents.find(fc => fc.key === item.key);
          return fetched ? { ...item, value: fetched.value } : item;
        })
      );
      setLoading(false);
    }).catch(e => {
      console.error("Content loading error:", e);
      setError("Failed to load content. Check console for details.");
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, contentItems keys are static here

  // Save handlers
  const saveContent = async (key: string, value: string, label: string, itemIndex: number) => { // Added itemIndex
    try {
      const res = await fetch(`/api/admin/content/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: `${label} content updated` });
      // Optionally refetch or update local state if needed, though textarea is already bound
    } catch (e) { // Catch error object
      console.error(`Failed to update ${label} content:`, e);
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: `Failed to update ${label} content`, variant: "destructive" });
    }
  };

  if (loading) return <div className="text-primary-100">Loading content...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const handleContentChange = (index: number, newValue: string) => {
    setContentItems(currentItems => 
      currentItems.map((item, i) => i === index ? { ...item, value: newValue } : item)
    );
  };

  return (
    <div className="space-y-8">
      {contentItems.map((item, index) => (
        <div key={item.key} className="bg-neutral-900/80 rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold text-primary-200 mb-2">{item.label}</h3>
          <textarea
            className="w-full min-h-[80px] rounded p-2 bg-neutral-800 text-primary-100 border border-neutral-700"
            value={item.value}
            onChange={e => handleContentChange(index, e.target.value)}
          />
          <Button className="mt-2" variant="accent" onClick={() => saveContent(item.key, item.value, item.label, index)}>Save</Button>
        </div>
      ))}
    </div>
  );
}
