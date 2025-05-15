import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, MealAnalysis, WeeklyStats } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [mealSearch, setMealSearch] = useState("");
  const [statsSearch, setStatsSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState<Partial<User>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  // Protect route: only allow admin (add your own admin check logic)
  useEffect(() => {
    // For demo, allow all users; in production, check user.role === 'admin' or similar
    if (!user /* || !user.isAdmin */) {
      toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, navigate, toast]);

  // Example queries (replace with real API endpoints)
  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  const { data: meals = [], refetch: refetchMeals } = useQuery<MealAnalysis[]>({
    queryKey: ["/api/admin/meals"],
  });
  const { data: stats = [], refetch: refetchStats } = useQuery<WeeklyStats[]>({
    queryKey: ["/api/admin/weekly-stats"],
  });

  // Mutations (replace with real API calls)
  const updateUser = useMutation({
    mutationFn: async (data: Partial<User>) => {
      // await fetch(`/api/admin/users/${data.id}`, { method: "PUT", body: JSON.stringify(data) });
      return data;
    },
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditUser(null);
      refetchUsers();
    },
  });
  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      // await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      return id;
    },
    onSuccess: () => {
      toast({ title: "User deleted" });
      setShowDeleteDialog(false);
      refetchUsers();
    },
  });

  // Filtered data
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredMeals = meals.filter(m =>
    m.foodName.toLowerCase().includes(mealSearch.toLowerCase()) ||
    String(m.userId).includes(mealSearch)
  );
  const filteredStats = stats.filter(s =>
    String(s.userId).includes(statsSearch)
  );

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
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!editUserData.isPremium} onChange={e => setEditUserData(d => ({ ...d, isPremium: e.target.checked }))} />
                        Premium
                      </label>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
                      <Button variant="accent" onClick={() => updateUser.mutate(editUserData)}>Save</Button>
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
                      <Button variant="destructive" onClick={() => { if (deleteUserId) deleteUser.mutate(deleteUserId); }}>Delete</Button>
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
  const [homeContent, setHomeContent] = useState("");
  const [tryItContent, setTryItContent] = useState("");
  const [pricingContent, setPricingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/content/home").then(r => r.json()),
      fetch("/api/admin/content/try-it").then(r => r.json()),
      fetch("/api/admin/content/pricing").then(r => r.json()),
    ]).then(([home, tryIt, pricing]) => {
      setHomeContent(home.value || "");
      setTryItContent(tryIt.value || "");
      setPricingContent(pricing.value || "");
      setLoading(false);
    }).catch(e => {
      setError("Failed to load content");
      setLoading(false);
    });
  }, []);

  // Save handlers
  const saveContent = async (key: string, value: string, label: string) => {
    try {
      const res = await fetch(`/api/admin/content/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: `${label} content updated` });
    } catch {
      toast({ title: `Failed to update ${label} content`, variant: "destructive" });
    }
  };

  if (loading) return <div className="text-primary-100">Loading content...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="bg-neutral-900/80 rounded-lg p-6 shadow">
        <h3 className="text-lg font-bold text-primary-200 mb-2">Home Page Main Text</h3>
        <textarea
          className="w-full min-h-[80px] rounded p-2 bg-neutral-800 text-primary-100 border border-neutral-700"
          value={homeContent}
          onChange={e => setHomeContent(e.target.value)}
        />
        <Button className="mt-2" variant="accent" onClick={() => saveContent("home", homeContent, "Home")}>Save</Button>
      </div>
      <div className="bg-neutral-900/80 rounded-lg p-6 shadow">
        <h3 className="text-lg font-bold text-primary-200 mb-2">Try It Page Main Text</h3>
        <textarea
          className="w-full min-h-[80px] rounded p-2 bg-neutral-800 text-primary-100 border border-neutral-700"
          value={tryItContent}
          onChange={e => setTryItContent(e.target.value)}
        />
        <Button className="mt-2" variant="accent" onClick={() => saveContent("try-it", tryItContent, "Try It")}>Save</Button>
      </div>
      <div className="bg-neutral-900/80 rounded-lg p-6 shadow">
        <h3 className="text-lg font-bold text-primary-200 mb-2">Pricing Page Main Text</h3>
        <textarea
          className="w-full min-h-[80px] rounded p-2 bg-neutral-800 text-primary-100 border border-neutral-700"
          value={pricingContent}
          onChange={e => setPricingContent(e.target.value)}
        />
        <Button className="mt-2" variant="accent" onClick={() => saveContent("pricing", pricingContent, "Pricing")}>Save</Button>
      </div>
    </div>
  );
}
