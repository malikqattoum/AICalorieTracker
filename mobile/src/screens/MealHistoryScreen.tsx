import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';

type MealHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Meal = {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string;
};

export default function MealHistoryScreen() {
  const navigation = useNavigation<MealHistoryScreenNavigationProp>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Fetch meal history
  const { data: meals, isLoading, refetch } = useQuery({
    queryKey: ['mealHistory', filter],
    queryFn: async () => {
      const url = filter 
        ? `${API_URL}/api/meal-analyses?mealType=${filter}` 
        : `${API_URL}/api/meal-analyses`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch meal history');
      }
      return response.json();
    },
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return i18n.t('common.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return i18n.t('common.yesterday');
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get meal type icon
  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'nutrition-outline';
    }
  };

  // Render meal item
  const renderMealItem = ({ item }: { item: Meal }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('MealDetails', { mealId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.mealImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.mealImage} />
        ) : (
          <View style={[styles.mealImagePlaceholder, { backgroundColor: colors.lightGray }]}>
            <Ionicons name="image-outline" size={24} color={colors.gray} />
          </View>
        )}
        <View style={[styles.mealTypeTag, { backgroundColor: colors.primary }]}>
          <Ionicons name={getMealTypeIcon(item.mealType)} size={12} color="white" />
          <Text style={styles.mealTypeText}>
            {i18n.t(`mealHistory.${item.mealType}`)}
          </Text>
        </View>
      </View>
      
      <View style={styles.mealInfo}>
        <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
          {item.foodName}
        </Text>
        
        <View style={styles.mealStats}>
          <Text style={[styles.mealCalories, { color: colors.primary }]}>
            {item.calories} {i18n.t('home.calories')}
          </Text>
          
          <View style={styles.mealNutrients}>
            <Text style={[styles.mealNutrient, { color: colors.gray }]}>
              P: {item.protein}g
            </Text>
            <Text style={[styles.mealNutrient, { color: colors.gray }]}>
              C: {item.carbs}g
            </Text>
            <Text style={[styles.mealNutrient, { color: colors.gray }]}>
              F: {item.fat}g
            </Text>
          </View>
        </View>
        
        <View style={styles.mealTime}>
          <Ionicons name="time-outline" size={14} color={colors.gray} />
          <Text style={[styles.mealTimeText, { color: colors.gray }]}>
            {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollableFilterButtons
        options={[
          { value: null, label: 'All' },
          { value: 'breakfast', label: i18n.t('mealHistory.breakfast') },
          { value: 'lunch', label: i18n.t('mealHistory.lunch') },
          { value: 'dinner', label: i18n.t('mealHistory.dinner') },
          { value: 'snack', label: i18n.t('mealHistory.snack') },
        ]}
        selectedValue={filter}
        onSelect={setFilter}
      />
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color={colors.gray} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {i18n.t('mealHistory.noMeals')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
        {i18n.t('mealHistory.startTracking')}
      </Text>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="camera-outline" size={20} color="white" />
        <Text style={styles.scanButtonText}>{i18n.t('home.scanMeal')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('mealHistory.title')}
        </Text>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {/* Show filter/sort options */}}
        >
          <Ionicons name="options-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {renderFilterButtons()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="camera-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Scrollable filter buttons component
function ScrollableFilterButtons({ 
  options, 
  selectedValue, 
  onSelect 
}: { 
  options: { value: string | null; label: string }[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}) {
  const { colors } = useTheme();
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterButtonsContainer}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.label}
          style={[
            styles.filterChip,
            { 
              backgroundColor: option.value === selectedValue ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: option.value === selectedValue ? 'white' : colors.text },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButtonsContainer: {
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  mealItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealImageContainer: {
    height: 160,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealInfo: {
    padding: 16,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  mealStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  mealNutrients: {
    flexDirection: 'row',
  },
  mealNutrient: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  mealTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTimeText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});