import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import healthcareService, { 
  HealthcareProvider, 
  HealthcareConnection, 
  HealthcareInsight,
  HealthcareReport,
  HealthcareProviderConfig 
} from '../services/healthcareService';
import i18n from '../i18n';

type ProviderCardProps = {
  provider: HealthcareProviderConfig;
  isConnected: boolean;
  onPress: () => void;
};

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, isConnected, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.providerCard,
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          opacity: isConnected ? 1 : 0.7
        }
      ]}
      onPress={onPress}
      disabled={isConnected}
    >
      <View style={styles.providerHeader}>
        <View style={[styles.providerIcon, { backgroundColor: provider.isPremium ? '#F59E0B20' : '#10B98120' }]}>
          <Ionicons 
            name={provider.type === 'apple_health' ? 'fitness' :
                  provider.type === 'google_fit' ? 'fitness' :
                  provider.type === 'fitbit' ? 'watch' :
                  provider.type === 'garmin' ? 'map' :
                  provider.type === 'medtronic' ? 'medical' :
                  provider.type === 'omron' ? 'heart' :
                  provider.type === 'withings' ? 'pulse' :
                  'fitness'}
            size={24} 
            color={provider.isPremium ? '#F59E0B' : '#10B981'} 
          />
        </View>
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, { color: colors.text }]}>
            {provider.name}
          </Text>
          <Text style={[styles.providerStatus, { color: isConnected ? '#10B981' : colors.gray }]}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
        </View>
        {provider.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.providerDescription, { color: colors.gray }]}>
        {provider.supportedMetrics.slice(0, 3).join(', ')}
        {provider.supportedMetrics.length > 3 && '...'}
      </Text>
      
      {provider.subscriptionRequired && !isConnected && (
        <Text style={[styles.subscriptionRequired, { color: '#F59E0B' }]}>
          Subscription required
        </Text>
      )}
    </TouchableOpacity>
  );
};

type InsightCardProps = {
  insight: HealthcareInsight;
  onAcknowledge: () => void;
};

