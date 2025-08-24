import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Progress } from "../../components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  Activity, 
  Heart, 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Calendar,
  Award,
  Users,
  Download,
  Share2,
  Settings,
  RefreshCw
} from "lucide-react";

// Mock data for demonstration
const generateMockHealthScores = () => [
  { date: '2024-01-01', nutrition: 85, fitness: 78, recovery: 82, consistency: 75, overall: 80 },
  { date: '2024-01-02', nutrition: 88, fitness: 82, recovery: 85, consistency: 78, overall: 83 },
  { date: '2024-01-03', nutrition: 82, fitness: 80, recovery: 83, consistency: 80, overall: 81 },
  { date: '2024-01-04', nutrition: 90, fitness: 85, recovery: 88, consistency: 82, overall: 86 },
  { date: '2024-01-05', nutrition: 87, fitness: 83, recovery: 86, consistency: 85, overall: 85 },
  { date: '2024-01-06', nutrition: 89, fitness: 87, recovery: 89, consistency: 88, overall: 88 },
  { date: '2024-01-07', nutrition: 92, fitness: 90, recovery: 91, consistency: 90, overall: 91 },
];

const generateMockPredictions = () => [
  { type: 'Weight Projection', current: 75, predicted: 73, confidence: 85, trend: 'down' },
  { type: 'Goal Achievement', current: 65, predicted: 78, confidence: 92, trend: 'up' },
  { type: 'Health Risk', current: 20, predicted: 15, confidence: 78, trend: 'down' },
  { type: 'Performance', current: 70, predicted: 82, confidence: 88, trend: 'up' },
];

const generateMockPatternAnalysis = () => [
  { pattern: 'Sleep-Nutrition', correlation: 0.78, strength: 'Strong' },
  { pattern: 'Exercise-Nutrition', correlation: 0.65, strength: 'Moderate' },
  { pattern: 'Stress-Eating', correlation: 0.45, strength: 'Weak' },
  { pattern: 'Metabolic Rate', correlation: 0.82, strength: 'Strong' },
];

const generateMockRealTimeData = () => [
  { metric: 'Heart Rate', value: 72, target: 60-100, status: 'normal' },
  { metric: 'Blood Pressure', value: '120/80', target: '<120/80', status: 'optimal' },
  { metric: 'Sleep Quality', value: 85, target: '>80', status: 'good' },
  { metric: 'Activity Level', value: 78, target: '>75', status: 'good' },
  { metric: 'Stress Level', value: 32, target: '<35', status: 'good' },
  { metric: 'Hydration', value: 68, target: '>80', status: 'low' },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function PremiumAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<any[]>([]);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHealthScores(generateMockHealthScores());
      setPredictions(generateMockPredictions());
      setPatternAnalysis(generateMockPatternAnalysis());
      setRealTimeData(generateMockRealTimeData());
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
      case 'optimal':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading premium analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Premium Analytics</h1>
          <p className="text-gray-600">Comprehensive health insights and predictions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Health Scores Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3%</span> from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fitness</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">90</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+7%</span> from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Scores Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Health Scores Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#4F46E5" strokeWidth={2} />
                    <Line type="monotone" dataKey="nutrition" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="fitness" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="recovery" stroke="#EF4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="consistency" stroke="#8B5CF6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Current Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthScores.slice(-1)[0]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="nutrition" fill="#10B981" />
                    <Bar dataKey="fitness" fill="#F59E0B" />
                    <Bar dataKey="recovery" fill="#EF4444" />
                    <Bar dataKey="consistency" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Nutrition Master</p>
                    <p className="text-sm text-gray-600">7-day streak</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Goal Achiever</p>
                    <p className="text-sm text-gray-600">Weight loss target</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Consistency King</p>
                    <p className="text-sm text-gray-600">30-day perfect</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {prediction.type}
                    <Badge variant={prediction.trend === 'up' ? 'default' : 'secondary'}>
                      {getTrendIcon(prediction.trend)} {prediction.trend}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Current</span>
                        <span className="font-medium">{prediction.current}</span>
                      </div>
                      <Progress value={prediction.current} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Predicted</span>
                        <span className="font-medium">{prediction.predicted}</span>
                      </div>
                      <Progress value={prediction.predicted} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="font-medium">{prediction.confidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Weight Management</h4>
                  <p className="text-sm text-blue-700">
                    Based on your current trends, you're likely to reach your target weight in 3-4 weeks. 
                    Consider maintaining your current exercise routine and slightly increasing protein intake.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Performance Optimization</h4>
                  <p className="text-sm text-green-700">
                    Your fitness performance is improving steadily. We predict a 15% increase in your 
                    workout efficiency over the next month if you continue your current regimen.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Health Risk Alert</h4>
                  <p className="text-sm text-yellow-700">
                    Your stress levels show a slight upward trend. Consider incorporating meditation 
                    or relaxation techniques into your daily routine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Health Pattern Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patternAnalysis.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{pattern.pattern}</p>
                        <p className="text-sm text-gray-600">Correlation: {pattern.correlation}</p>
                      </div>
                      <Badge variant={pattern.strength === 'Strong' ? 'default' : 'secondary'}>
                        {pattern.strength}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Pattern Strength Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={patternAnalysis}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="pattern" />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} />
                    <Radar
                      name="Correlation"
                      dataKey="correlation"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Pattern Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Pattern Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Sleep-Nutrition Correlation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Strong correlation (0.78) between sleep quality and nutrition consistency. 
                    Better sleep leads to better food choices.
                  </p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${0.78 * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Exercise-Nutrition Correlation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Moderate correlation (0.65) between exercise intensity and nutrition quality. 
                    More active days show better dietary choices.
                  </p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${0.65 * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realTimeData.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status === 'optimal' || metric.status === 'good' ? 'bg-green-500' : 
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    Target: {metric.target}
                  </p>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Real-time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={realTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Weekly Summary
                  <Badge>Ready</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive weekly overview of your health metrics and progress.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pages</span>
                    <span>12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Charts</span>
                    <span>8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Generated</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Monthly Progress
                  <Badge>Processing</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Detailed monthly progress tracking with trend analysis.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pages</span>
                    <span>24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Charts</span>
                    <span>15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated</span>
                    <span>5 min</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-4" disabled>
                  Generating...
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Health Assessment
                  <Badge>New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Professional health assessment for medical consultation.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pages</span>
                    <span>18</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Charts</span>
                    <span>12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Format</span>
                    <span>PDF</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Weekly Summary', icon: Calendar, desc: '7-day overview' },
                  { name: 'Monthly Progress', icon: TrendingUp, desc: '30-day analysis' },
                  { name: 'Quarterly Review', icon: Award, desc: '90-day assessment' },
                  { name: 'Annual Journey', icon: Users, desc: 'Year in review' },
                ].map((template, index) => (
                  <div key={index} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <template.icon className="h-8 w-8 text-blue-500 mb-2" />
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}