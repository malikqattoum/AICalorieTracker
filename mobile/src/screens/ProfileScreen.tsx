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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  primaryGoal?: string;
  targetWeight?: number;
  timeline?: string;
  dietaryPreferences?: any;
  allergies?: any;
  totalMeals: number;
  streakDays: number;
  perfectDays: number;
  favoriteFoods: string[];
  isPremium: boolean;
  createdAt: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile> => {
      const result = await safeFetchJson(`${API_URL}/api/user/profile`);
      if (result === null) {
        throw new Error('Failed to fetch user profile');
      }
      return result;
    },
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const result = await safeFetchJson(`${API_URL}/api/user/stats`);
      if (result === null) {
        throw new Error('Failed to fetch user stats');
      }
      return result;
    },
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              queryClient.clear();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  // Handle edit profile
  const handleEditProfile = () => {
    navigation.navigate('PersonalInfo');
  };

  // Handle settings
  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  // Handle change password
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  // Handle notifications
  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  // Handle about
  const handleAbout = () => {
    navigation.navigate('About');
  };

  // Handle premium dashboard
  const handlePremiumDashboard = () => {
    navigation.navigate('PremiumDashboard');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {i18n.t('common.loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {i18n.t('profile.errorLoading')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>{i18n.t('common.retry')}</Text>
        </TouchableOpacity>
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
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.primary, '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: '#ffffff20' }]}>
                <Text style={[styles.avatarText, { color: 'white' }]}>
                  {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                </Text>
              </View>
              {profile?.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: 'white' }]}>
                {profile?.firstName} {profile?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.8)' }]}>
                {profile?.email}
              </Text>
              <Text style={[styles.userUsername, { color: 'rgba(255,255,255,0.6)' }]}>
                @{profile?.username}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.totalMeals || profile?.totalMeals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {i18n.t('profile.totalMeals')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.streakDays || profile?.streakDays || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {i18n.t('profile.streakDays')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.perfectDays || profile?.perfectDays || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {i18n.t('profile.perfectDays')}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('profile.personalInfo')}
          </Text>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleEditProfile}
          >
            <View style={styles.infoItemContent}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <View style={styles.infoItemText}>
                <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                  {i18n.t('profile.editProfile')}
                </Text>
                <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('profile.updatePersonalInfo')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('profile.accountSettings')}
          </Text>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <View style={styles.infoItemContent}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              <View style={styles.infoItemText}>
                <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                  {i18n.t('profile.changePassword')}
                </Text>
                <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('profile.updatePassword')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleNotifications}
          >
            <View style={styles.infoItemContent}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <View style={styles.infoItemText}>
                <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                  {i18n.t('profile.notifications')}
                </Text>
                <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('profile.manageNotifications')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSettings}
          >
            <View style={styles.infoItemContent}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <View style={styles.infoItemText}>
                <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                  {i18n.t('profile.settings')}
                </Text>
                <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('profile.appSettings')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('profile.support')}
          </Text>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleAbout}
          >
            <View style={styles.infoItemContent}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={styles.infoItemText}>
                <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                  {i18n.t('profile.about')}
                </Text>
                <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('profile.appInfo')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Premium Section */}
        {profile?.isPremium && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Premium Features
            </Text>
            <TouchableOpacity
              style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handlePremiumDashboard}
            >
              <View style={styles.infoItemContent}>
                <Ionicons name="star-outline" size={20} color="#F59E0B" />
                <View style={styles.infoItemText}>
                  <Text style={[styles.infoItemTitle, { color: colors.text }]}>
                    Premium Dashboard
                  </Text>
                  <Text style={[styles.infoItemSubtitle, { color: colors.gray }]}>
                    Access advanced analytics and features
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={[styles.logoutButtonText, { color: '#DC2626' }]}>
              {i18n.t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.gray }]}>
            AI Calorie Tracker v1.0.0
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: -20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemText: {
    flex: 1,
    marginLeft: 12,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoItemSubtitle: {
    fontSize: 14,
  },
  logoutSection: {
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
  },
});