const InsightCard: React.FC<InsightCardProps> = ({ insight, onAcknowledge }) => {
  const { colors } = useTheme();

  const getInsightIcon = () => {
    switch (insight.type) {
      case 'warning':
        return <Ionicons name="warning-outline" size={20} color="#EF4444" />;
      case 'recommendation':
        return <Ionicons name="bulb-outline" size={20} color="#F59E0B" />;
      case 'achievement':
        return <Ionicons name="trophy-outline" size={20} color="#10B981" />;
      case 'alert':
        return <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />;
      default:
        return <Ionicons name="information-circle-outline" size={20} color={colors.primary} />;
    }
  };

  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      case 'critical':
        return '#DC2626';
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.insightHeader}>
        {getInsightIcon()}
        <View style={styles.insightInfo}>
          <Text style={[styles.insightTitle, { color: colors.text }]}>
            {insight.title}
          </Text>
          <View style={styles.insightMeta}>
            <Text style={[styles.insightMetric, { color: colors.gray }]}>
              {insight.metricType}
            </Text>
            <Text style={[styles.insightPriority, { color: getPriorityColor() }]}>
              {insight.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        {insight.acknowledged && (
          <View style={styles.acknowledgedBadge}>
            <Text style={styles.acknowledgedText}>Acknowledged</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.insightMessage, { color: colors.text }]}>
        {insight.message}
      </Text>
      
      {insight.recommendation && (
        <View style={styles.recommendationContainer}>
          <Text style={[styles.recommendationLabel, { color: colors.gray }]}>
            Recommendation:
          </Text>
          <Text style={[styles.recommendationText, { color: colors.text }]}>
            {insight.recommendation}
          </Text>
        </View>
      )}
      
      {!insight.acknowledged && (
        <TouchableOpacity
          style={[styles.acknowledgeButton, { backgroundColor: colors.primary }]}
          onPress={onAcknowledge}
        >
          <Text style={styles.acknowledgeButtonText}>
            Acknowledge
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function HealthcareScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [connections, setConnections] = useState<HealthcareConnection[]>([]);
  const [providers, setProviders] = useState<HealthcareProviderConfig[]>([]);
  const [insights, setInsights] = useState<HealthcareInsight[]>([]);
  const [reports, setReports] = useState<HealthcareReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProviderConfig | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Initialize
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load providers
      const availableProviders = healthcareService.getAvailableProviders();
      setProviders(availableProviders);
      
      // Load connections
      if (user) {
        const userConnections = healthcareService.getActiveConnections(user.id);
        setConnections(userConnections);
      }
      
      // Load insights
      if (user) {
        const userInsights = await healthcareService.generateInsights(user.id);
        setInsights(userInsights);
      }
      
    } catch (error) {
      console.error('Error loading healthcare data:', error);
      Alert.alert('Error', 'Failed to load healthcare data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleConnectProvider = (provider: HealthcareProviderConfig) => {
    setSelectedProvider(provider);
    setShowConnectModal(true);
  };

  const handleDisconnectProvider = async (connectionId: string) => {
    try {
      await healthcareService.disconnectProvider(connectionId);
      await loadData();
      Alert.alert('Success', 'Provider disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      Alert.alert('Error', 'Failed to disconnect provider');
    }
  };

  const handleSyncProvider = async (connectionId: string) => {
    try {
      await healthcareService.syncData(connectionId);
      await loadData();
      Alert.alert('Success', 'Data synced successfully');
    } catch (error) {
      console.error('Error syncing provider:', error);
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleAcknowledgeInsight = async (insightId: string) => {
    try {
      // In a real implementation, this would update the insight status
      setInsights(prev => prev.map(insight => 
        insight.id === insightId ? { ...insight, acknowledged: true } : insight
      ));
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  const handleGenerateReport = async (type: 'weekly' | 'monthly' | 'quarterly' | 'annual') => {
    try {
      if (!user) return;
      
      const report = await healthcareService.generateReport(user.id, type);
      setReports(prev => [report, ...prev]);
      setShowReportsModal(true);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      if (!user) return;
      
      const data = await healthcareService.exportData(user.id, format);
      
      // In a real implementation, this would save the file or share it
      Alert.alert('Export Complete', `Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const isConnected = (providerType: HealthcareProvider) => {
    return connections.some(conn => conn.provider === providerType);
  };

  const renderProviderCard = ({ item }: { item: HealthcareProviderConfig }) => (
    <ProviderCard
      provider={item}
      isConnected={isConnected(item.type)}
      onPress={() => handleConnectProvider(item)}
    />
  );

  const renderInsightCard = ({ item }: { item: HealthcareInsight }) => (
    <InsightCard
      insight={item}
      onAcknowledge={() => handleAcknowledgeInsight(item.id)}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Healthcare Providers
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowInsightsModal(true)}
          >
            <Ionicons name="analytics-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => handleGenerateReport('weekly')}
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Connected Providers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Connected Providers ({connections.length})
          </Text>
          {connections.length > 0 ? (
            <FlatList
              data={connections}
              renderItem={({ item }) => {
                const provider = providers.find(p => p.type === item.provider);
                return (
                  <View style={[styles.connectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.connectionHeader}>
                      <View style={[styles.connectionIcon, { backgroundColor: provider?.isPremium ? '#F59E0B20' : '#10B98120' }]}>
                        <Ionicons 
                          name={provider?.type === 'apple_health' ? 'fitness' :
                                provider?.type === 'google_fit' ? 'fitness' :
                                provider?.type === 'fitbit' ? 'watch' :
                                provider?.type === 'garmin' ? 'map' :
                                provider?.type === 'medtronic' ? 'medical' :
                                provider?.type === 'omron' ? 'heart' :
                                provider?.type === 'withings' ? 'pulse' :
                                'fitness'}
                          size={20} 
                          color={provider?.isPremium ? '#F59E0B' : '#10B981'} 
                        />
                      </View>
                      <View style={styles.connectionInfo}>
                        <Text style={[styles.connectionName, { color: colors.text }]}>
                          {provider?.name || item.provider}
                        </Text>
                        <Text style={[styles.connectionStatus, { color: colors.gray }]}>
                          Last synced: {item.lastSyncAt?.toLocaleDateString() || 'Never'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.connectionActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleSyncProvider(item.id)}
                      >
                        <Ionicons name="refresh-outline" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Sync</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleDisconnectProvider(item.id)}
                      >
                        <Ionicons name="link-outline" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Disconnect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="earth-outline" size={48} color={colors.gray} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No connected providers
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>
                Connect to healthcare providers to sync your health data
              </Text>
            </View>
          )}
        </View>

        {/* Available Providers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Providers
          </Text>
          <FlatList
            data={providers}
            renderItem={renderProviderCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleGenerateReport('weekly')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                Weekly Report
              </Text>
              <Text style={[styles.actionCardDescription, { color: colors.gray }]}>
                Generate weekly health summary
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleExportData('json')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="download-outline" size={24} color="#10B981" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                Export Data
              </Text>
              <Text style={[styles.actionCardDescription, { color: colors.gray }]}>
                Export your health data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Connect Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Connect to {selectedProvider?.name}
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowConnectModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.text }]}>
              This will connect your {selectedProvider?.name} account to sync your health data.
            </Text>
            
            {selectedProvider?.subscriptionRequired && (
              <View style={styles.subscriptionWarning}>
                <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                <Text style={[styles.subscriptionWarningText, { color: colors.text }]}>
                  This provider requires a premium subscription
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                // In a real implementation, this would start the OAuth flow
                Alert.alert('Connect', 'OAuth flow would start here');
                setShowConnectModal(false);
              }}
            >
              <Text style={styles.connectButtonText}>
                Connect Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Insights Modal */}
      <Modal
        visible={showInsightsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Health Insights
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowInsightsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={insights}
            renderItem={renderInsightCard}
            keyExtractor={(item) => item.id}
            style={styles.insightsList}
          />
        </View>
      </Modal>

      {/* Reports Modal */}
      <Modal
        visible={showReportsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Health Reports
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowReportsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={reports}
            renderItem={({ item }) => (
              <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Report
                </Text>
                <Text style={[styles.reportDate, { color: colors.gray }]}>
                  {item.period.start.toLocaleDateString()} - {item.period.end.toLocaleDateString()}
                </Text>
                <View style={styles.reportSummary}>
                  <Text style={[styles.reportSummaryText, { color: colors.text }]}>
                    Steps: {item.summary.totalSteps.toLocaleString()}
                  </Text>
                  <Text style={[styles.reportSummaryText, { color: colors.text }]}>
                    Calories: {item.summary.totalCalories.toLocaleString()}
                  </Text>
                  <Text style={[styles.reportSummaryText, { color: colors.text }]}>
                    Sleep: {Math.round(item.summary.totalSleepDuration / 60)}h
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.viewReportButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    // In a real implementation, this would show the full report
                    Alert.alert('Report', 'Full report would be shown here');
                  }}
                >
                  <Text style={styles.viewReportButtonText}>
                    View Report
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            style={styles.reportsList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  providerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  providerStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  providerDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  subscriptionRequired: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  connectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  connectionStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  connectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  actionCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  subscriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  subscriptionWarningText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  connectButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  insightsList: {
    flex: 1,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightInfo: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightMetric: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  insightPriority: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  acknowledgedBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  recommendationContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  acknowledgeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  reportDate: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  reportSummary: {
    marginBottom: 12,
  },
  reportSummaryText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  viewReportButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewReportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});