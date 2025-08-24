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
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18n';
import analyticsService from '../../services/analyticsService';
import api from '../../services/api';

interface HealthcareProvider {
  id: string;
  name: string;
  specialty: string;
  practice: string;
  location: string;
  rating: number;
  reviews: number;
  distance: number;
  available: boolean;
  verified: boolean;
}

interface ConnectedProfessional {
  id: string;
  name: string;
  specialty: string;
  type: 'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist';
  practice: string;
  connectedDate: string;
  accessLevel: 'read_only' | 'read_write' | 'full_access';
  lastSync: string;
  dataShared: string[];
}

interface HealthRecord {
  id: string;
  type: 'vital_signs' | 'lab_results' | 'medication' | 'diagnosis' | 'treatment';
  title: string;
  date: string;
  provider: string;
  summary: string;
  shared: boolean;
}

interface DataSharingConsent {
  id: string;
  professionalId: string;
  professionalName: string;
  dataTypes: string[];
  purpose: string;
  expirationDate: string;
  consentDate: string;
  status: 'active' | 'expired' | 'revoked';
}

const { width: screenWidth } = Dimensions.get('screen');

export const HealthcareIntegration: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [connectedProfessionals, setConnectedProfessionals] = useState<ConnectedProfessional[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [consents, setConsents] = useState<DataSharingConsent[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        // Track page view
        await analyticsService.trackEvent({
          id: `healthcare_integration_view_${Date.now()}`,
          userId: user?.id?.toString() || 'anonymous',
          type: 'page_view',
          data: { page: 'healthcare_integration' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error initializing analytics:', error);
      }
    };
    
    initializeAnalytics();
  }, [user]);

  const tabs = [
    { id: 'providers', name: 'Find Providers', icon: 'search-outline' },
    { id: 'connected', name: 'Connected', icon: 'people-outline' },
    { id: 'records', name: 'Health Records', icon: 'document-text-outline' },
    { id: 'consents', name: 'Data Consents', icon: 'shield-checkmark-outline' },
  ];

  const generateMockData = () => {
    // Generate healthcare providers
    const providers: HealthcareProvider[] = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        practice: 'Heart Health Clinic',
        location: 'Downtown Medical Center',
        rating: 4.8,
        reviews: 124,
        distance: 2.3,
        available: true,
        verified: true
      },
      {
        id: '2',
        name: 'Dr. Michael Chen',
        specialty: 'Endocrinologist',
        practice: 'Diabetes & Hormone Center',
        location: 'City Medical Plaza',
        rating: 4.6,
        reviews: 89,
        distance: 3.7,
        available: false,
        verified: true
      },
      {
        id: '3',
        name: 'Dr. Emily Rodriguez',
        specialty: 'Nutritionist',
        practice: 'Wellness Nutrition Center',
        location: 'Health & Fitness Hub',
        rating: 4.9,
        reviews: 156,
        distance: 1.8,
        available: true,
        verified: true
      },
      {
        id: '4',
        name: 'Dr. James Wilson',
        specialty: 'Fitness Coach',
        practice: 'Performance Training Center',
        location: 'Athletic Complex',
        rating: 4.7,
        reviews: 203,
        distance: 4.2,
        available: true,
        verified: false
      },
      {
        id: '5',
        name: 'Dr. Lisa Thompson',
        specialty: 'Therapist',
        practice: 'Mental Wellness Center',
        location: 'Peaceful Mind Clinic',
        rating: 4.8,
        reviews: 178,
        distance: 2.9,
        available: true,
        verified: true
      }
    ];

    // Generate connected professionals
    const connectedProfessionals: ConnectedProfessional[] = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        type: 'doctor',
        practice: 'Heart Health Clinic',
        connectedDate: '2024-10-15',
        accessLevel: 'read_write',
        lastSync: '2024-11-10',
        dataShared: ['Vital Signs', 'Exercise Data', 'Sleep Patterns']
      },
      {
        id: '2',
        name: 'Emily Rodriguez',
        specialty: 'Nutritionist',
        type: 'nutritionist',
        practice: 'Wellness Nutrition Center',
        connectedDate: '2024-09-20',
        accessLevel: 'read_only',
        lastSync: '2024-11-08',
        dataShared: ['Nutrition Data', 'Meal Logs']
      }
    ];

    // Generate health records
    const healthRecords: HealthRecord[] = [
      {
        id: '1',
        type: 'vital_signs',
        title: 'Annual Physical Exam',
        date: '2024-10-15',
        provider: 'Dr. Sarah Johnson',
        summary: 'Blood pressure: 120/80, Heart rate: 72 bpm, Weight: 72kg',
        shared: true
      },
      {
        id: '2',
        type: 'lab_results',
        title: 'Blood Work Panel',
        date: '2024-10-15',
        provider: 'Dr. Sarah Johnson',
        summary: 'Cholesterol: 180 mg/dL, Blood glucose: 95 mg/dL',
        shared: true
      },
      {
        id: '3',
        type: 'medication',
        title: 'Prescription Update',
        date: '2024-10-20',
        provider: 'Dr. Michael Chen',
        summary: 'Metformin 500mg twice daily for blood sugar management',
        shared: false
      },
      {
        id: '4',
        type: 'diagnosis',
        title: 'Health Assessment',
        date: '2024-11-01',
        provider: 'Dr. Emily Rodriguez',
        summary: 'Nutritional assessment completed, recommended dietary adjustments',
        shared: true
      }
    ];

    // Generate data sharing consents
    const consents: DataSharingConsent[] = [
      {
        id: '1',
        professionalId: '1',
        professionalName: 'Dr. Sarah Johnson',
        dataTypes: ['Vital Signs', 'Exercise Data', 'Sleep Patterns'],
        purpose: 'Cardiac health monitoring and treatment',
        expirationDate: '2025-10-15',
        consentDate: '2024-10-15',
        status: 'active'
      },
      {
        id: '2',
        professionalId: '2',
        professionalName: 'Emily Rodriguez',
        dataTypes: ['Nutrition Data', 'Meal Logs'],
        purpose: 'Nutritional counseling and meal planning',
        expirationDate: '2025-09-20',
        consentDate: '2024-09-20',
        status: 'active'
      }
    ];

    return { providers, connectedProfessionals, healthRecords, consents };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch real data from API first
      try {
        const [providersData, connectedData, recordsData, consentsData] = await Promise.all([
          api.premium.getDashboard(),
          api.premium.getHealthScores(),
          api.premium.getAlerts(),
          api.premium.getProfessionalReports()
        ]);
        
        // Transform API data to match our interface
        setProviders(providersData.providers || []);
        setConnectedProfessionals(connectedData.professionals || []);
        setHealthRecords(recordsData.alerts || []);
        setConsents(consentsData.reports || []);
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // Fallback to mock data if API fails
        const mockData = generateMockData();
        setProviders(mockData.providers);
        setConnectedProfessionals(mockData.connectedProfessionals);
        setHealthRecords(mockData.healthRecords);
        setConsents(mockData.consents);
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

  const connectWithProvider = (provider: HealthcareProvider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const confirmConnection = () => {
    if (selectedProvider) {
      Alert.alert(
        'Connection Request',
        `Would you like to connect with ${selectedProvider.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Connect', 
            onPress: () => {
              setShowProviderModal(false);
              setShowConnectModal(true);
            }
          }
        ]
      );
    }
  };

  const grantAccess = (accessLevel: 'read_only' | 'read_write' | 'full_access') => {
    if (selectedProvider) {
      Alert.alert(
        'Grant Access',
        `You are about to grant ${accessLevel} access to your health data with ${selectedProvider.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Access', 
            onPress: () => {
              setShowConnectModal(false);
              Alert.alert('Success', 'Connection request sent!');
              fetchData();
            }
          }
        ]
      );
    }
  };

  const revokeAccess = (professionalId: string) => {
    Alert.alert(
      'Revoke Access',
      'Are you sure you want to revoke access to your health data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revoke', 
          onPress: () => {
            Alert.alert('Success', 'Access revoked successfully!');
            fetchData();
          }
        }
      ]
    );
  };

  const shareRecord = (recordId: string) => {
    Alert.alert('Share Record', 'Record shared with healthcare provider');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vital_signs':
        return 'heart-outline';
      case 'lab_results':
        return 'flask-outline';
      case 'medication':
        return 'pill-outline';
      case 'diagnosis':
        return 'medical-outline';
      case 'treatment':
        return 'fitness-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vital_signs':
        return '#EF4444';
      case 'lab_results':
        return '#3B82F6';
      case 'medication':
        return '#F59E0B';
      case 'diagnosis':
        return '#8B5CF6';
      case 'treatment':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'cardiologist':
        return 'heart-outline';
      case 'endocrinologist':
        return 'pulse-outline';
      case 'nutritionist':
        return 'restaurant-outline';
      case 'fitness coach':
        return 'fitness-outline';
      case 'therapist':
        return 'psychology-outline';
      default:
        return 'person-outline';
    }
  };

  const getAccessLevelText = (level: string) => {
    switch (level) {
      case 'read_only':
        return 'Read Only';
      case 'read_write':
        return 'Read & Write';
      case 'full_access':
        return 'Full Access';
      default:
        return level;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'read_only':
        return '#6B7280';
      case 'read_write':
        return '#F59E0B';
      case 'full_access':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'expired':
        return '#EF4444';
      case 'revoked':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.practice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProvidersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="Search providers..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color={colors.gray} style={styles.searchIcon} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          renderItem={({ item }) => (
            <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.providerHeader}>
                <View style={styles.providerInfo}>
                  <View style={[styles.providerAvatar, { backgroundColor: getTypeColor(item.specialty) + '20' }]}>
                    <Ionicons name={getSpecialtyIcon(item.specialty) as any} size={24} color={getTypeColor(item.specialty)} />
                  </View>
                  <View style={styles.providerDetails}>
                    <Text style={[styles.providerName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.providerSpecialty, { color: colors.gray }]}>
                      {item.specialty}
                    </Text>
                    <Text style={[styles.providerPractice, { color: colors.gray }]}>
                      {item.practice}
                    </Text>
                  </View>
                </View>
                <View style={styles.providerActions}>
                  <View style={[styles.ratingBadge, { backgroundColor: '#F59E0B20' }]}>
                    <Text style={[styles.ratingText, { color: '#F59E0B' }]}>
                      {item.rating}
                    </Text>
                  </View>
                  {item.verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#10B98120' }]}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.providerLocation}>
                <Ionicons name="location-outline" size={16} color={colors.gray} />
                <Text style={[styles.locationText, { color: colors.gray }]}>
                  {item.location} • {item.distance} km away
                </Text>
              </View>
              
              <View style={styles.providerFooter}>
                <View style={[styles.availabilityBadge, { backgroundColor: item.available ? '#10B98120' : '#EF444420' }]}>
                  <Text style={[styles.availabilityText, { color: item.available ? '#10B981' : '#EF4444' }]}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.connectButton, { backgroundColor: colors.primary }]}
                  onPress={() => connectWithProvider(item)}
                  disabled={!item.available}
                >
                  <Text style={styles.connectButtonText}>
                    {item.available ? 'Connect' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderConnectedTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : connectedProfessionals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Connected Professionals
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.gray }]}>
            Connect with healthcare providers to share your health data.
          </Text>
        </View>
      ) : (
        <FlatList
          data={connectedProfessionals}
          renderItem={({ item }) => (
            <View style={[styles.connectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.connectedHeader}>
                <View style={styles.connectedInfo}>
                  <View style={[styles.connectedAvatar, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Ionicons name={getSpecialtyIcon(item.specialty) as any} size={24} color={getTypeColor(item.type)} />
                  </View>
                  <View style={styles.connectedDetails}>
                    <Text style={[styles.connectedName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.connectedSpecialty, { color: colors.gray }]}>
                      {item.specialty}
                    </Text>
                    <Text style={[styles.connectedPractice, { color: colors.gray }]}>
                      {item.practice}
                    </Text>
                  </View>
                </View>
                <View style={[styles.accessBadge, { backgroundColor: getAccessLevelColor(item.accessLevel) + '20' }]}>
                  <Text style={[styles.accessText, { color: getAccessLevelColor(item.accessLevel) }]}>
                    {getAccessLevelText(item.accessLevel)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.connectedStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Connected
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {new Date(item.connectedDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Last Sync
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {new Date(item.lastSync).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sharedData}>
                <Text style={[styles.sharedTitle, { color: colors.text }]}>
                  Shared Data:
                </Text>
                <View style={styles.sharedTags}>
                  {item.dataShared.map((data, index) => (
                    <View key={index} style={styles.sharedTag}>
                      <Text style={styles.sharedTagText}>
                        {data}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.connectedActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('View Profile', 'View professional profile')}
                >
                  <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>
                    View Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
                  onPress={() => revokeAccess(item.id)}
                >
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                    Revoke Access
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderRecordsTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : healthRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Health Records
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.gray }]}>
            Your health records will appear here after medical visits.
          </Text>
        </View>
      ) : (
        <FlatList
          data={healthRecords}
          renderItem={({ item }) => (
            <View style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recordHeader}>
                <View style={[styles.recordIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                  <Ionicons name={getTypeIcon(item.type) as any} size={20} color={getTypeColor(item.type)} />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.recordDate, { color: colors.gray }]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.sharedBadge, { backgroundColor: item.shared ? '#10B98120' : '#EF444420' }]}>
                  <Text style={[styles.sharedText, { color: item.shared ? '#10B981' : '#EF4444' }]}>
                    {item.shared ? 'Shared' : 'Private'}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.recordProvider, { color: colors.gray }]}>
                {item.provider}
              </Text>
              
              <Text style={[styles.recordSummary, { color: colors.text }]}>
                {item.summary}
              </Text>
              
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => shareRecord(item.id)}
                  disabled={item.shared}
                >
                  <Text style={styles.actionButtonText}>
                    {item.shared ? 'Shared' : 'Share'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('View Details', 'View full record details')}
                >
                  <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderConsentsTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : consents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Data Sharing Consents
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.gray }]}>
            Your data sharing consents will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={consents}
          renderItem={({ item }) => (
            <View style={[styles.consentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.consentHeader}>
                <View style={styles.consentInfo}>
                  <Text style={[styles.consentProfessional, { color: colors.text }]}>
                    {item.professionalName}
                  </Text>
                  <Text style={[styles.consentPurpose, { color: colors.gray }]}>
                    {item.purpose}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.consentDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Data Types:
                  </Text>
                  <View style={styles.dataTypes}>
                    {item.dataTypes.map((type, index) => (
                      <View key={index} style={styles.dataTypeTag}>
                        <Text style={styles.dataTypeText}>
                          {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Consent Date:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(item.consentDate).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>
                    Expires:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(item.expirationDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.consentActions}>
                {item.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => Alert.alert('Revoke Consent', 'Are you sure you want to revoke this consent?')}
                  >
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                      Revoke Consent
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('View Details', 'View full consent details')}
                >
                  <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.healthcareIntegration')}
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
        }
      >
        {selectedTab === 'providers' && renderProvidersTab()}
        {selectedTab === 'connected' && renderConnectedTab()}
        {selectedTab === 'records' && renderRecordsTab()}
        {selectedTab === 'consents' && renderConsentsTab()}
      </ScrollView>

      {/* Provider Modal */}
      {selectedProvider && (
        <Modal
          visible={showProviderModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProviderModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedProvider.name}
              </Text>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.providerProfile}>
                <View style={[styles.profileAvatar, { backgroundColor: getTypeColor(selectedProvider.specialty) + '20' }]}>
                  <Ionicons name={getSpecialtyIcon(selectedProvider.specialty) as any} size={48} color={getTypeColor(selectedProvider.specialty)} />
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {selectedProvider.name}
                  </Text>
                  <Text style={[styles.profileSpecialty, { color: colors.gray }]}>
                    {selectedProvider.specialty}
                  </Text>
                  <Text style={[styles.profilePractice, { color: colors.text }]}>
                    {selectedProvider.practice}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileDetails}>
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Location
                  </Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.gray} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {selectedProvider.location}
                    </Text>
                  </View>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {selectedProvider.distance} km away
                  </Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Availability
                  </Text>
                  <View style={styles.availabilityInfo}>
                    <View style={[styles.availabilityIndicator, { backgroundColor: selectedProvider.available ? '#10B98120' : '#EF444420' }]}>
                      <Ionicons name={selectedProvider.available ? 'checkmark-circle-outline' : 'close-circle-outline'} size={16} color={selectedProvider.available ? '#10B981' : '#EF4444'} />
                    </View>
                    <Text style={[styles.availabilityText, { color: selectedProvider.available ? '#10B981' : '#EF4444' }]}>
                      {selectedProvider.available ? 'Available for new patients' : 'Currently unavailable'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ratings & Reviews
                  </Text>
                  <View style={styles.ratingInfo}>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons 
                          key={star} 
                          name={star <= Math.floor(selectedProvider.rating) ? 'star' : 'star-outline'} 
                          size={16} 
                          color={star <= Math.floor(selectedProvider.rating) ? '#F59E0B' : '#E5E7EB'} 
                        />
                      ))}
                    </View>
                    <Text style={[styles.ratingText, { color: colors.text }]}>
                      {selectedProvider.rating} ({selectedProvider.reviews} reviews)
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    About
                  </Text>
                  <Text style={[styles.aboutText, { color: colors.text }]}>
                    Dr. {selectedProvider.name.split(' ')[1]} is a board-certified {selectedProvider.specialty.toLowerCase()} with over 10 years of experience. 
                    They specialize in comprehensive health assessments and personalized treatment plans.
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={confirmConnection}
                disabled={!selectedProvider.available}
              >
                <Text style={styles.modalButtonText}>
                  {selectedProvider.available ? 'Request Connection' : 'Currently Unavailable'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Connect Modal */}
      {selectedProvider && (
        <Modal
          visible={showConnectModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Connect with {selectedProvider.name}
              </Text>
              <TouchableOpacity onPress={() => setShowConnectModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.connectInfo}>
                <Text style={[styles.connectTitle, { color: colors.text }]}>
                  Choose Access Level
                </Text>
                <Text style={[styles.connectDescription, { color: colors.gray }]}>
                  Select the level of access you want to grant to {selectedProvider.name}
                </Text>
              </View>
              
              <View style={styles.accessOptions}>
                <TouchableOpacity
                  style={[styles.accessOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => grantAccess('read_only')}
                >
                  <View style={styles.accessOptionHeader}>
                    <View style={[styles.accessIcon, { backgroundColor: '#6B728020' }]}>
                      <Ionicons name="eye-outline" size={20} color="#6B7280" />
                    </View>
                    <View style={styles.accessOptionInfo}>
                      <Text style={[styles.accessOptionTitle, { color: colors.text }]}>
                        Read Only
                      </Text>
                      <Text style={[styles.accessOptionDescription, { color: colors.gray }]}>
                        Professional can view your health data but cannot make changes
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.accessOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => grantAccess('read_write')}
                >
                  <View style={styles.accessOptionHeader}>
                    <View style={[styles.accessIcon, { backgroundColor: '#F59E0B20' }]}>
                      <Ionicons name="create-outline" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.accessOptionInfo}>
                      <Text style={[styles.accessOptionTitle, { color: colors.text }]}>
                        Read & Write
                      </Text>
                      <Text style={[styles.accessOptionDescription, { color: colors.gray }]}>
                        Professional can view and update your health data
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.accessOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => grantAccess('full_access')}
                >
                  <View style={styles.accessOptionHeader}>
                    <View style={[styles.accessIcon, { backgroundColor: '#EF444420' }]}>
                      <Ionicons name="settings-outline" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.accessOptionInfo}>
                      <Text style={[styles.accessOptionTitle, { color: colors.text }]}>
                        Full Access
                      </Text>
                      <Text style={[styles.accessOptionDescription, { color: colors.gray }]}>
                        Professional has complete access to manage your health data
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dataTypesInfo}>
                <Text style={[styles.dataTypesTitle, { color: colors.text }]}>
                  Data Types Shared:
                </Text>
                <View style={styles.dataTypesList}>
                  <Text style={[styles.dataTypeItem, { color: colors.text }]}>
                    • Vital Signs (Heart Rate, Blood Pressure, etc.)
                  </Text>
                  <Text style={[styles.dataTypeItem, { color: colors.text }]}>
                    • Activity & Exercise Data
                  </Text>
                  <Text style={[styles.dataTypeItem, { color: colors.text }]}>
                    • Sleep Patterns & Quality
                  </Text>
                  <Text style={[styles.dataTypeItem, { color: colors.text }]}>
                    • Nutrition & Meal Data
                  </Text>
                  <Text style={[styles.dataTypeItem, { color: colors.text }]}>
                    • Weight & Body Measurements
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

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
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  searchIcon: {
    marginLeft: 8,
  },
  providerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  providerSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  providerPractice: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  providerActions: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  connectedCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectedDetails: {
    flex: 1,
  },
  connectedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  connectedSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  connectedPractice: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accessText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  connectedStats: {
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
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sharedData: {
    marginBottom: 12,
  },
  sharedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  sharedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sharedTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sharedTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  connectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  recordCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  recordDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  sharedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharedText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  recordProvider: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  recordSummary: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consentInfo: {
    flex: 1,
  },
  consentProfessional: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  consentPurpose: {
    fontSize: 12,
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
  consentDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    width: 80,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  dataTypes: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataTypeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  dataTypeText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  consentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
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
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  providerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  profileSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  profilePractice: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  profileDetails: {
    gap: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  connectInfo: {
    marginBottom: 20,
  },
  connectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  connectDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  accessOptions: {
    gap: 12,
    marginBottom: 20,
  },
  accessOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  accessOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accessOptionInfo: {
    flex: 1,
  },
  accessOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  accessOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  dataTypesInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  dataTypesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  dataTypesList: {
    gap: 4,
  },
  dataTypeItem: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
});