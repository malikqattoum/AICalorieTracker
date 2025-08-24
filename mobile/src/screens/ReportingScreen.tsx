import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
  Animated,
  Alert,
  Share,
  Switch,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import reportingService, {
  ReportingFeature,
  CreateReportRequest,
  GenerateReportRequest,
  GetReportsRequest,
  GetReportsResponse,
  Report,
  ReportType,
  ReportFormat,
  ReportStatus,
  ReportSchedule,
  ReportTemplate,
  ReportAnalytics,
  ReportSubscription,
  ReportNotification,
} from '../types/reporting';
import i18n from '../i18n';

type ReportCardProps = {
  report: Report;
  onPress: (reportId: string) => void;
  onShare: (reportId: string) => void;
  onDelete: (reportId: string) => void;
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onPress, onShare, onDelete }) => {
  const { colors } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Implement delete logic
      Alert.alert(
        'Delete Report',
        'Are you sure you want to delete this report?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => onDelete(report.id)
          }
        ]
      );
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'generating':
        return '#F59E0B';
      case 'scheduled':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      case 'draft':
        return '#6B7280';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'generating':
        return 'Generating';
      case 'scheduled':
        return 'Scheduled';
      case 'failed':
        return 'Failed';
      case 'draft':
        return 'Draft';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'nutrition':
        return 'restaurant';
      case 'fitness':
        return 'fitness';
      case 'health':
        return 'heart';
      case 'progress':
        return 'trending-up';
      case 'compliance':
        return 'shield-checkmark';
      case 'custom':
        return 'document-text';
      default:
        return 'document';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(report.id)}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportType}>
          <Ionicons name={getTypeIcon(report.type)} size={20} color={colors.primary} />
          <Text style={[styles.reportTypeText, { color: colors.text }]}>
            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
          </Text>
        </View>
        <View style={[styles.reportStatus, { backgroundColor: getStatusColor(report.status) + '20' }]}>
          <Text style={[styles.reportStatusText, { color: getStatusColor(report.status) }]}>
            {getStatusText(report.status)}
          </Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          {report.title}
        </Text>
        <Text style={[styles.reportDescription, { color: colors.gray }]}>
          {report.description}
        </Text>
        
        <View style={styles.reportMetrics}>
          <View style={styles.reportMetric}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray} />
            <Text style={[styles.reportMetricText, { color: colors.gray }]}>
              {new Date(report.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.reportMetric}>
            <Ionicons name="file-tray-outline" size={16} color={colors.gray} />
            <Text style={[styles.reportMetricText, { color: colors.gray }]}>
              {report.format.toUpperCase()}
            </Text>
          </View>
          <View style={styles.reportMetric}>
            <Ionicons name="eye-outline" size={16} color={colors.gray} />
            <Text style={[styles.reportMetricText, { color: colors.gray }]}>
              {report.viewCount} views
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity
          style={[styles.reportAction, { backgroundColor: colors.primary }]}
          onPress={() => onPress(report.id)}
        >
          <Ionicons name="eye-outline" size={16} color="white" />
          <Text style={styles.reportActionText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.reportAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => onShare(report.id)}
        >
          <Ionicons name="share-outline" size={16} color={colors.text} />
          <Text style={[styles.reportActionText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.reportAction, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color={colors.text} />
              <Text style={[styles.reportActionText, { color: colors.text }]}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function ReportingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([]);
  const [notifications, setNotifications] = useState<ReportNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'subscriptions' | 'analytics'>('reports');
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<ReportSubscription | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadReports();
    loadTemplates();
    loadSubscriptions();
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check notifications every 30 seconds
    
    return () => clearInterval(interval);
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (reports.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [reports]);

  const loadReports = async () => {
    if (!hasMore && !isRefreshing) return;
    
    setIsLoading(true);
    try {
      const request: GetReportsRequest = {
        userId: user?.id || '',
        limit,
        offset,
        sortBy: 'created',
        sortOrder: 'desc',
      };
      
      const response = await reportingService.getReports(request);
      
      if (response.success && response.data) {
        const newReports = response.data.reports;
        setReports(prev => offset === 0 ? newReports : [...prev, ...newReports]);
        setHasMore(response.data.pagination.hasMore);
        setOffset(response.data.pagination.nextOffset);
      }
    } catch (error) {
      console.error('Reports loading error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const request = {
        userId: user?.id || '',
        limit: 20,
        offset: 0,
      };
      
      const response = await reportingService.getReportTemplates(request);
      
      if (response.success && response.data) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Templates loading error:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const request = {
        userId: user?.id || '',
        limit: 20,
        offset: 0,
      };
      
      const response = await reportingService.getReportSubscriptions(request);
      
      if (response.success && response.data) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error('Subscriptions loading error:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const request = {
        userId: user?.id || '',
        limit: 10,
        offset: 0,
      };
      
      const response = await reportingService.getReportNotifications(request);
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Notifications loading error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setOffset(0);
    setHasMore(true);
    await loadReports();
  };

  const handleLoadMore = async () => {
    if (!isLoading && hasMore) {
      await loadReports();
    }
  };

  const handleCreateReport = async (request: CreateReportRequest) => {
    try {
      const response = await reportingService.createReport(request);
      
      if (response.success) {
        setShowCreateReport(false);
        // Refresh reports
        setOffset(0);
        setHasMore(true);
        await loadReports();
      } else {
        Alert.alert('Error', 'Failed to create report');
      }
    } catch (error) {
      console.error('Report creation error:', error);
      Alert.alert('Error', 'Failed to create report');
    }
  };

  const handleGenerateReport = async (request: GenerateReportRequest) => {
    try {
      const response = await reportingService.generateReport(request);
      
      if (response.success) {
        // Refresh reports
        setOffset(0);
        setHasMore(true);
        await loadReports();
      } else {
        Alert.alert('Error', 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const handleShareReport = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;
      
      await Share.share({
        message: report.title,
        title: 'Report Share',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      // Implement delete logic
      setReports(prev => prev.filter(r => r.id !== reportId));
      Alert.alert('Success', 'Report deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete report');
    }
  };

  const handleCreateTemplate = async (template: ReportTemplate) => {
    try {
      const request = {
        userId: user?.id || '',
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        data: template.data,
        settings: template.settings,
        permissions: template.permissions,
        isPublic: template.isPublic,
        tags: template.tags,
      };
      
      const response = await reportingService.createReportTemplate(request);
      
      if (response.success) {
        setShowCreateTemplate(false);
        await loadTemplates();
      } else {
        Alert.alert('Error', 'Failed to create template');
      }
    } catch (error) {
      console.error('Template creation error:', error);
      Alert.alert('Error', 'Failed to create template');
    }
  };

  const handleCreateSubscription = async (subscription: ReportSubscription) => {
    try {
      const request = {
        userId: user?.id || '',
        templateId: subscription.templateId,
        schedule: subscription.schedule,
        recipients: subscription.recipients,
        settings: subscription.settings,
        notifications: subscription.notifications,
      };
      
      const response = await reportingService.createReportSubscription(request);
      
      if (response.success) {
        setShowCreateSubscription(false);
        await loadSubscriptions();
      } else {
        Alert.alert('Error', 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <ReportCard
      report={item}
      onPress={(reportId) => setSelectedReport(reports.find(r => r.id === reportId) || null)}
      onShare={handleShareReport}
      onDelete={handleDeleteReport}
    />
  );

  const renderTemplate = ({ item }: { item: ReportTemplate }) => (
    <TouchableOpacity
      style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateType}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={[styles.templateTypeText, { color: colors.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={styles.templateCategory}>
          <Text style={[styles.templateCategoryText, { color: colors.gray }]}>
            {item.category}
          </Text>
        </View>
      </View>
      
      <View style={styles.templateContent}>
        <Text style={[styles.templateTitle, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.templateDescription, { color: colors.gray }]}>
          {item.description}
        </Text>
        
        <View style={styles.templateStats}>
          <View style={styles.templateStat}>
            <Ionicons name="eye-outline" size={14} color={colors.gray} />
            <Text style={[styles.templateStatText, { color: colors.gray }]}>
              {item.usageCount} uses
            </Text>
          </View>
          <View style={styles.templateStat}>
            <Ionicons name="star-outline" size={14} color={colors.gray} />
            <Text style={[styles.templateStatText, { color: colors.gray }]}>
              {item.rating}/5
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSubscription = ({ item }: { item: ReportSubscription }) => (
    <TouchableOpacity
      style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedSubscription(item)}
    >
      <View style={styles.subscriptionHeader}>
        <View style={styles.subscriptionType}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={[styles.subscriptionTypeText, { color: colors.text }]}>
            {item.template.type.charAt(0).toUpperCase() + item.template.type.slice(1)}
          </Text>
        </View>
        <View style={[styles.subscriptionStatus, { backgroundColor: item.status === 'active' ? '#10B98120' : '#6B728020' }]}>
          <Text style={[styles.subscriptionStatusText, { color: item.status === 'active' ? '#10B981' : '#6B7280' }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.subscriptionContent}>
        <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
          {item.template.name}
        </Text>
        <Text style={[styles.subscriptionDescription, { color: colors.gray }]}>
          {item.template.description}
        </Text>
        
        <View style={styles.subscriptionSchedule}>
          <Ionicons name="calendar-outline" size={14} color={colors.gray} />
          <Text style={[styles.subscriptionScheduleText, { color: colors.gray }]}>
            {item.schedule.frequency} • {item.schedule.time}
          </Text>
        </View>
        
        <View style={styles.subscriptionStats}>
          <View style={styles.subscriptionStat}>
            <Ionicons name="play-outline" size={14} color={colors.gray} />
            <Text style={[styles.subscriptionStatText, { color: colors.gray }]}>
              {item.runCount} runs
            </Text>
          </View>
          <View style={styles.subscriptionStat}>
            <Ionicons name="time-outline" size={14} color={colors.gray} />
            <Text style={[styles.subscriptionStatText, { color: colors.gray }]}>
              Next: {new Date(item.nextRun).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Advanced Reporting
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.notificationButton, { position: 'relative' }]}
            onPress={() => {/* Navigate to notifications */}}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateReport(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.tabs}>
        {(['reports', 'templates', 'subscriptions', 'analytics'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && { color: colors.primary }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {renderHeader()}

      {/* Create Report Modal */}
      <Modal
        visible={showCreateReport}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.createModal, { backgroundColor: colors.background }]}>
          <View style={[styles.createModalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.createModalTitle, { color: colors.text }]}>
              Create Report
            </Text>
            <View style={styles.createModalActions}>
              <TouchableOpacity onPress={() => setShowCreateReport(false)}>
                <Text style={[styles.cancelButton, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => {/* Handle create report */}}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.createModalContent}>
            <View style={styles.createForm}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Report Type
                </Text>
                <Picker
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text }]}
                  selectedValue="nutrition"
                  onValueChange={(value) => console.log('Type:', value)}
                >
                  <Picker.Item label="Nutrition" value="nutrition" />
                  <Picker.Item label="Fitness" value="fitness" />
                  <Picker.Item label="Health" value="health" />
                  <Picker.Item label="Progress" value="progress" />
                  <Picker.Item label="Compliance" value="compliance" />
                  <Picker.Item label="Custom" value="custom" />
                </Picker>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Title
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter report title"
                  placeholderTextColor={colors.gray}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Description
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter report description"
                  placeholderTextColor={colors.gray}
                  multiline
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Format
                </Text>
                <Picker
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text }]}
                  selectedValue="pdf"
                  onValueChange={(value) => console.log('Format:', value)}
                >
                  <Picker.Item label="PDF" value="pdf" />
                  <Picker.Item label="Excel" value="excel" />
                  <Picker.Item label="CSV" value="csv" />
                  <Picker.Item label="JSON" value="json" />
                  <Picker.Item label="HTML" value="html" />
                  <Picker.Item label="DOCX" value="docx" />
                </Picker>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Date Range
                </Text>
                <View style={styles.dateRange}>
                  <DatePickerIOS
                    date={new Date()}
                    onDateChange={(date) => console.log('Start date:', date)}
                    style={styles.datePicker}
                  />
                  <DatePickerIOS
                    date={new Date()}
                    onDateChange={(date) => console.log('End date:', date)}
                    style={styles.datePicker}
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Include Charts
                </Text>
                <Switch
                  value={true}
                  onValueChange={(value) => console.log('Include charts:', value)}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor="white"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Include Recommendations
                </Text>
                <Switch
                  value={true}
                  onValueChange={(value) => console.log('Include recommendations:', value)}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor="white"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Content */}
      <FlatList
        data={activeTab === 'reports' ? reports : activeTab === 'templates' ? templates : activeTab === 'subscriptions' ? subscriptions : []}
        renderItem={activeTab === 'reports' ? renderReport : activeTab === 'templates' ? renderTemplate : activeTab === 'subscriptions' ? renderSubscription : () => null}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        style={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  reportCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  reportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportStatusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  reportMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  reportMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportMetricText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  reportActionText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  templateCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateTypeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  templateCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  templateCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  templateContent: {
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  templateStats: {
    flexDirection: 'row',
    gap: 16,
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateStatText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  subscriptionCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTypeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  subscriptionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  subscriptionContent: {
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  subscriptionDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  subscriptionSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  subscriptionScheduleText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  subscriptionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  subscriptionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subscriptionStatText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  createModal: {
    flex: 1,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createModalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createModalContent: {
    flex: 1,
  },
  createForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  dateRange: {
    flexDirection: 'row',
    gap: 8,
  },
  datePicker: {
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});