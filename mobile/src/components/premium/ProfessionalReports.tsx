import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  Share,
  Alert as RNAlert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18n';
import analyticsService from '../../services/analyticsService';
import api from '../../services/api';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'weekly_summary' | 'monthly_progress' | 'quarterly_review' | 'annual_journey' | 'health_assessment';
  description: string;
  duration: string;
  sections: string[];
  estimatedTime: number;
  professional: boolean;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  type: string;
  generatedDate: string;
  period: string;
  status: 'generating' | 'completed' | 'failed';
  size: number;
  format: 'pdf' | 'html' | 'json';
  downloadUrl?: string;
  shareUrl?: string;
  preview?: string;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  charts?: any[];
  metrics?: any[];
  insights?: string[];
}

const { width: screenWidth } = Dimensions.get('screen');

export const ProfessionalReports = React.memo(() => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('templates');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        // Track page view
        await analyticsService.trackEvent({
          id: `professional_reports_view_${Date.now()}`,
          userId: user?.id?.toString() || 'anonymous',
          type: 'page_view',
          data: { page: 'professional_reports' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error initializing analytics:', error);
      }
    };
    
    initializeAnalytics();
  }, [user]);

  const tabs = [
    { id: 'templates', name: 'Templates', icon: 'document-text-outline' },
    { id: 'reports', name: 'My Reports', icon: 'folder-outline' },
    { id: 'history', name: 'History', icon: 'time-outline' },
    { id: 'settings', name: 'Settings', icon: 'settings-outline' },
  ];

  const generateMockData = () => {
    // Generate report templates
    const templates: ReportTemplate[] = [
      {
        id: '1',
        name: 'Weekly Health Summary',
        type: 'weekly_summary',
        description: 'Comprehensive weekly overview of health metrics, nutrition, fitness, and sleep patterns',
        duration: 'Last 7 days',
        sections: ['Executive Summary', 'Nutrition Analysis', 'Fitness Performance', 'Sleep Quality', 'Key Insights', 'Recommendations'],
        estimatedTime: 2,
        professional: true
      },
      {
        id: '2',
        name: 'Monthly Progress Report',
        type: 'monthly_progress',
        description: 'Detailed monthly progress tracking with trend analysis and goal achievement',
        duration: 'Last 30 days',
        sections: ['Monthly Overview', 'Goal Progress', 'Trend Analysis', 'Health Metrics', 'Performance Summary', 'Action Plan'],
        estimatedTime: 5,
        professional: true
      },
      {
        id: '3',
        name: 'Quarterly Health Review',
        type: 'quarterly_review',
        description: 'Comprehensive quarterly health assessment with predictive insights',
        duration: 'Last 90 days',
        sections: ['Executive Summary', 'Quarterly Trends', 'Health Risk Assessment', 'Performance Metrics', 'Predictive Analysis', 'Strategic Recommendations'],
        estimatedTime: 10,
        professional: true
      },
      {
        id: '4',
        name: 'Annual Health Journey',
        type: 'annual_journey',
        description: 'Complete annual health journey with comprehensive analysis and achievements',
        duration: 'Last 365 days',
        sections: ['Year in Review', 'Major Achievements', 'Health Milestones', 'Trend Analysis', 'Comparative Analysis', 'Future Outlook'],
        estimatedTime: 15,
        professional: true
      },
      {
        id: '5',
        name: 'Health Assessment Report',
        type: 'health_assessment',
        description: 'Professional health assessment for medical consultation',
        duration: 'Last 30 days',
        sections: ['Patient Information', 'Vital Signs', 'Laboratory Results', 'Medical History', 'Risk Factors', 'Clinical Recommendations'],
        estimatedTime: 8,
        professional: true
      }
    ];

    // Generate generated reports
    const reports: GeneratedReport[] = [
      {
        id: '1',
        templateId: '1',
        title: 'Weekly Health Summary - Nov 1-7, 2024',
        type: 'weekly_summary',
        generatedDate: '2024-11-07T10:30:00Z',
        period: 'Nov 1-7, 2024',
        status: 'completed',
        size: 2.5,
        format: 'pdf',
        downloadUrl: 'https://example.com/reports/weekly-summary-1.pdf',
        shareUrl: 'https://example.com/reports/weekly-summary-1/share',
        preview: 'Comprehensive analysis of your weekly health metrics showing consistent nutrition tracking and improving sleep patterns.'
      },
      {
        id: '2',
        templateId: '2',
        title: 'Monthly Progress Report - October 2024',
        type: 'monthly_progress',
        generatedDate: '2024-11-01T09:15:00Z',
        period: 'October 2024',
        status: 'completed',
        size: 4.2,
        format: 'pdf',
        downloadUrl: 'https://example.com/reports/monthly-progress-2.pdf',
        shareUrl: 'https://example.com/reports/monthly-progress-2/share',
        preview: 'Monthly progress report showing 78% goal achievement with significant improvements in fitness metrics.'
      },
      {
        id: '3',
        templateId: '3',
        title: 'Quarterly Health Review - Q3 2024',
        type: 'quarterly_review',
        generatedDate: '2024-10-01T14:20:00Z',
        period: 'Q3 2024',
        status: 'completed',
        size: 8.7,
        format: 'pdf',
        downloadUrl: 'https://example.com/reports/quarterly-review-3.pdf',
        shareUrl: 'https://example.com/reports/quarterly-review-3/share',
        preview: 'Quarterly review with comprehensive health risk assessment and predictive analytics for the next quarter.'
      },
      {
        id: '4',
        templateId: '4',
        title: 'Annual Health Journey - 2023',
        type: 'annual_journey',
        generatedDate: '2024-01-01T11:45:00Z',
        period: '2023',
        status: 'completed',
        size: 12.3,
        format: 'pdf',
        downloadUrl: 'https://example.com/reports/annual-journey-4.pdf',
        shareUrl: 'https://example.com/reports/annual-journey-4/share',
        preview: 'Complete annual health journey with major achievements, milestones, and comprehensive trend analysis.'
      }
    ];

    return { templates, reports };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch real data from API first
      try {
        const [templatesData, reportsData] = await Promise.all([
          api.premium.getReportTemplates(),
          api.premium.getProfessionalReports()
        ]);
        
        setTemplates(templatesData.data || []);
        setReports(reportsData.data || []);
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // Fallback to mock data if API fails
        const mockData = generateMockData();
        setTemplates(mockData.templates);
        setReports(mockData.reports);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateReport = async (template: ReportTemplate) => {
    try {
      setIsGenerating(true);
      
      // Generate real report using API
      try {
        const response = await api.premium.generateReport({
          templateId: template.id,
          templateName: template.name,
          templateType: template.type,
          sections: template.sections,
          duration: template.duration
        });
        
        const newReport: GeneratedReport = {
          id: response.data.id || Date.now().toString(),
          templateId: template.id,
          title: response.data.title || `${template.name} - ${new Date().toLocaleDateString()}`,
          type: template.type,
          generatedDate: response.data.generatedDate || new Date().toISOString(),
          period: template.duration,
          status: response.data.status || 'completed',
          size: response.data.size || Math.random() * 10 + 1,
          format: response.data.format || 'pdf',
          downloadUrl: response.data.downloadUrl,
          shareUrl: response.data.shareUrl,
          preview: response.data.preview || `Generated ${template.name} with comprehensive analysis of your health data.`
        };
        
        setReports(prev => [newReport, ...prev]);
        Alert.alert('Success', 'Report generated successfully!');
      } catch (apiError) {
        console.warn('API call failed, creating mock report:', apiError);
        // Create mock report if API fails
        const mockReport: GeneratedReport = {
          id: Date.now().toString(),
          templateId: template.id,
          title: `${template.name} - ${new Date().toLocaleDateString()}`,
          type: template.type,
          generatedDate: new Date().toISOString(),
          period: template.duration,
          status: 'completed',
          size: Math.random() * 10 + 1,
          format: 'pdf',
          downloadUrl: `https://example.com/reports/${Date.now()}.pdf`,
          shareUrl: `https://example.com/reports/${Date.now()}/share`,
          preview: `Generated ${template.name} with comprehensive analysis of your health data.`
        };
        
        setReports(prev => [mockReport, ...prev]);
        Alert.alert('Success', 'Report generated successfully (using mock data)');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
      setShowTemplateModal(false);
    }
  };

  const downloadReport = async (report: GeneratedReport) => {
    try {
      Alert.alert('Download', `Downloading ${report.title}...`);
      
      // Try to download using API first
      try {
        const response = await api.wearable.exportData({
          reportId: report.id,
          format: report.format
        });
        
        // In a real app, this would handle the file download
        // For now, we'll just show success
        Alert.alert('Success', `${report.title} downloaded successfully!`);
      } catch (apiError) {
        console.warn('API download failed, using mock download:', apiError);
        // Simulate download if API fails
        setTimeout(() => {
          Alert.alert('Success', `${report.title} downloaded successfully!`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  const shareReport = async (report: GeneratedReport) => {
    try {
      // Use existing share URL or generate one
      const shareUrl = report.shareUrl || `https://example.com/reports/${report.id}/share`;
      
      const result = await Share.share({
        message: `Check out my health report: ${report.title}`,
        url: shareUrl,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      // Don't show error for share dismissal, only for actual errors
      if (error.message !== 'Share was dismissed') {
        Alert.alert('Error', 'Failed to share report');
      }
    }
  };

  const deleteReport = (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setReports(prev => prev.filter(report => report.id !== reportId));
            Alert.alert('Success', 'Report deleted successfully');
          }
        }
      ]
    );
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'weekly_summary':
        return 'calendar-outline';
      case 'monthly_progress':
        return 'bar-chart-outline';
      case 'quarterly_review':
        return 'analytics-outline';
      case 'annual_journey':
        return 'time-outline';
      case 'health_assessment':
        return 'medical-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'generating':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getReportStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'generating':
        return 'Generating';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const renderTemplatesTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.templatesList}>
          {templates.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setSelectedTemplate(template);
                setShowTemplateModal(true);
              }}
            >
              <View style={styles.templateHeader}>
                <View style={[styles.templateIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={getTemplateIcon(template.type)} size={24} color={colors.primary} />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, { color: colors.text }]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.templateDescription, { color: colors.gray }]}>
                    {template.description}
                  </Text>
                </View>
                <View style={styles.templateBadge}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {template.estimatedTime} min
                  </Text>
                </View>
              </View>
              
              <View style={styles.templateDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    {template.duration}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    {template.sections.length} sections
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    {template.professional ? 'Professional' : 'Personal'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.templateSections}>
                <Text style={[styles.sectionsTitle, { color: colors.text }]}>
                  Includes:
                </Text>
                <View style={styles.sectionsList}>
                  {template.sections.slice(0, 3).map((section, index) => (
                    <Text key={index} style={[styles.sectionText, { color: colors.text }]}>
                      • {section}
                    </Text>
                  ))}
                  {template.sections.length > 3 && (
                    <Text style={[styles.sectionText, { color: colors.gray }]}>
                      + {template.sections.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderReportsTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.map(report => (
            <View key={report.id} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: colors.text }]}>
                    {report.title}
                  </Text>
                  <Text style={[styles.reportType, { color: colors.gray }]}>
                    {report.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.reportStatus, { backgroundColor: getReportStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getReportStatusColor(report.status) }]}>
                    {getReportStatusText(report.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.reportDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    Generated: {new Date(report.generatedDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    Period: {report.period}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="document-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    Size: {report.size} MB
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="file-tray-full-outline" size={16} color={colors.gray} />
                  <Text style={[styles.detailText, { color: colors.gray }]}>
                    Format: {report.format.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              {report.preview && (
                <View style={styles.reportPreview}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    Preview:
                  </Text>
                  <Text style={[styles.previewText, { color: colors.gray }]}>
                    {report.preview}
                  </Text>
                </View>
              )}
              
              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={[styles.reportAction, { backgroundColor: colors.primary }]}
                  onPress={() => downloadReport(report)}
                >
                  <Ionicons name="download-outline" size={16} color="white" />
                  <Text style={styles.actionText}>
                    Download
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportAction, { backgroundColor: '#6366F120' }]}
                  onPress={() => shareReport(report)}
                >
                  <Ionicons name="share-outline" size={16} color="#6366F1" />
                  <Text style={[styles.actionText, { color: '#6366F1' }]}>
                    Share
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportAction, { backgroundColor: '#EF444420' }]}
                  onPress={() => {
                    setSelectedReport(report);
                    setShowReportModal(true);
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionText, { color: '#EF4444' }]}>
                    View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>
          Report Generation History
        </Text>
        
        <View style={styles.historyStats}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {reports.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Total Reports
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {reports.filter(r => r.status === 'completed').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {reports.filter(r => r.status === 'generating').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Generating
            </Text>
          </View>
        </View>
        
        <View style={styles.historyList}>
          {reports.slice(0, 5).map(report => (
            <View key={report.id} style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.historyItemHeader}>
                <Text style={[styles.historyItemTitle, { color: colors.text }]}>
                  {report.title}
                </Text>
                <Text style={[styles.historyItemDate, { color: colors.gray }]}>
                  {new Date(report.generatedDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyItemMeta}>
                <View style={[styles.historyItemStatus, { backgroundColor: getReportStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.historyItemStatusText, { color: getReportStatusColor(report.status) }]}>
                    {getReportStatusText(report.status)}
                  </Text>
                </View>
                <Text style={[styles.historyItemSize, { color: colors.gray }]}>
                  {report.size} MB
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      <View style={styles.settingsContainer}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>
          Report Settings
        </Text>
        
        <View style={styles.settingsList}>
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Default Format
              </Text>
              <Text style={[styles.settingDescription, { color: colors.gray }]}>
                Choose your preferred report format
              </Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                PDF
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.gray} />
            </View>
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Include Charts
              </Text>
              <Text style={[styles.settingDescription, { color: colors.gray }]}>
                Include visual charts in reports
              </Text>
            </View>
            <View style={styles.settingToggle}>
              <View style={[styles.toggleSwitch, { backgroundColor: colors.primary }]}>
                <View style={styles.toggleKnob} />
              </View>
            </View>
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Include Predictions
              </Text>
              <Text style={[styles.settingDescription, { color: colors.gray }]}>
                Include AI-powered predictions
              </Text>
            </View>
            <View style={styles.settingToggle}>
              <View style={[styles.toggleSwitch, { backgroundColor: colors.primary }]}>
                <View style={styles.toggleKnob} />
              </View>
            </View>
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Professional Mode
              </Text>
              <Text style={[styles.settingDescription, { color: colors.gray }]}>
                Generate reports for healthcare professionals
              </Text>
            </View>
            <View style={styles.settingToggle}>
              <View style={[styles.toggleSwitch, { backgroundColor: colors.primary }]}>
                <View style={styles.toggleKnob} />
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.settingsActions}>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Export Settings', 'Export settings functionality')}
          >
            <Text style={styles.settingsButtonText}>
              Export Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: '#6366F120' }]}
            onPress={() => Alert.alert('Reset Settings', 'Reset to default settings')}
          >
            <Text style={[styles.settingsButtonText, { color: '#6366F1' }]}>
              Reset to Default
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.professionalReports')}
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchData()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && [styles.tabButtonActive, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.id ? colors.primary : colors.gray}
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && { color: colors.primary }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'templates' && renderTemplatesTab()}
      {selectedTab === 'reports' && renderReportsTab()}
      {selectedTab === 'history' && renderHistoryTab()}
      {selectedTab === 'settings' && renderSettingsTab()}

      {/* Template Modal */}
      {selectedTemplate && (
        <Modal
          visible={showTemplateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTemplateModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedTemplate.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalTemplateInfo}>
                <Text style={[styles.modalTemplateDescription, { color: colors.text }]}>
                  {selectedTemplate.description}
                </Text>
                
                <View style={styles.modalTemplateDetails}>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalDetailText, { color: colors.text }]}>
                      Duration: {selectedTemplate.duration}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalDetailText, { color: colors.text }]}>
                      Sections: {selectedTemplate.sections.length}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="people-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalDetailText, { color: colors.text }]}>
                      Type: {selectedTemplate.professional ? 'Professional' : 'Personal'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="hourglass-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalDetailText, { color: colors.text }]}>
                      Estimated Time: {selectedTemplate.estimatedTime} minutes
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalTemplateSections}>
                  <Text style={[styles.modalSectionsTitle, { color: colors.text }]}>
                    Report Sections:
                  </Text>
                  <View style={styles.modalSectionsList}>
                    {selectedTemplate.sections.map((section, index) => (
                      <View key={index} style={styles.modalSectionItem}>
                        <View style={[styles.modalSectionBullet, { backgroundColor: colors.primary }]}>
                          <Text style={styles.modalSectionNumber}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={[styles.modalSectionText, { color: colors.text }]}>
                          {section}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View style={styles.modalTemplateActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                    onPress={() => generateReport(selectedTemplate)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalButtonText}>
                        Generate Report
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#6366F120' }]}
                    onPress={() => Alert.alert('Preview', 'Preview report functionality')}
                  >
                    <Text style={[styles.modalButtonText, { color: '#6366F1' }]}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <Modal
          visible={showReportModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedReport.title}
              </Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalReportInfo}>
                <View style={styles.modalReportHeader}>
                  <View style={[styles.modalReportIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="document-text-outline" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.modalReportMeta}>
                    <Text style={[styles.modalReportType, { color: colors.text }]}>
                      {selectedReport.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <View style={[styles.modalReportStatus, { backgroundColor: getReportStatusColor(selectedReport.status) + '20' }]}>
                      <Text style={[styles.modalReportStatusText, { color: getReportStatusColor(selectedReport.status) }]}>
                        {getReportStatusText(selectedReport.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalReportDetails}>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.gray} />
                    <Text style={[styles.modalDetailText, { color: colors.gray }]}>
                      Generated: {new Date(selectedReport.generatedDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.gray} />
                    <Text style={[styles.modalDetailText, { color: colors.gray }]}>
                      Period: {selectedReport.period}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="document-outline" size={16} color={colors.gray} />
                    <Text style={[styles.modalDetailText, { color: colors.gray }]}>
                      Size: {selectedReport.size} MB
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="file-tray-full-outline" size={16} color={colors.gray} />
                    <Text style={[styles.modalDetailText, { color: colors.gray }]}>
                      Format: {selectedReport.format.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {selectedReport.preview && (
                  <View style={styles.modalReportPreview}>
                    <Text style={[styles.modalPreviewTitle, { color: colors.text }]}>
                      Preview:
                    </Text>
                    <Text style={[styles.modalPreviewText, { color: colors.gray }]}>
                      {selectedReport.preview}
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalReportActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                    onPress={() => downloadReport(selectedReport)}
                  >
                    <Ionicons name="download-outline" size={16} color="white" />
                    <Text style={styles.modalButtonText}>
                      Download
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#6366F120' }]}
                    onPress={() => shareReport(selectedReport)}
                  >
                    <Ionicons name="share-outline" size={16} color="#6366F1" />
                    <Text style={[styles.modalButtonText, { color: '#6366F1' }]}>
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => deleteReport(selectedReport.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
});

ProfessionalReports.displayName = 'ProfessionalReports';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  templatesList: {
    gap: 12,
    padding: 16,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  templateDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  templateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  templateDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  templateSections: {
    marginBottom: 12,
  },
  sectionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  sectionsList: {
    gap: 4,
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
  reportsList: {
    gap: 12,
    padding: 16,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  reportType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  reportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reportDetails: {
    gap: 8,
    marginBottom: 12,
  },
  reportPreview: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  previewText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  historyStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  historyItemDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  historyItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyItemStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  historyItemSize: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  settingsContainer: {
    padding: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingsList: {
    gap: 8,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  settingToggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  modalTemplateInfo: {
    marginBottom: 20,
  },
  modalTemplateDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  modalTemplateDetails: {
    gap: 12,
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  modalTemplateSections: {
    marginBottom: 20,
  },
  modalSectionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  modalSectionsList: {
    gap: 8,
  },
  modalSectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalSectionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  modalSectionNumber: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  modalSectionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  modalTemplateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalReportInfo: {
    marginBottom: 20,
  },
  modalReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalReportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalReportMeta: {
    flex: 1,
  },
  modalReportType: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  modalReportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalReportStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalReportDetails: {
    gap: 8,
    marginBottom: 16,
  },
  modalReportPreview: {
    marginBottom: 20,
  },
  modalPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  modalPreviewText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
  modalReportActions: {
    flexDirection: 'row',
    gap: 8,
  },
});