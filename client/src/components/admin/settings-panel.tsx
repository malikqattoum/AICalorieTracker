import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Code, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Key,
  Server,
  Cloud,
  Lock
} from "lucide-react";

interface AppSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  ai: {
    defaultProvider: string;
    maxAnalysesPerDay: number;
    enableAutoAnalysis: boolean;
    analysisTimeout: number;
  };
  payment: {
    stripeEnabled: boolean;
    monthlyPrice: number;
    yearlyPrice: number;
    trialDays: number;
    currency: string;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    slackWebhook: string;
    discordWebhook: string;
  };
  storage: {
    provider: string;
    maxFileSize: number;
    allowedTypes: string[];
    retentionDays: number;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTtl: number;
    compressionEnabled: boolean;
    rateLimitEnabled: boolean;
  };
}

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch app settings
  const { data: appSettings, isLoading } = useQuery<AppSettings>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { section: string; settings: any }) => {
      const response = await fetch(`/api/admin/settings/${data.section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.settings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully" });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating settings", description: error.message, variant: "destructive" });
    },
  });

  // Test email configuration mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Test email sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error sending test email", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (appSettings) {
      setSettings(appSettings);
    }
  }, [appSettings]);

  const handleSettingsChange = (section: keyof AppSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSection = async (section: keyof AppSettings) => {
    if (!settings) return;
    
    await updateSettingsMutation.mutateAsync({
      section,
      settings: settings[section]
    });
  };

  const handleTestEmail = async () => {
    await testEmailMutation.mutateAsync();
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">System Settings</h2>
            <p className="text-neutral-600">Configure application settings and preferences</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-settings'] })} 
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingsChange('general', 'siteName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => handleSettingsChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.general.siteDescription}
                  onChange={(e) => handleSettingsChange('general', 'siteDescription', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable the application</p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingsChange('general', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={settings.general.registrationEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('general', 'registrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    checked={settings.general.emailVerificationRequired}
                    onCheckedChange={(checked) => handleSettingsChange('general', 'emailVerificationRequired', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('general')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-provider">Default AI Provider</Label>
                  <Select
                    value={settings.ai.defaultProvider}
                    onValueChange={(value) => handleSettingsChange('ai', 'defaultProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="testing">Testing Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max-analyses">Max Analyses Per Day (Free Users)</Label>
                  <Input
                    id="max-analyses"
                    type="number"
                    value={settings.ai.maxAnalysesPerDay}
                    onChange={(e) => handleSettingsChange('ai', 'maxAnalysesPerDay', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="analysis-timeout">Analysis Timeout (seconds)</Label>
                  <Input
                    id="analysis-timeout"
                    type="number"
                    value={settings.ai.analysisTimeout}
                    onChange={(e) => handleSettingsChange('ai', 'analysisTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Auto Analysis</Label>
                  <p className="text-sm text-muted-foreground">Automatically analyze uploaded images</p>
                </div>
                <Switch
                  checked={settings.ai.enableAutoAnalysis}
                  onCheckedChange={(checked) => handleSettingsChange('ai', 'enableAutoAnalysis', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('ai')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Stripe Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable Stripe payment processing</p>
                </div>
                <Switch
                  checked={settings.payment.stripeEnabled}
                  onCheckedChange={(checked) => handleSettingsChange('payment', 'stripeEnabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly-price">Monthly Price</Label>
                  <Input
                    id="monthly-price"
                    type="number"
                    step="0.01"
                    value={settings.payment.monthlyPrice}
                    onChange={(e) => handleSettingsChange('payment', 'monthlyPrice', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="yearly-price">Yearly Price</Label>
                  <Input
                    id="yearly-price"
                    type="number"
                    step="0.01"
                    value={settings.payment.yearlyPrice}
                    onChange={(e) => handleSettingsChange('payment', 'yearlyPrice', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="trial-days">Trial Days</Label>
                  <Input
                    id="trial-days"
                    type="number"
                    value={settings.payment.trialDays}
                    onChange={(e) => handleSettingsChange('payment', 'trialDays', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.payment.currency}
                    onValueChange={(value) => handleSettingsChange('payment', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                      <SelectItem value="cad">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('payment')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-provider">Email Provider</Label>
                  <Select
                    value={settings.email.provider}
                    onValueChange={(value) => handleSettingsChange('email', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleSettingsChange('email', 'smtpHost', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleSettingsChange('email', 'smtpPort', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="smtp-username">SMTP Username</Label>
                  <Input
                    id="smtp-username"
                    value={settings.email.smtpUsername}
                    onChange={(e) => handleSettingsChange('email', 'smtpUsername', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleSettingsChange('email', 'smtpPassword', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="from-address">From Address</Label>
                  <Input
                    id="from-address"
                    type="email"
                    value={settings.email.fromAddress}
                    onChange={(e) => handleSettingsChange('email', 'fromAddress', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={settings.email.fromName}
                    onChange={(e) => handleSettingsChange('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  onClick={handleTestEmail}
                  variant="outline"
                  disabled={testEmailMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button 
                  onClick={() => handleSaveSection('email')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password-min-length">Password Min Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingsChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingsChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingsChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => handleSettingsChange('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Enable 2FA for admin accounts</p>
                </div>
                <Switch
                  checked={settings.security.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSettingsChange('security', 'twoFactorEnabled', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('security')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications to admins</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'emailEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'pushEnabled', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    placeholder="https://hooks.slack.com/..."
                    value={settings.notifications.slackWebhook}
                    onChange={(e) => handleSettingsChange('notifications', 'slackWebhook', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings.notifications.discordWebhook}
                    onChange={(e) => handleSettingsChange('notifications', 'discordWebhook', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('notifications')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storage-provider">Storage Provider</Label>
                  <Select
                    value={settings.storage.provider}
                    onValueChange={(value) => handleSettingsChange('storage', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure">Azure Blob Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={settings.storage.maxFileSize}
                    onChange={(e) => handleSettingsChange('storage', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="retention-days">Retention Days</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    value={settings.storage.retentionDays}
                    onChange={(e) => handleSettingsChange('storage', 'retentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="allowed-types">Allowed File Types (comma-separated)</Label>
                <Input
                  id="allowed-types"
                  value={settings.storage.allowedTypes.join(', ')}
                  onChange={(e) => handleSettingsChange('storage', 'allowedTypes', e.target.value.split(', '))}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('storage')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Storage Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Performance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">Cache frequently accessed data</p>
                  </div>
                  <Switch
                    checked={settings.performance.cacheEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('performance', 'cacheEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">Compress API responses</p>
                  </div>
                  <Switch
                    checked={settings.performance.compressionEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('performance', 'compressionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">Limit API requests per user</p>
                  </div>
                  <Switch
                    checked={settings.performance.rateLimitEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('performance', 'rateLimitEnabled', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
                <Input
                  id="cache-ttl"
                  type="number"
                  value={settings.performance.cacheTtl}
                  onChange={(e) => handleSettingsChange('performance', 'cacheTtl', parseInt(e.target.value))}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSection('performance')}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Performance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}