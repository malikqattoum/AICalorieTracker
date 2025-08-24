import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import { wearableService } from '../services/wearableService';
import { WearableDevice, HealthMetric, DeviceStatus } from '../types/wearable';

interface DeviceCardProps {
  device: WearableDevice;
  status: DeviceStatus;
  onPress: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, status, onPress, onSync, onDisconnect }) => {
  const { colors } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981';
      case 'syncing':
        return '#F59E0B';
      case 'disconnected':
        return '#6B7280';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'syncing':
        return 'Syncing...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.deviceHeader}>
        <View style={[styles.deviceIcon, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons 
            name={device.type === 'fitness_tracker' ? 'fitness-outline' : device.type === 'smartwatch' ? 'watch-outline' : 'heart-outline'} 
            size={24} 
            color={getStatusColor()} 
          />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, { color: colors.text }]}>
            {device.name}
          </Text>
          <Text style={[styles.deviceModel, { color: colors.gray }]}>
            {device.manufacturer} {device.model}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.deviceStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Battery
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {device.batteryLevel}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Last Sync
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {device.lastSync ? new Date(device.lastSync).toLocaleDateString() : 'Never'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onSync}
          disabled={status === 'syncing'}
        >
          <Ionicons name="refresh-outline" size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>
            Sync
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
          onPress={onDisconnect}
        >
          <Ionicons name="link-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Disconnect
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function WearableScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [deviceStatuses, setDeviceStatuses] = useState<Map<string, DeviceStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<WearableDevice | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceType, setNewDeviceType] = useState('fitness_tracker');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [autoSync, setAutoSync] = useState(true);

  // Fetch devices
  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const fetchedDevices = await wearableService.getDevices();
      setDevices(fetchedDevices);
      
      // Update status for each device
      const statuses = new Map<string, DeviceStatus>();
      fetchedDevices.forEach(device => {
        statuses.set(device.id, wearableService.getDeviceSyncStatus(device.id));
      });
      setDeviceStatuses(statuses);
      
    } catch (error) {
      console.error('Error fetching devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Sync device
  const syncDevice = async (device: WearableDevice) => {
    try {
      setDeviceStatuses(prev => new Map(prev).set(device.id, 'syncing'));
      
      const result = await wearableService.syncDevice(device.id);
      
      setDeviceStatuses(prev => new Map(prev).set(device.id, 'connected'));
      
      Alert.alert('Success', 'Device synced successfully');
    } catch (error) {
      console.error('Error syncing device:', error);
      setDeviceStatuses(prev => new Map(prev).set(device.id, 'error'));
      Alert.alert('Error', 'Failed to sync device');
    }
  };

  // Disconnect device
  const disconnectDevice = async (device: WearableDevice) => {
    try {
      await wearableService.disconnectDevice(device.id);
      
      setDevices(prev => prev.filter(d => d.id !== device.id));
      setDeviceStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(device.id);
        return newMap;
      });
      
      Alert.alert('Success', 'Device disconnected');
    } catch (error) {
      console.error('Error disconnecting device:', error);
      Alert.alert('Error', 'Failed to disconnect device');
    }
  };

  // Add new device
  const addNewDevice = async () => {
    if (!newDeviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }

    try {
      const newDevice: Partial<WearableDevice> = {
        type: newDeviceType as any,
        name: newDeviceName.trim(),
        manufacturer: 'Unknown',
        model: 'Unknown',
        isConnected: false,
        batteryLevel: 100,
      };

      const connectedDevice = await wearableService.connectDevice(newDevice);
      
      setDevices(prev => [...prev, connectedDevice]);
      setDeviceStatuses(prev => new Map(prev).set(connectedDevice.id, 'connected'));
      
      setNewDeviceName('');
      setShowAddDeviceModal(false);
      
      Alert.alert('Success', 'Device connected successfully');
    } catch (error) {
      console.error('Error adding device:', error);
      Alert.alert('Error', 'Failed to connect device');
    }
  };

  const renderDeviceCard = ({ item }: { item: WearableDevice }) => (
    <DeviceCard
      device={item}
      status={deviceStatuses.get(item.id) || 'disconnected'}
      onPress={() => setSelectedDevice(item)}
      onSync={() => syncDevice(item)}
      onDisconnect={() => disconnectDevice(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="watch-outline" size={48} color={colors.gray} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Wearable Devices
      </Text>
      <Text style={[styles.emptyStateDescription, { color: colors.gray }]}>
        Connect your fitness tracker or smartwatch to start tracking your health data
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddDeviceModal(true)}
      >
        <Ionicons name="add-outline" size={20} color="white" />
        <Text style={[styles.addButtonText, { color: 'white' }]}>
          Add Device
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('wearable.title')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddDeviceModal(true)}
        >
          <Ionicons name="add-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchDevices} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : devices.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.devicesList}>
            <FlatList
              data={devices}
              renderItem={renderDeviceCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.devicesContainer}
            />
          </View>
        )}
      </ScrollView>

      {/* Device Details Modal */}
      {selectedDevice && (
        <Modal
          visible={showDeviceModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDeviceModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedDevice.name}
              </Text>
              <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.deviceDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Type
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDevice.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Manufacturer
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDevice.manufacturer}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Model
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDevice.model}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Battery Level
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDevice.batteryLevel}%
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Last Sync
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDevice.lastSync 
                      ? new Date(selectedDevice.lastSync).toLocaleString()
                      : 'Never'
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    syncDevice(selectedDevice);
                    setShowDeviceModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>
                    Sync Now
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#EF444420' }]}
                  onPress={() => {
                    disconnectDevice(selectedDevice);
                    setShowDeviceModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Add Device Modal */}
      <Modal
        visible={showAddDeviceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDeviceModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Device
            </Text>
            <TouchableOpacity onPress={() => setShowAddDeviceModal(false)}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Device Type
                </Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newDeviceType === 'fitness_tracker' && [styles.typeButtonActive, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setNewDeviceType('fitness_tracker')}
                  >
                    <Ionicons name="fitness-outline" size={20} color={newDeviceType === 'fitness_tracker' ? 'white' : colors.text} />
                    <Text style={[styles.typeButtonText, { color: newDeviceType === 'fitness_tracker' ? 'white' : colors.text }]}>
                      Fitness Tracker
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newDeviceType === 'smartwatch' && [styles.typeButtonActive, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setNewDeviceType('smartwatch')}
                  >
                    <Ionicons name="watch-outline" size={20} color={newDeviceType === 'smartwatch' ? 'white' : colors.text} />
                    <Text style={[styles.typeButtonText, { color: newDeviceType === 'smartwatch' ? 'white' : colors.text }]}>
                      Smartwatch
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newDeviceType === 'heart_rate_monitor' && [styles.typeButtonActive, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setNewDeviceType('heart_rate_monitor')}
                  >
                    <Ionicons name="heart-outline" size={20} color={newDeviceType === 'heart_rate_monitor' ? 'white' : colors.text} />
                    <Text style={[styles.typeButtonText, { color: newDeviceType === 'heart_rate_monitor' ? 'white' : colors.text }]}>
                      Heart Rate Monitor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Device Name
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter device name"
                  placeholderTextColor={colors.gray}
                  value={newDeviceName}
                  onChangeText={setNewDeviceName}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>
                    Auto Sync
                  </Text>
                  <Switch
                    value={autoSync}
                    onValueChange={setAutoSync}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="white"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addNewDevice}
              >
                <Text style={styles.modalButtonText}>
                  Connect Device
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                onPress={() => setShowAddDeviceModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  devicesList: {
    flex: 1,
  },
  devicesContainer: {
    padding: 16,
    gap: 12,
  },
  deviceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontFamily: 'Inter-SemiBold',
  },
  deviceModel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
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
  deviceDetails: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});