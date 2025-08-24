// Reporting Types for Reporting Service

export type ReportType = 'nutrition' | 'fitness' | 'health' | 'progress' | 'compliance' | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html' | 'docx';

export type ReportStatus = 'draft' | 'generating' | 'completed' | 'scheduled' | 'failed' | 'cancelled';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type ReportSchedule = {
  frequency: ReportFrequency;
  interval: number;
  time: string;
  days?: number[];
  startDate: Date;
  endDate?: Date;
  timezone: string;
  nextRun: Date;
  lastRun?: Date;
  runCount: number;
  isActive: boolean;
};

export type ReportData = {
  userId: string;
  type: ReportType;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target?: number;
  }>;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar';
    title: string;
    data: any;
    xAxis: string;
    yAxis: string;
  }>;
  tables: Array<{
    title: string;
    headers: string[];
    rows: any[][];
  }>;
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    median: number;
    mode: number;
    standardDeviation: number;
    variance: number;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    impact: 'low' | 'medium' | 'high';
  }>;
};

export type ReportAnalytics = {
  userId: string;
  reportId: string;
  type: ReportType;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target?: number;
    progress: number;
  }>;
  trends: Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    significance: 'high' | 'medium' | 'low';
    correlation?: number;
  }>;
  correlations: Array<{
    metric1: string;
    metric2: string;
    correlation: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  predictions: Array<{
    metric: string;
    predictedValue: number;
    confidence: number;
    timeframe: string;
  }>;
  benchmarks: Array<{
    metric: string;
    value: number;
    target: number;
    status: 'exceeded' | 'met' | 'below';
    category: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    impact: 'low' | 'medium' | 'high';
    feasibility: 'easy' | 'medium' | 'hard';
  }>;
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
  }>;
};

export type ReportExport = {
  id: string;
  reportId: string;
  format: ReportFormat;
  size: number;
  url: string;
  expiresAt: Date;
  createdAt: Date;
  downloaded: boolean;
  downloadCount: number;
  shared: boolean;
  shareCount: number;
};

export type ReportSubscription = {
  id: string;
  userId: string;
  templateId: string;
  template: ReportTemplate;
  schedule: ReportSchedule;
  recipients: Array<{
    email: string;
    name: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
  }>;
  settings: {
    format: ReportFormat;
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
  };
  notifications: {
    beforeGeneration: boolean;
    afterGeneration: boolean;
    onDelivery: boolean;
    onView: boolean;
  };
  status: 'active' | 'paused' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  nextRun: Date;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
  lastError?: string;
};

export type ReportNotification = {
  id: string;
  userId: string;
  type: 'generation' | 'delivery' | 'view' | 'error';
  title: string;
  message: string;
  reportId?: string;
  subscriptionId?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: {
    reportTitle?: string;
    subscriptionName?: string;
    error?: string;
    deliveryStatus?: 'sent' | 'delivered' | 'failed';
    viewCount?: number;
  };
};

export type BaseReport = {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  data: ReportData;
  analytics: ReportAnalytics;
  export?: ReportExport;
  schedule?: ReportSchedule;
  settings: {
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
    dateRange: {
      start: Date;
      end: Date;
    };
    filters: {
      meals?: boolean;
      workouts?: boolean;
      sleep?: boolean;
      weight?: boolean;
      vitals?: boolean;
      medications?: boolean;
      mood?: boolean;
    };
  };
  recipients: Array<{
    email: string;
    name: string;
    role: string;
    status: 'sent' | 'delivered' | 'opened' | 'failed';
    sentAt: Date;
    openedAt?: Date;
  }>;
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
    delete: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
  size?: number;
  downloadCount: number;
  shareCount: number;
  viewCount: number;
  tags: string[];
  category: string;
  isTemplate: boolean;
  templateId?: string;
  isPublic: boolean;
  isScheduled: boolean;
  isShared: boolean;
  isDownloaded: boolean;
  error?: string;
  errorCount: number;
};

export type ReportTemplate = {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  data: ReportData;
  settings: {
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
    dateRange: {
      start: Date;
      end: Date;
    };
    filters: {
      meals?: boolean;
      workouts?: boolean;
      sleep?: boolean;
      weight?: boolean;
      vitals?: boolean;
      medications?: boolean;
      mood?: boolean;
    };
  };
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
    delete: string[];
  };
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  };
  preview?: {
    thumbnail: string;
    description: string;
    metrics: string[];
  };
};

export type ReportChart = {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar' | 'heatmap' | 'gauge' | 'funnel';
  title: string;
  subtitle?: string;
  data: any;
  xAxis: {
    label: string;
    type: 'category' | 'number' | 'date' | 'datetime';
    format?: string;
  };
  yAxis: {
    label: string;
    type: 'category' | 'number' | 'date' | 'datetime';
    format?: string;
  };
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right' | 'none';
  };
  tooltip: {
    show: boolean;
    format?: string;
  };
  colors: string[];
  dimensions: {
    width: number;
    height: number;
  };
  responsive: boolean;
  animation: boolean;
  interactive: boolean;
  exportable: boolean;
  printable: boolean;
};

export type ReportTable = {
  id: string;
  title: string;
  subtitle?: string;
  headers: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
    format?: string;
    sortable: boolean;
    filterable: boolean;
    width?: number;
    align: 'left' | 'center' | 'right';
  }>;
  rows: any[][];
  pagination: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
    totalRows: number;
    totalPages: number;
  };
  sorting: {
    enabled: boolean;
    column: string;
    direction: 'asc' | 'desc';
  };
  filtering: {
    enabled: boolean;
    columns: string[];
    global: boolean;
  };
  search: {
    enabled: boolean;
    placeholder: string;
  };
  exportable: boolean;
  printable: boolean;
  downloadable: boolean;
  shareable: boolean;
};

