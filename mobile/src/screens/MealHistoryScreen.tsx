import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
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
import { mealService } from '../services/mealService';

type MealHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Meal {
  id: string;
  userId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}

const { width } = Dimensions.get('window');

export default function MealHistoryScreen() {
  const navigation = useNavigation<MealHistoryScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<string>('all');

  // Fetch meals for selected date
  const { data: meals, isLoading, refetch } = useQuery({
    queryKey: ['meals', selectedDate, selectedMealType],
    queryFn: async (): Promise<Meal[]> => {
      const result = await safeFetchJson(`${API_URL}/api/meals?date=${selectedDate}&mealType=${selectedMealType === 'all' ? '' : selectedMealType}`);
      if (result === null) {
        throw new Error('Failed to fetch meals');
      }
      return result;
    },
  });

  // Fetch daily summary
  const { data: dailySummary } = useQuery({
    queryKey: ['dailySummary', selectedDate],
    queryFn: async (): Promise<DailySummary> => {
      const result = await safeFetchJson(`${API_URL}/api/meals/daily-summary?date=${selectedDate}`);
      if (result === null) {
        throw new Error('Failed to fetch daily summary');
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

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Handle meal type filter
  const handleMealTypeFilter = (mealType: string) => {
    setSelectedMealType(mealType);
  };

  // Handle meal press
  const handleMealPress = (meal: Meal) => {
    navigation.navigate('MealDetails', { mealId: meal.id });
  };

  // Get meal type icon
  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'restaurant-outline';
      case 'lunch':
        return 'fast-food-outline';
      case 'dinner':
        return 'restaurant-outline';
      case 'snack':
        return 'ice-cream-outline';
      default:
        return 'restaurant-outline';
    }
  };

  // Get meal type color
  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '#F59E0B';
      case 'lunch':
        return '#3B82F6';
      case 'dinner':
        return '#8B5CF6';
      case 'snack':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  // Get meal type name
  const getMealTypeName = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return i18n.t('mealTypes.breakfast');
      case 'lunch':
        return i18n.t('mealTypes.lunch');
      case 'dinner':
        return i18n.t('mealTypes.dinner');
      case 'snack':
        return i18n.t('mealTypes.snack');
      default:
        return mealType;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render meal item
  const renderMealItem = ({ item }: { item: Meal }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleMealPress(item)}
    >
      <View style={styles.mealItemContent}>
        <View style={styles.mealItemLeft}>
          <View style={[styles.mealTypeIcon, { backgroundColor: getMealTypeColor(item.mealType) + '20' }]}>
            <Ionicons name={getMealTypeIcon(item.mealType)} size={20} color={getMealTypeColor(item.mealType)} />
          </View>
          <View style={styles.mealItemInfo}>
            <Text style={[styles.mealItemName, { color: colors.text }]}>
              {item.foodName}
            </Text>
            <Text style={[styles.mealItemTime, { color: colors.gray }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.mealItemRight}>
          <Text style={[styles.mealItemCalories, { color: colors.primary }]}>
            {item.calories} cal
          </Text>
          <View style={styles.mealItemMacros}>
            <Text style={[styles.mealItemMacro, { color: colors.gray }]}>
              P: {item.protein}g
            </Text>
            <Text style={[styles.mealItemMacro, { color: colors.gray }]}>
              C: {item.carbs}g
            </Text>
            <Text style={[styles.mealItemMacro, { color: colors.gray }]}>
              F: {item.fat}g
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color={colors.gray} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        {i18n.t('mealHistory.noMeals')}
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.gray }]}>
        {i18n.t('mealHistory.noMealsDesc')}
      </Text>
    </View>
  );

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
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            {i18n.t('mealHistory.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
            {formatDate(selectedDate)}
          </Text>
        </View>
      </LinearGradient>

      {/* Daily Summary */}
      {dailySummary && (
        <View style={[styles.summaryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {dailySummary.totalCalories}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                {i18n.t('mealHistory.totalCalories')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {dailySummary.totalProtein}g
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                {i18n.t('mealHistory.protein')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {dailySummary.totalCarbs}g
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                {i18n.t('mealHistory.carbs')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {dailySummary.totalFat}g
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>
                {i18n.t('mealHistory.fat')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealType === 'all' && [styles.filterButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleMealTypeFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedMealType === 'all' && { color: 'white' }
            ]}>
              {i18n.t('mealHistory.allMeals')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealType === 'breakfast' && [styles.filterButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleMealTypeFilter('breakfast')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedMealType === 'breakfast' && { color: 'white' }
            ]}>
              {i18n.t('mealTypes.breakfast')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealType === 'lunch' && [styles.filterButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleMealTypeFilter('lunch')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedMealType === 'lunch' && { color: 'white' }
            ]}>
              {i18n.t('mealTypes.lunch')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealType === 'dinner' && [styles.filterButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleMealTypeFilter('dinner')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedMealType === 'dinner' && { color: 'white' }
            ]}>
              {i18n.t('mealTypes.dinner')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMealType === 'snack' && [styles.filterButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleMealTypeFilter('snack')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedMealType === 'snack' && { color: 'white' }
            ]}>
              {i18n.t('mealTypes.snack')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Meals List */}
      <FlatList
        data={meals || []}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mealsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
              {meals?.length ? `${meals.length} ${i18n.t('mealHistory.meals')}` : i18n.t('mealHistory.noMeals')}
            </Text>
          </View>
        }
      />
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
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: -20,
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
        elevation: 3,
      },
    }),
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  mealsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealItem: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  mealItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealItemTime: {
    fontSize: 14,
  },
  mealItemRight: {
    alignItems: 'flex-end',
  },
  mealItemCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealItemMacros: {
    flexDirection: 'row',
  },
  mealItemMacro: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});