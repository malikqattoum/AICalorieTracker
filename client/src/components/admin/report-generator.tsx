import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut } from "@/lib/apiRequest";
import { 
  FileText,
  Download,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Bot,
  Shield,
  Activity,
  Settings,
  Zap,
  Eye,
  Send,
  Save,
  Trash2,
  Copy,
  RefreshCw
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'analytics' | 'financial' | 'security' | 'user' | 'ai' | 'custom';
  sections: string[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
    enabled: boolean;
  };
  createdAt: string;
  lastGenerated?: string;
}

interface ReportConfig {
  title: string;
  description: string;
  type: string;
  timeRange: {
    start: string;
    end: string;
  };
  sections: {
    userMetrics: boolean;
    financialMetrics: boolean;
    systemMetrics: boolean;
    aiMetrics: boolean;
    securityMetrics: boolean;
    activityLogs: boolean;
    customCharts: boolean;
  };
  format: 'pdf' | 'excel' | 'csv' | 'html';
  includeCharts: boolean;
  includeRawData: boolean;
  emailRecipients: string[];
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  fileSize: number;
  downloadUrl: string;
  status: 'pending' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export default function ReportGenerator() {
  const [activeTab, setActiveTab] = useState("generator");
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    title: '',
    description: '',
    type: 'system',
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    sections: {
      userMetrics: true,
      financialMetrics: true,
      systemMetrics: true,
      aiMetrics: true,
      securityMetrics: false,
      activityLogs: false,
      customCharts: false
    },
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    emailRecipients: []
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'system' as const,
    sections: [] as string[],
    schedule: {
      frequency: 'weekly' as const,
      time: '09:00',
      recipients: [] as string[],
      enabled: false
    }
  });
  const [emailList, setEmailList] = useState('');

  const { toast } = useToast();

  // Fetch report templates
  const { data: templates } = useQuery<ReportTemplate[]>({
    queryKey: ['admin-report-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/templates');
      if (!response.ok) throw new Error('Failed to fetch report templates');
      return response.json();
    },
  });

  // Fetch generated reports
  const { data: generatedReports, refetch: refetchReports } = useQuery<GeneratedReport[]>({
    queryKey: ['admin-generated-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/generated');
      if (!response.ok) throw new Error('Failed to fetch generated reports');
      return response.json();
    },
    refetchInterval: 5000, // Poll for updates
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await apiPost('/api/admin/reports/generate', config);
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report generation started", description: "You'll be notified when it's ready" });
      refetchReports();
    },
    onError: (error: Error) => {
      toast({ title: "Report generation failed", description: error.message, variant: "destructive" });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await apiPost('/api/admin/reports/templates', template);
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template created successfully" });
      setNewTemplate({
        name: '',
        description: '',
        type: 'system',
        sections: [],
        schedule: {
          frequency: 'weekly',
          time: '09:00',
          recipients: [],
          enabled: false
        }
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    },
  });

  // Schedule report mutation
  const scheduleReportMutation = useMutation({
    mutationFn: async ({ templateId, schedule }: { templateId: string; schedule: any }) => {
      const response = await apiPut(`/api/admin/reports/templates/${templateId}/schedule`, schedule);
      if (!response.ok) throw new Error('Failed to schedule report');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to schedule report", description: error.message, variant: "destructive" });
    },
  });

  const handleConfigChange = (field: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectionToggle = (section: keyof typeof reportConfig.sections) => {
    setReportConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section]
      }
    }));
  };

  const handleEmailRecipientsChange = () => {
    const emails = emailList.split(',').map(email => email.trim()).filter(email => email);
    setReportConfig(prev => ({
      ...prev,
      emailRecipients: emails
    }));
  };

  const handleGenerateReport = () => {
    if (!reportConfig.title) {
      toast({ title: "Please enter a report title", variant: "destructive" });
      return;
    }
    
    const config = {
      ...reportConfig,
      emailRecipients: emailList.split(',').map(email => email.trim()).filter(email => email)
    };
    
    generateReportMutation.mutate(config);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      system: Settings,
      analytics: BarChart3,
      financial: DollarSign,
      security: Shield,
      user: Users,
      ai: Bot,
      custom: FileText
    };
    const IconComponent = icons[type as keyof typeof icons] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Report Generator</h2>
            <p className="text-neutral-600">Generate comprehensive system and analytics reports</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generator">Generate Report</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          <TabsTrigger value="schedule">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Report Title</Label>
                      <Input
                        id="title"
                        value={reportConfig.title}
                        onChange={(e) => handleConfigChange('title', e.target.value)}
                        placeholder="Enter report title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="type">Report Type</Label>
                      <Select value={reportConfig.type} onValueChange={(value) => handleConfigChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System Report</SelectItem>
                          <SelectItem value="analytics">Analytics Report</SelectItem>
                          <SelectItem value="financial">Financial Report</SelectItem>
                          <SelectItem value="security">Security Report</SelectItem>
                          <SelectItem value="user">User Report</SelectItem>
                          <SelectItem value="ai">AI Usage Report</SelectItem>
                          <SelectItem value="custom">Custom Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={reportConfig.timeRange.start}
                        onChange={(e) => handleConfigChange('timeRange', { ...reportConfig.timeRange, start: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={reportConfig.timeRange.end}
                        onChange={(e) => handleConfigChange('timeRange', { ...reportConfig.timeRange, end: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={reportConfig.description}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      placeholder="Enter report description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Report Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.userMetrics}
                        onCheckedChange={() => handleSectionToggle('userMetrics')}
                      />
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Metrics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.financialMetrics}
                        onCheckedChange={() => handleSectionToggle('financialMetrics')}
                      />
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Metrics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.systemMetrics}
                        onCheckedChange={() => handleSectionToggle('systemMetrics')}
                      />
                      <Label className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        System Metrics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.aiMetrics}
                        onCheckedChange={() => handleSectionToggle('aiMetrics')}
                      />
                      <Label className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Metrics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.securityMetrics}
                        onCheckedChange={() => handleSectionToggle('securityMetrics')}
                      />
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security Metrics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportConfig.sections.activityLogs}
                        onCheckedChange={() => handleSectionToggle('activityLogs')}
                      />
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Logs
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Output Format</Label>
                      <Select value={reportConfig.format} onValueChange={(value) => handleConfigChange('format', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Charts and Graphs</Label>
                    <Switch
                      checked={reportConfig.includeCharts}
                      onCheckedChange={(value) => handleConfigChange('includeCharts', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Raw Data</Label>
                    <Switch
                      checked={reportConfig.includeRawData}
                      onCheckedChange={(value) => handleConfigChange('includeRawData', value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-recipients">Email Recipients (comma-separated)</Label>
                    <Textarea
                      id="email-recipients"
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                      onBlur={handleEmailRecipientsChange}
                      placeholder="admin@example.com, manager@example.com"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">{reportConfig.title || 'Untitled Report'}</h3>
                    <p className="text-sm text-muted-foreground">{reportConfig.description}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(reportConfig.type)}
                      <span className="text-sm capitalize">{reportConfig.type}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Time Range</Label>
                    <p className="text-sm text-muted-foreground">
                      {reportConfig.timeRange.start} to {reportConfig.timeRange.end}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Sections</Label>
                    <div className="space-y-1 mt-1">
                      {Object.entries(reportConfig.sections)
                        .filter(([, enabled]) => enabled)
                        .map(([section]) => (
                          <Badge key={section} variant="secondary" className="mr-1">
                            {section.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Format</Label>
                    <p className="text-sm text-muted-foreground uppercase">{reportConfig.format}</p>
                  </div>

                  {reportConfig.emailRecipients.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Recipients</Label>
                      <p className="text-sm text-muted-foreground">
                        {reportConfig.emailRecipients.length} recipient(s)
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="w-full"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="Weekly System Report"
                  />
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="Comprehensive weekly system performance report"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Template Type</Label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value: any) => setNewTemplate({...newTemplate, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => createTemplateMutation.mutate(newTemplate)}
                  disabled={createTemplateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates?.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(template.type)}
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {template.lastGenerated && (
                          <p className="text-xs text-muted-foreground">
                            Last generated: {new Date(template.lastGenerated).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4" />
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
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Reports</CardTitle>
                <Button onClick={() => refetchReports()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedReports?.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{report.name}</h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(report.generatedAt).toLocaleString()}
                        </span>
                        <span>By {report.generatedBy}</span>
                        {report.status === 'completed' && (
                          <span>{formatFileSize(report.fileSize)}</span>
                        )}
                      </div>

                      {report.status === 'pending' && report.progress !== undefined && (
                        <div className="mt-2">
                          <Progress value={report.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.progress}% complete
                          </p>
                        </div>
                      )}

                      {report.status === 'failed' && report.error && (
                        <p className="text-sm text-red-600 mt-1">{report.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {report.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!generatedReports || generatedReports.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports have been generated yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates?.filter(template => template.schedule?.enabled).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(template.type)}
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline">{template.schedule?.frequency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Runs {template.schedule?.frequency} at {template.schedule?.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recipients: {template.schedule?.recipients.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!templates?.some(t => t.schedule?.enabled)) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scheduled reports configured.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}