export type ReportSummary = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'kpi' | 'metric' | 'indicator' | 'score';
  value: number;
  unit: string;
  target?: number;
  status: 'exceeded' | 'met' | 'below' | 'on_track';
  trend: 'up' | 'down' | 'stable';
  change: number;
  changeType: 'absolute' | 'percentage';
  icon?: string;
  color: string;
  description?: string;
  details?: Array<{
    label: string;
    value: number;
    unit: string;
  }>;
  chart?: ReportChart;
  comparison?: {
    period: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  insights?: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
};

export type ReportInsight = {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'benchmark' | 'recommendation';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: Array<{
    type: string;
    data: any;
    weight: number;
  }>;
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
  timeframe: string;
  category: string;
  tags: string[];
  relatedInsights: string[];
  createdAt: Date;
  updatedAt: Date;
  isActionable: boolean;
  isResolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
  assignedTo?: string;
  dueDate?: Date;
};

export type ReportRecommendation = {
  id: string;
  type: 'nutrition' | 'fitness' | 'health' | 'lifestyle' | 'behavior' | 'medical';
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
  feasibility: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: Array<{
    type: string;
    data: any;
    weight: number;
  }>;
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    target: number;
    progress: number;
  }>;
  timeframe: string;
  category: string;
  tags: string[];
  relatedRecommendations: string[];
  createdAt: Date;
  updatedAt: Date;
  isActionable: boolean;
  isImplemented: boolean;
  implementedAt?: Date;
  results?: Array<{
    metric: string;
    before: number;
    after: number;
    change: number;
    improvement: number;
  }>;
  assignedTo?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
};

export type ReportAlert = {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  timeframe: string;
  category: string;
  tags: string[];
  relatedAlerts: string[];
  createdAt: Date;
  expiresAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  actions: Array<{
    type: 'notification' | 'email' | 'sms' | 'push' | 'webhook';
    recipient: string;
    sent: boolean;
    sentAt?: Date;
    delivered: boolean;
    deliveredAt?: Date;
    opened: boolean;
    openedAt?: Date;
  }>;
};

export type ReportBenchmark = {
  id: string;
  name: string;
  category: string;
  type: 'absolute' | 'relative' | 'percentage';
  value: number;
  unit: string;
  source: string;
  description: string;
  methodology: string;
  population: string;
  timeframe: string;
  reliability: 'high' | 'medium' | 'low';
  references: Array<{
    type: 'study' | 'article' | 'website' | 'database';
    title: string;
    url?: string;
    author: string;
    year: number;
  }>;
  relatedBenchmarks: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ReportPrediction = {
  id: string;
  metric: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'moving_average' | 'seasonal';
  model: string;
  algorithm: string;
  trainingData: {
    size: number;
    timeframe: string;
    quality: 'high' | 'medium' | 'low';
  };
  prediction: {
    value: number;
    confidence: number;
    interval: {
      lower: number;
      upper: number;
    };
    timeframe: string;
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  factors: Array<{
    name: string;
    coefficient: number;
    importance: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  accuracy: {
    rSquared: number;
    meanAbsoluteError: number;
    rootMeanSquareError: number;
    meanAbsolutePercentageError: number;
  };
  assumptions: Array<{
    name: string;
    description: string;
    validity: 'high' | 'medium' | 'low';
  }>;
  limitations: Array<{
    name: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
};

export type ReportCorrelation = {
  id: string;
  metric1: string;
  metric2: string;
  correlation: number;
  significance: 'high' | 'medium' | 'low';
  type: 'positive' | 'negative' | 'none';
  strength: 'strong' | 'moderate' | 'weak';
  method: 'pearson' | 'spearman' | 'kendall' | 'point_biserial';
  sampleSize: number;
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  data: Array<{
    x: number;
    y: number;
  }>;
  trendline?: {
    equation: string;
    rSquared: number;
  };
  interpretation: string;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportTrend = {
  id: string;
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  significance: 'high' | 'medium' | 'low';
  timeframe: string;
  change: number;
  changeType: 'absolute' | 'percentage';
  baseline: number;
  current: number;
  projected?: number;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  seasonality: {
    detected: boolean;
    pattern: string;
    strength: number;
  };
  volatility: number;
  consistency: number;
  sustainability: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportCompliance = {
  id: string;
  standard: string;
  version: string;
  category: string;
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    evidence: Array<{
      type: string;
      description: string;
      url?: string;
    }>;
    findings: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }>;
  }>;
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  maxScore: number;
  percentage: number;
  auditDate: Date;
  nextAuditDate: Date;
  auditor: string;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportCustom = {
  id: string;
  name: string;
  description: string;
  type: 'custom';
  data: any;
  structure: {
    sections: Array<{
      id: string;
      title: string;
      order: number;
      content: any;
      charts?: ReportChart[];
      tables?: ReportTable[];
      summaries?: ReportSummary[];
    }>;
  };
  settings: {
    branding: {
      logo?: string;
      colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
      };
      fonts: {
        heading: string;
        body: string;
      };
    };
    layout: {
      orientation: 'portrait' | 'landscape';
      margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      spacing: number;
    };
    sections: {
      includeHeader: boolean;
      includeFooter: boolean;
      includeTableOfContents: boolean;
      includePageNumbers: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
};

export type Report = BaseReport | ReportCustom;