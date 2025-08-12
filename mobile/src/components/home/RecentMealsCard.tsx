import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import i18n from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation';
import { API_URL } from '../../config';

type RecentMealsCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function RecentMealsCard() {
  const navigation = useNavigation<RecentMealsCardNavigationProp>();
  const { colors } = useTheme();

  // Fetch recent meals
  const { data: meals, isLoading } = useQuery({
    queryKey: ['recentMeals'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/meal-analyses/recent?limit=3`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent meals');
      }
      return response.json();
    },
  });

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

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {i18n.t('home.recentMeals')}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('MealHistory')}
          style={styles.viewAllButton}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            {i18n.t('home.viewAll')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : meals && meals.length > 0 ? (
        <View style={styles.mealsContainer}>
          {meals.map((meal: Meal) => (
            <TouchableOpacity
              key={meal.id}
              style={[styles.mealItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('MealDetails', { mealId: meal.id })}
            >
              <View style={styles.mealImageContainer}>
                {meal.imageUrl ? (
                  <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
                ) : (
                  <View style={[styles.mealImagePlaceholder, { backgroundColor: colors.lightGray }]}>
                    <Ionicons name="image-outline" size={16} color={colors.gray} />
                  </View>
                )}
              </View>
              
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                  {meal.foodName}
                </Text>
                
                <View style={styles.mealDetails}>
                  <View style={styles.mealType}>
                    <Ionicons name={getMealTypeIcon(meal.mealType)} size={12} color={colors.gray} />
                    <Text style={[styles.mealTypeText, { color: colors.gray }]}>
                      {i18n.t(`mealHistory.${meal.mealType}`)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.mealTime, { color: colors.gray }]}>
                    {formatTime(meal.createdAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.mealCalories}>
                <Text style={[styles.caloriesValue, { color: colors.primary }]}>
                  {meal.calories}
                </Text>
                <Text style={[styles.caloriesLabel, { color: colors.gray }]}>
                  cal
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            {i18n.t('mealHistory.noMeals')}
          </Text>
          
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera-outline" size={16} color="white" />
            <Text style={styles.scanButtonText}>
              {i18n.t('home.scanMeal')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 2,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  mealsContainer: {
    paddingHorizontal: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mealImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  mealDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  mealTypeText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  mealTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  mealCalories: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  caloriesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
});