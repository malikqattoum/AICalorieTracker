import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';

interface WearableDevice {
  id: string;
  name: string;
  type: 'fitness_tracker' | 'smartwatch' | 'smart_scale' | 'heart_rate_monitor';
  brand: string;
  model: string;
  isConnected: boolean;
  lastSync: string;
  batteryLevel?: number;
  features: string[];
}

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

export default function WearableIntegrationScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<WearableDevice | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Mock wearable devices data
  const mockDevices: WearableDevice[] = [
    {
      id: '1',
      name: 'Apple Watch Series 8',
      type: 'smartwatch',
      brand: 'Apple',
      model: 'Series 8',
      isConnected: true,
      lastSync: '2024-01-15T10:30:00Z',
      batteryLevel: 85,
      features: ['Heart Rate', 'Steps', 'Calories', 'Sleep', 'Workouts']
    },
    {
      id: '2',
      name: 'Fitbit Charge 5',
      type: 'fitness_tracker',
      brand: 'Fitbit',
      model: 'Charge 5',
      isConnected: false,
      lastSync: '2024-01-14T18:45:00Z',
      batteryLevel: 72,
      features: ['Heart Rate', 'Steps', 'Sleep', 'Blood Oxygen']
    },
    {
      id: '3',
      name: 'Withings Body+',
      type: 'smart_scale',
      brand: 'Withings',
      model: 'Body+',
      isConnected: true,
      lastSync: '2024-01-15T09:15:00Z',
      features: ['Weight', 'Body Fat', 'Muscle Mass', 'BMI']
    },
    {
      id: '4',
      name: 'WHOOP Strap 4.0',
      type: 'fitness_tracker',
      brand: 'WHOOP',
      model: 'Strap 4.0',
      isConnected: false,
      lastSync: '2024-01-13T22:30:00Z',
      batteryLevel: 45,
      features: ['Heart Rate', 'Sleep', 'Strain', 'Recovery']
    }
  ];

  // Mock health metrics data
  const mockHealthMetrics: HealthMetric[] = [
    {
      id: '1',
      name: 'Steps',
      value: 8432,
      unit: 'steps',
      icon: 'walk-outline',
      color: '#10B981',
      trend: 'up'
    },
    {
      id: '2',
      name: 'Heart Rate',
      value: 72,
      unit: 'bpm',
      icon: 'heart-outline',
      color: '#EF4444',
      trend: 'stable'
    },
    {
      id: '3',
      name: 'Calories Burned',
      value: 2150,
      unit: 'kcal',
      icon: 'flame-outline',
      color: '#F59E0B',
      trend: 'up'
    },
    {
      id: '4',
      name: 'Sleep Duration',
      value: 7.5,
      unit: 'hours',
      icon: 'moon-outline',
      color: '#6366F1',
      trend: 'stable'
    },
    {
      id: '5',
      name: 'Active Minutes',
      value: 45,
      unit: 'min',
      icon: 'timer-outline',
      color: '#8B5CF6',
      trend: 'up'
    }
  ];

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to get devices
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, this would come from API
      setDevices(mockDevices);
      
    } catch (error) {
      console.error('Error fetching devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      // Simulate API call to get health metrics
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - in real app, this would come from API
      setHealthMetrics(mockHealthMetrics);
      
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchHealthMetrics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDevices(), fetchHealthMetrics()]);
  };

  const handleConnectDevice = async (device: WearableDevice) => {
    setIsConnecting(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update device connection status
      setDevices(prevDevices =>
        prevDevices.map(d =>
          d.id === device.id
            ? { ...d, isConnected: !d.isConnected, lastSync: new Date().toISOString() }
            : d
        )
      );
      
      Alert.alert(
        'Success',
        device.isConnected ? 'Device disconnected successfully' : 'Device connected successfully',
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Error connecting device:', error);
      Alert.alert('Error', 'Failed to connect to device');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncDevice = async (device: WearableDevice) => {
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update device sync time
      setDevices(prevDevices =>
        prevDevices.map(d =>
          d.id === device.id
            ? { ...d, lastSync: new Date().toISOString() }
            : d
        )
      );
      
      Alert.alert(
        'Success',
        'Data synced successfully',
        [{ text: 'OK', style: 'default' }]
      );
      
      setSyncModalVisible(false);
      
    } catch (error) {
      console.error('Error syncing device:', error);
      Alert.alert('Error', 'Failed to sync device data');
    }
  };

  const handleAddDevice = () => {
    Alert.alert(
      'Add New Device',
      'Select a device type to add:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Fitness Tracker', onPress: () => Alert.alert('Add Device', 'Fitness tracker setup coming soon!') },
        { text: 'Smartwatch', onPress: () => Alert.alert('Add Device', 'Smartwatch setup coming soon!') },
        { text: 'Smart Scale', onPress: () => Alert.alert('Add Device', 'Smart scale setup coming soon!') },
        { text: 'Heart Rate Monitor', onPress: () => Alert.alert('Add Device', 'Heart rate monitor setup coming soon!') },
      ]
    );
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartwatch':
        return 'watch-outline';
      case 'fitness_tracker':
        return 'fitness-outline';
      case 'smart_scale':
        return 'scale-outline';
      case 'heart_rate_monitor':
        return 'heart-pulse-outline';
      default:
        return 'devices-outline';
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'smartwatch':
        return '#6366F1';
      case 'fitness_tracker':
        return '#10B981';
      case 'smart_scale':
        return '#F59E0B';
      case 'heart_rate_monitor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading devices...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Wearable Integration
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Connected Devices Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {devices.filter(d => d.isConnected).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.gray }]}>
                  Connected
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {devices.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.gray }]}>
                  Total
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryDescription, { color: colors.text }]}>
              Manage your connected wearable devices and sync health data
            </Text>
          </View>
        </View>

        {/* Auto Sync Toggle */}
        <View style={[styles.syncContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.syncContent}>
            <View style={styles.syncInfo}>
              <Ionicons name="sync-outline" size={20} color={colors.primary} />
              <View style={styles.syncText}>
                <Text style={[styles.syncTitle, { color: colors.text }]}>
                  Auto Sync
                </Text>
                <Text style={[styles.syncDescription, { color: colors.gray }]}>
                  Automatically sync data from connected devices
                </Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={autoSync ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Devices List */}
        <View style={styles.devicesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Devices
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddDevice}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={devices}
            renderItem={({ item }) => (
              <View style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.deviceHeader}>
                  <View style={[styles.deviceIcon, { backgroundColor: getDeviceColor(item.type) + '20' }]}>
                    <Ionicons name={getDeviceIcon(item.type) as any} size={24} color={getDeviceColor(item.type)} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.deviceModel, { color: colors.gray }]}>
                      {item.brand} {item.model}
                    </Text>
                  </View>
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusIndicator, { backgroundColor: item.isConnected ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: item.isConnected ? '#10B981' : '#EF4444' }]}>
                      {item.isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>

                <View style={styles.deviceFeatures}>
                  <Text style={[styles.featuresTitle, { color: colors.text }]}>
                    Features
                  </Text>
                  <View style={styles.featuresList}>
                    {item.features.slice(0, 3).map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <Text style={[styles.featureText, { color: colors.text }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                    {item.features.length > 3 && (
                      <Text style={[styles.moreFeatures, { color: colors.gray }]}>
                        +{item.features.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>

                {item.batteryLevel !== undefined && (
                  <View style={styles.deviceBattery}>
                    <Text style={[styles.batteryText, { color: colors.text }]}>
                      Battery: {item.batteryLevel}%
                    </Text>
                    <View style={[styles.batteryBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[styles.batteryFill, { width: `${item.batteryLevel}%`, backgroundColor: item.batteryLevel > 20 ? '#10B981' : '#EF4444' }]} 
                      />
                    </View>
                  </View>
                )}

                <View style={styles.deviceActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setSyncModalVisible(true)}
                    disabled={!item.isConnected}
                  >
                    <Ionicons name="sync-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>
                      Sync
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: item.isConnected ? '#EF444420' : colors.primary,
                        borderColor: item.isConnected ? '#EF4444' : colors.primary,
                      }
                    ]}
                    onPress={() => handleConnectDevice(item)}
                    disabled={isConnecting}
                  >
                    <Ionicons 
                      name={item.isConnected ? 'close-outline' : 'link-outline'} as any
                      size={16} 
                      color={item.isConnected ? '#EF4444' : 'white'} 
                    />
                    <Text style={[
                      styles.actionButtonText,
                      { color: item.isConnected ? '#EF4444' : 'white' }
                    ]}>
                      {item.isConnected ? 'Disconnect' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.lastSyncText, { color: colors.gray }]}>
                  Last sync: {formatLastSync(item.lastSync)}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Health Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Health Metrics
          </Text>
          
          <FlatList
            data={healthMetrics}
            renderItem={({ item }) => (
              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.metricHeader}>
                  <View style={[styles.metricIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>
                      {item.value} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.metricTrend}>
                    <Ionicons 
                      name={item.trend === 'up' ? 'trending-up-outline' : item.trend === 'down' ? 'trending-down-outline' : 'remove-outline'} 
                      size={16} 
                      color={item.trend === 'up' ? '#10B981' : item.trend === 'down' ? '#EF4444' : '#6B7280'} 
                    />
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.metricsList}
          />
        </View>

        {/* Sync Modal */}
        <Modal
          visible={syncModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.syncModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.syncModalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSyncModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.syncModalTitle, { color: colors.text }]}>
                Sync Device Data
              </Text>
              <View style={styles.syncModalHeaderSpacer} />
            </View>

            <View style={styles.syncModalContent}>
              {selectedDevice && (
                <>
                  <View style={[styles.syncDeviceInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.syncDeviceIcon, { backgroundColor: getDeviceColor(selectedDevice.type) + '20' }]}>
                      <Ionicons name={getDeviceIcon(selectedDevice.type) as any} size={24} color={getDeviceColor(selectedDevice.type)} />
                    </View>
                    <View style={styles.syncDeviceInfo}>
                      <Text style={[styles.syncDeviceName, { color: colors.text }]}>
                        {selectedDevice.name}
                      </Text>
                      <Text style={[styles.syncDeviceModel, { color: colors.gray }]}>
                        {selectedDevice.brand} {selectedDevice.model}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.syncOptions}>
                    <Text style={[styles.syncOptionsTitle, { color: colors.text }]}>
                      Sync Options
                    </Text>
                    
                    <View style={styles.syncOption}>
                      <Switch
                        value={true}
                        onValueChange={() => {}}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor="#f4f3f4"
                      />
                      <Text style={[styles.syncOptionText, { color: colors.text }]}>
                        Sync All Data
                      </Text>
                    </View>
                    
                    <View style={styles.syncOption}>
                      <Switch
                        value={false}
                        onValueChange={() => {}}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor="#f4f3f4"
                      />
                      <Text style={[styles.syncOptionText, { color: colors.text }]}>
                        Sync Recent Data (Last 7 days)
                      </Text>
                    </View>
                    
                    <View style={styles.syncOption}>
                      <Switch
                        value={false}
                        onValueChange={() => {}}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor="#f4f3f4"
                      />
                      <Text style={[styles.syncOptionText, { color: colors.text }]}>
                        Sync Historical Data
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleSyncDevice(selectedDevice)}
                  >
                    <Ionicons name="sync-outline" size={20} color="white" />
                    <Text style={styles.syncButtonText}>
                      Start Sync
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  summaryContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  summaryDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  syncContainer: {
    margin: 20,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncText: {
    marginLeft: 12,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  syncDescription: {
    fontSize: 14,
  },
  devicesContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deviceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceModel: {
    fontSize: 14,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceFeatures: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
  },
  moreFeatures: {
    fontSize: 12,
    marginTop: 4,
  },
  deviceBattery: {
    marginBottom: 12,
  },
  batteryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  batteryBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  lastSyncText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
  },
  metricsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  metricsList: {
    marginTop: 12,
  },
  metricCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricTrend: {
    marginLeft: 8,
  },
  syncModalContainer: {
    flex: 1,
  },
  syncModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  syncModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  syncModalHeaderSpacer: {
    width: 40,
  },
  syncModalContent: {
    flex: 1,
    padding: 16,
  },
  syncDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  syncDeviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  syncDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  syncDeviceModel: {
    fontSize: 14,
    color: '#6B7280',
  },
  syncOptions: {
    marginBottom: 24,
  },
  syncOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  syncOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncOptionText: {
    fontSize: 14,
    marginLeft: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});