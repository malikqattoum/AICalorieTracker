import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

type AnalyticsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DailyStats {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  totalMeals: number;
  perfectDays: number;
}

interface NutritionTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  unlockedAt?: string;
}

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const navigation = useNavigation<AnalyticsScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'nutrition' | 'achievements'>('overview');

  // Fetch daily stats for the selected period
  const { data: dailyStats, isLoading: isDailyStatsLoading } = useQuery({
    queryKey: ['dailyStats', selectedPeriod],
    queryFn: async (): Promise<DailyStats[]> => {
      const result = await safeFetchJson(`${API_URL}/api/analytics/daily?period=${selectedPeriod}`);
      if (result === null) {
        throw new Error('Failed to fetch daily stats');
      }
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Fetch weekly stats
  const { data: weeklyStats, isLoading: isWeeklyStatsLoading } = useQuery({
    queryKey: ['weeklyStats'],
    queryFn: async (): Promise<WeeklyStats> => {
      const result = await safeFetchJson(`${API_URL}/api/analytics/weekly`);
      if (result === null) {
        throw new Error('Failed to fetch weekly stats');
      }
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Fetch nutrition trends
  const { data: nutritionTrends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['nutritionTrends', selectedPeriod],
    queryFn: async (): Promise<NutritionTrend[]> => {
      const result = await safeFetchJson(`${API_URL}/api/analytics/trends?period=${selectedPeriod}`);
      if (result === null) {
        throw new Error('Failed to fetch nutrition trends');
      }
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Fetch achievements
  const { data: achievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const result = await safeFetchJson(`${API_URL}/api/analytics/achievements`);
      if (result === null) {
        throw new Error('Failed to fetch achievements');
      }
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, you would refetch all queries here
    setRefreshing(false);
  };

  // Calculate average daily calories
  const calculateAverageCalories = () => {
    if (!dailyStats || dailyStats.length === 0) return 0;
    const total = dailyStats.reduce((sum, day) => sum + day.totalCalories, 0);
    return Math.round(total / dailyStats.length);
  };

  // Calculate calorie consistency
  const calculateCalorieConsistency = () => {
    if (!dailyStats || dailyStats.length === 0) return 0;
    const goal = dailyStats[0]?.calorieGoal || 2000;
    const consistentDays = dailyStats.filter(day => 
      Math.abs(day.totalCalories - goal) <= goal * 0.1
    ).length;
    return Math.round((consistentDays / dailyStats.length) * 100);
  };

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'This Week';
    }
  };

  // Render overview tab
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'week' && [styles.periodButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'week' && { color: 'white' }
          ]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'month' && [styles.periodButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'month' && { color: 'white' }
          ]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'year' && [styles.periodButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'year' && { color: 'white' }
          ]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="flame-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {calculateAverageCalories()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Avg Daily Calories
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {calculateCalorieConsistency()}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Calorie Consistency
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="restaurant-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weeklyStats?.totalMeals || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Total Meals
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weeklyStats?.perfectDays || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Perfect Days
          </Text>
        </View>
      </View>

      {/* Nutrition Summary */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {getPeriodLabel()} Nutrition Summary
        </Text>
        
        {isTrendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : nutritionTrends && nutritionTrends.length > 0 ? (
          <View style={styles.nutritionSummary}>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientInfo}>
                <Text style={[styles.nutrientName, { color: colors.text }]}>
                  Protein
                </Text>
                <Text style={[styles.nutrientAvg, { color: colors.gray }]}>
                  Avg: {Math.round(nutritionTrends.reduce((sum, t) => sum + t.protein, 0) / nutritionTrends.length)}g
                </Text>
              </View>
              <View style={[styles.nutrientBar, { backgroundColor: colors.lightGray }]}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { backgroundColor: '#4ADE80', width: '75%' }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.nutrientRow}>
              <View style={styles.nutrientInfo}>
                <Text style={[styles.nutrientName, { color: colors.text }]}>
                  Carbs
                </Text>
                <Text style={[styles.nutrientAvg, { color: colors.gray }]}>
                  Avg: {Math.round(nutritionTrends.reduce((sum, t) => sum + t.carbs, 0) / nutritionTrends.length)}g
                </Text>
              </View>
              <View style={[styles.nutrientBar, { backgroundColor: colors.lightGray }]}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { backgroundColor: '#60A5FA', width: '60%' }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.nutrientRow}>
              <View style={styles.nutrientInfo}>
                <Text style={[styles.nutrientName, { color: colors.text }]}>
                  Fat
                </Text>
                <Text style={[styles.nutrientAvg, { color: colors.gray }]}>
                  Avg: {Math.round(nutritionTrends.reduce((sum, t) => sum + t.fat, 0) / nutritionTrends.length)}g
                </Text>
              </View>
              <View style={[styles.nutrientBar, { backgroundColor: colors.lightGray }]}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { backgroundColor: '#F59E0B', width: '45%' }
                  ]} 
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No nutrition data available for this period.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render nutrition tab
  const renderNutrition = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Detailed Nutrition Analysis
        </Text>
        
        {isTrendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : nutritionTrends && nutritionTrends.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.nutritionTable}>
              <View style={[styles.tableHeader, { borderBottomColor: '#e5e7eb' }]}>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Calories</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Protein</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Carbs</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.text }]}>Fat</Text>
              </View>
              
              {nutritionTrends.slice(-7).map((trend, index) => (
                <View key={index} style={[styles.tableRow, { borderBottomColor: '#e5e7eb' }]}>
                  <Text style={[styles.tableCell, { color: colors.text }]}>
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.text }]}>
                    {trend.calories}
                  </Text>
                  <Text style={[styles.tableCell, { color: '#4ADE80' }]}>
                    {trend.protein}g
                  </Text>
                  <Text style={[styles.tableCell, { color: '#60A5FA' }]}>
                    {trend.carbs}g
                  </Text>
                  <Text style={[styles.tableCell, { color: '#F59E0B' }]}>
                    {trend.fat}g
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No nutrition data available.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render achievements tab
  const renderAchievements = () => (
    <View style={styles.tabContent}>
      {isAchievementsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : achievements && achievements.length > 0 ? (
        <View style={styles.achievementsList}>
          {achievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[styles.achievementCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.achievementHeader}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.completed ? '#10B98120' : colors.primary + '20' }]}>
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.completed ? '#10B981' : colors.primary} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: colors.gray }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.achievementProgress}>
                <View style={[styles.progressTrack, { backgroundColor: colors.lightGray }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: achievement.completed ? '#10B981' : colors.primary,
                        width: `${(achievement.progress / achievement.target) * 100}%`,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.gray }]}>
                  {achievement.progress}/{achievement.target}
                </Text>
              </View>
              
              {achievement.completed && achievement.unlockedAt && (
                <View style={styles.achievementFooter}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={[styles.unlockedText, { color: '#10B981' }]}>
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            No achievements available yet. Keep tracking your meals to unlock achievements!
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            {i18n.t('analytics.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'overview' && [styles.tabButtonActive, { borderBottomColor: '#4F46E5' }]
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'overview' && { color: '#4F46E5' }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'nutrition' && [styles.tabButtonActive, { borderBottomColor: '#4F46E5' }]
          ]}
          onPress={() => setSelectedTab('nutrition')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'nutrition' && { color: '#4F46E5' }
          ]}>
            Nutrition
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'achievements' && [styles.tabButtonActive, { borderBottomColor: '#4F46E5' }]
          ]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'achievements' && { color: '#4F46E5' }
          ]}>
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'nutrition' && renderNutrition()}
        {selectedTab === 'achievements' && renderAchievements()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    borderRadius: 8,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  nutritionSummary: {
    gap: 16,
  },
  nutrientRow: {
    gap: 12,
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  nutrientAvg: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  nutrientBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: 120,
  },
  nutrientProgress: {
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  nutritionTable: {
    minWidth: width - 32,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    width: '20%',
    fontFamily: 'Inter-SemiBold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 14,
    width: '20%',
    fontFamily: 'Inter-Regular',
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    minWidth: 40,
    textAlign: 'right',
  },
  achievementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  // Responsive design patterns
  responsiveContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  responsiveSection: {
    marginBottom: 16,
  },
  responsiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  responsiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  responsiveGridItem: {
    width: '48%',
    marginBottom: 12,
  },
  responsiveCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});