import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

type MealPlanCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type MealPlan = {
  id: string;
  goal: string;
  calorieTarget: number;
  meals: {
    breakfast: { name: string; calories: number }[];
    lunch: { name: string; calories: number }[];
    dinner: { name: string; calories: number }[];
    snacks: { name: string; calories: number }[];
  };
  createdAt: string;
};

export default function MealPlanCard() {
  const navigation = useNavigation<MealPlanCardNavigationProp>();
  const { colors } = useTheme();

  // Fetch current meal plan
  const { data: mealPlan, isLoading } = useQuery({
    queryKey: ['currentMealPlan'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/meal-plan/current`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No meal plan found
        }
        throw new Error('Failed to fetch meal plan');
      }
      return response.json();
    },
    // Mock data for development
    placeholderData: {
      id: '1',
      goal: 'weightLoss',
      calorieTarget: 1800,
      meals: {
        breakfast: [{ name: 'Greek Yogurt with Berries', calories: 320 }],
        lunch: [{ name: 'Grilled Chicken Salad', calories: 450 }],
        dinner: [{ name: 'Baked Salmon with Vegetables', calories: 520 }],
        snacks: [{ name: 'Apple with Almond Butter', calories: 210 }],
      },
      createdAt: new Date().toISOString(),
    },
  });

  // Get goal text
  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'weightLoss':
        return i18n.t('mealPlan.weightLoss');
      case 'maintenance':
        return i18n.t('mealPlan.maintenance');
      case 'muscleGain':
        return i18n.t('mealPlan.muscleGain');
      default:
        return i18n.t('mealPlan.weightLoss');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {i18n.t('mealPlan.title')}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('MealPlan')}
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
      ) : mealPlan ? (
        <View style={styles.mealPlanContainer}>
          <View style={styles.mealPlanHeader}>
            <View style={styles.mealPlanInfo}>
              <Text style={[styles.mealPlanTitle, { color: colors.text }]}>
                {getGoalText(mealPlan.goal)} Plan
              </Text>
              <Text style={[styles.mealPlanCalories, { color: colors.gray }]}>
                {mealPlan.calorieTarget} calories
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.regenerateButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => navigation.navigate('MealPlan')}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.regenerateButtonText, { color: colors.primary }]}>
                {i18n.t('mealPlan.regenerate')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealsPreview}>
            <View style={styles.mealRow}>
              <View style={[styles.mealTypeTag, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
                <Text style={[styles.mealTypeText, { color: '#F59E0B' }]}>
                  {i18n.t('mealPlan.breakfast')}
                </Text>
              </View>
              
              <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                {mealPlan.meals.breakfast[0]?.name}
              </Text>
              
              <Text style={[styles.mealCalories, { color: colors.gray }]}>
                {mealPlan.meals.breakfast[0]?.calories} cal
              </Text>
            </View>
            
            <View style={styles.mealRow}>
              <View style={[styles.mealTypeTag, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="restaurant-outline" size={14} color="#10B981" />
                <Text style={[styles.mealTypeText, { color: '#10B981' }]}>
                  {i18n.t('mealPlan.lunch')}
                </Text>
              </View>
              
              <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                {mealPlan.meals.lunch[0]?.name}
              </Text>
              
              <Text style={[styles.mealCalories, { color: colors.gray }]}>
                {mealPlan.meals.lunch[0]?.calories} cal
              </Text>
            </View>
            
            <View style={styles.mealRow}>
              <View style={[styles.mealTypeTag, { backgroundColor: '#6366F120' }]}>
                <Ionicons name="moon-outline" size={14} color="#6366F1" />
                <Text style={[styles.mealTypeText, { color: '#6366F1' }]}>
                  {i18n.t('mealPlan.dinner')}
                </Text>
              </View>
              
              <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                {mealPlan.meals.dinner[0]?.name}
              </Text>
              
              <Text style={[styles.mealCalories, { color: colors.gray }]}>
                {mealPlan.meals.dinner[0]?.calories} cal
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.viewFullPlanButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('MealPlan')}
          >
            <Text style={[styles.viewFullPlanText, { color: colors.text }]}>
              View Full Plan
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            No meal plan available. Create a personalized meal plan based on your goals.
          </Text>
          
          <TouchableOpacity
            style={[styles.createPlanButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MealPlan')}
          >
            <Ionicons name="restaurant-outline" size={16} color="white" />
            <Text style={styles.createPlanButtonText}>
              {i18n.t('mealPlan.generatePlan')}
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
  mealPlanContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealPlanInfo: {
    flex: 1,
  },
  mealPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  mealPlanCalories: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  regenerateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealsPreview: {
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    width: 100,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  viewFullPlanButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  viewFullPlanText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createPlanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
});