import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

// Components
import NutritionSummaryCard from '../components/home/NutritionSummaryCard';
import RecentMealsCard from '../components/home/RecentMealsCard';
import AiInsightsCard from '../components/home/AiInsightsCard';
import MealPlanCard from '../components/home/MealPlanCard';
import NutritionTipsCard from '../components/home/NutritionTipsCard';
import AnalyticsScreen from './AnalyticsScreen';
import AchievementsCard from '../components/home/AchievementsCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch daily stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: async () => {
      const result = await safeFetchJson(`${API_URL}/api/daily-stats`);
      if (result === null) {
        throw new Error('Failed to fetch daily stats');
      }
      return result;
    },
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle camera button press
  const handleCameraPress = () => {
    navigation.navigate('Camera');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>
                {i18n.t('home.welcome')}, {user?.firstName}
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Scan Meal Card */}
          <TouchableOpacity
            style={[styles.scanMealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleCameraPress}
            activeOpacity={0.7}
          >
            <View style={styles.scanMealContent}>
              <View style={styles.scanMealTextContainer}>
                <Text style={[styles.scanMealTitle, { color: colors.text }]}>
                  {i18n.t('home.scanMeal')}
                </Text>
                <Text style={[styles.scanMealSubtitle, { color: colors.gray }]}>
                  Take a photo of your food for instant analysis
                </Text>
              </View>
              <View style={[styles.cameraIconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Stats */}
          {isLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {i18n.t('common.loading')}
              </Text>
            </View>
          ) : (
            <NutritionSummaryCard stats={stats} />
          )}

          {/* Recent Meals */}
          <RecentMealsCard />

          {/* AI Insights */}
          <AiInsightsCard />

          {/* Meal Plan */}
          <MealPlanCard />

          {/* Nutrition Tips */}
          <NutritionTipsCard />

          {/* Achievements */}
          <AchievementsCard />

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('NutritionCoach')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Nutrition Coach</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('RecipeImport')}
              >
                <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Import Recipe</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('MealCalendar')}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Meal Calendar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="person-outline" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Profile</Text>
              </TouchableOpacity>
<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('Analytics')}
>
  <Ionicons name="analytics-outline" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Analytics</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('Healthcare')}
>
  <Ionicons name="medical-outline" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Healthcare</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('RealTimeMonitoring')}
>
  <Ionicons name="pulse" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Monitor</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('AdvancedAI')}
>
  <Ionicons name="bulb" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>AI</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('SocialFeed')}
>
  <Ionicons name="people" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Social</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('Reporting')}
>
  <Ionicons name="document-text" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Reports</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  onPress={() => navigation.navigate('Wearable')}
>
  <Ionicons name="watch-outline" size={24} color={colors.primary} />
  <Text style={[styles.quickActionText, { color: colors.text }]}>Devices</Text>
</TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  scanMealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scanMealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanMealTextContainer: {
    flex: 1,
  },
  scanMealTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  scanMealSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  cameraIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  loadingContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  quickActionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});