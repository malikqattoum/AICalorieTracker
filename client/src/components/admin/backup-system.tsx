import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  Database, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Copy,
  Server,
  Clock,
  HardDrive
} from "lucide-react";

interface BackupItem {
  id: string;
  name: string;
  type: 'full' | 'settings' | 'data' | 'logs';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  downloadUrl?: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: string;
  lastBackup: string;
  nextScheduledBackup: string;
  storageUsed: number;
  storageLimit: number;
}

export default function BackupSystem() {
  const [activeTab, setActiveTab] = useState("backups");
  const [selectedBackupType, setSelectedBackupType] = useState("full");
  const [backupName, setBackupName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { toast } = useToast();

  // Fetch backup stats
  const { data: backupStats } = useQuery<BackupStats>({
    queryKey: ['admin-backup-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/backup/stats');
      if (!response.ok) throw new Error('Failed to fetch backup stats');
      return response.json();
    },
  });

  // Fetch backups list
  const { data: backups, refetch: refetchBackups } = useQuery<BackupItem[]>({
    queryKey: ['admin-backups'],
    queryFn: async () => {
      const response = await fetch('/api/admin/backup');
      if (!response.ok) throw new Error('Failed to fetch backups');
      return response.json();
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (data: { type: string; name: string }) => {
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create backup');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Backup created successfully" });
      refetchBackups();
      setBackupName("");
      setIsCreatingBackup(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating backup", description: error.message, variant: "destructive" });
      setIsCreatingBackup(false);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete backup');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Backup deleted successfully" });
      refetchBackups();
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting backup", description: error.message, variant: "destructive" });
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/admin/backup/${backupId}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore backup');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Backup restored successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error restoring backup", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast({ title: "Please enter a backup name", variant: "destructive" });
      return;
    }

    setIsCreatingBackup(true);
    await createBackupMutation.mutateAsync({
      type: selectedBackupType,
      name: backupName.trim()
    });
  };

  const handleDownloadBackup = (backup: BackupItem) => {
    if (backup.downloadUrl) {
      window.open(backup.downloadUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      full: <Badge className="bg-blue-100 text-blue-800">Full Backup</Badge>,
      settings: <Badge className="bg-green-100 text-green-800">Settings</Badge>,
      data: <Badge className="bg-purple-100 text-purple-800">Data Only</Badge>,
      logs: <Badge className="bg-gray-100 text-gray-800">Logs</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge variant="outline">{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Database className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Backup & Restore</h2>
            <p className="text-neutral-600">Manage system backups and data exports</p>
          </div>
        </div>
        <Button onClick={() => refetchBackups()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {backupStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backupStats.totalBackups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backupStats.totalSize}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {backupStats.lastBackup ? new Date(backupStats.lastBackup).toLocaleDateString() : 'Never'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {Math.round((backupStats.storageUsed / backupStats.storageLimit) * 100)}%
              </div>
              <Progress value={(backupStats.storageUsed / backupStats.storageLimit) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="create">Create Backup</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups?.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{backup.name}</h3>
                          {getTypeBadge(backup.type)}
                          {getStatusBadge(backup.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(backup.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1" />
                            {backup.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreBackupMutation.mutate(backup.id)}
                            disabled={restoreBackupMutation.isPending}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBackupMutation.mutate(backup.id)}
                        disabled={deleteBackupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!backups || backups.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No backups found. Create your first backup to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backup-name">Backup Name</Label>
                <Input
                  id="backup-name"
                  placeholder="Enter backup name..."
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  disabled={isCreatingBackup}
                />
              </div>

              <div>
                <Label htmlFor="backup-type">Backup Type</Label>
                <Select
                  value={selectedBackupType}
                  onValueChange={setSelectedBackupType}
                  disabled={isCreatingBackup}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup (All data)</SelectItem>
                    <SelectItem value="settings">Settings Only</SelectItem>
                    <SelectItem value="data">User Data Only</SelectItem>
                    <SelectItem value="logs">Logs Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCreatingBackup && (
                <div className="space-y-2">
                  <Label>Creating Backup...</Label>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup || createBackupMutation.isPending}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-frequency">Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input type="time" defaultValue="02:00" />
                </div>

                <div>
                  <Label htmlFor="retention-days">Retention (days)</Label>
                  <Input type="number" defaultValue="30" />
                </div>

                <div>
                  <Label htmlFor="max-backups">Max Backups</Label>
                  <Input type="number" defaultValue="10" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Auto-cleanup Old Backups</h3>
                  <p className="text-sm text-muted-foreground">Automatically delete backups older than retention period</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>

              <div className="flex justify-end">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Save Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Select Backup File</Label>
                  <Input type="file" accept=".zip,.tar.gz,.backup" />
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Warning</h3>
                      <p className="text-sm text-yellow-700">
                        Importing a backup will overwrite existing data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Quick Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Export All Settings
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Export User Data
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Server className="h-4 w-4 mr-2" />
                    Export System Logs
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Copy className="h-4 w-4 mr-2" />
                    Export AI Configurations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}