import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config';

type MealPlan = {
  id: string;
  goal: string;
  dietaryPreferences: string[];
  calorieTarget: number;
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
    snacks: MealItem[];
  };
  createdAt: string;
};

type MealItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  instructions?: string;
};

type DietaryPreference = {
  id: string;
  name: string;
};

type Goal = {
  id: string;
  name: string;
};

export default function MealPlanScreen() {
  const { colors } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState<string>('weightLoss');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fetch current meal plan
  const { data: mealPlan, isLoading, refetch } = useQuery({
    queryKey: ['mealPlan'],
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
  });

  // Generate meal plan mutation
  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const response = await fetch(`${API_URL}/api/meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: selectedGoal,
          dietaryPreferences: selectedPreferences,
          calorieTarget,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: 'Meal plan generated successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Save meal plan mutation
  const saveMealPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/meal-plan/${mealPlan.id}/save`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save meal plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: i18n.t('mealPlan.planSaved'),
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Handle generate meal plan
  const handleGenerateMealPlan = () => {
    if (isGenerating) return;
    
    if (mealPlan) {
      Alert.alert(
        i18n.t('common.confirm'),
        'This will replace your current meal plan. Continue?',
        [
          {
            text: i18n.t('common.cancel'),
            style: 'cancel',
          },
          {
            text: i18n.t('common.confirm'),
            onPress: () => generateMealPlanMutation.mutate(),
          },
        ],
      );
    } else {
      generateMealPlanMutation.mutate();
    }
  };

  // Handle save meal plan
  const handleSaveMealPlan = () => {
    if (!mealPlan) return;
    
    saveMealPlanMutation.mutate();
  };

  // Toggle dietary preference
  const togglePreference = (preference: string) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  // Render meal section
  const renderMealSection = (title: string, meals: MealItem[]) => (
    <View style={styles.mealSection}>
      <Text style={[styles.mealSectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      
      {meals.map((meal, index) => (
        <View 
          key={index} 
          style={[
            styles.mealItem, 
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.mealName, { color: colors.text }]}>
            {meal.name}
          </Text>
          
          <View style={styles.mealNutrition}>
            <Text style={[styles.mealCalories, { color: colors.primary }]}>
              {meal.calories} {i18n.t('home.calories')}
            </Text>
            
            <View style={styles.mealMacros}>
              <Text style={[styles.mealMacro, { color: colors.gray }]}>
                P: {meal.protein}g
              </Text>
              <Text style={[styles.mealMacro, { color: colors.gray }]}>
                C: {meal.carbs}g
              </Text>
              <Text style={[styles.mealMacro, { color: colors.gray }]}>
                F: {meal.fat}g
              </Text>
            </View>
          </View>
          
          {meal.ingredients && (
            <View style={styles.mealIngredients}>
              <Text style={[styles.mealIngredientsTitle, { color: colors.text }]}>
                {i18n.t('mealDetails.ingredients')}:
              </Text>
              <Text style={[styles.mealIngredientsText, { color: colors.gray }]}>
                {meal.ingredients.join(', ')}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  // Render goals
  const renderGoals = () => {
    const goals: Goal[] = [
      { id: 'weightLoss', name: i18n.t('mealPlan.weightLoss') },
      { id: 'maintenance', name: i18n.t('mealPlan.maintenance') },
      { id: 'muscleGain', name: i18n.t('mealPlan.muscleGain') },
    ];
    
    return (
      <View style={styles.preferencesSection}>
        <Text style={[styles.preferencesTitle, { color: colors.text }]}>
          {i18n.t('mealPlan.healthGoals')}
        </Text>
        
        <View style={styles.preferencesContainer}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.preferenceChip,
                { 
                  backgroundColor: selectedGoal === goal.id ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedGoal(goal.id)}
            >
              <Text
                style={[
                  styles.preferenceChipText,
                  { color: selectedGoal === goal.id ? 'white' : colors.text },
                ]}
              >
                {goal.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render dietary preferences
  const renderDietaryPreferences = () => {
    const preferences: DietaryPreference[] = [
      { id: 'vegetarian', name: i18n.t('mealPlan.vegetarian') },
      { id: 'vegan', name: i18n.t('mealPlan.vegan') },
      { id: 'glutenFree', name: i18n.t('mealPlan.glutenFree') },
      { id: 'dairyFree', name: i18n.t('mealPlan.dairyFree') },
      { id: 'lowCarb', name: i18n.t('mealPlan.lowCarb') },
      { id: 'highProtein', name: i18n.t('mealPlan.highProtein') },
      { id: 'keto', name: i18n.t('mealPlan.keto') },
      { id: 'paleo', name: i18n.t('mealPlan.paleo') },
      { id: 'mediterranean', name: i18n.t('mealPlan.mediterranean') },
    ];
    
    return (
      <View style={styles.preferencesSection}>
        <Text style={[styles.preferencesTitle, { color: colors.text }]}>
          {i18n.t('mealPlan.dietaryPreferences')}
        </Text>
        
        <View style={styles.preferencesContainer}>
          {preferences.map((preference) => (
            <TouchableOpacity
              key={preference.id}
              style={[
                styles.preferenceChip,
                { 
                  backgroundColor: selectedPreferences.includes(preference.id) ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => togglePreference(preference.id)}
            >
              <Text
                style={[
                  styles.preferenceChipText,
                  { color: selectedPreferences.includes(preference.id) ? 'white' : colors.text },
                ]}
              >
                {preference.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render calorie target
  const renderCalorieTarget = () => (
    <View style={styles.calorieSection}>
      <Text style={[styles.preferencesTitle, { color: colors.text }]}>
        {i18n.t('mealPlan.calorieTarget')}
      </Text>
      
      <View style={[styles.calorieContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.calorieButton, { backgroundColor: colors.background }]}
          onPress={() => setCalorieTarget(Math.max(1000, calorieTarget - 100))}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.calorieValue, { color: colors.text }]}>
          {calorieTarget}
        </Text>
        
        <TouchableOpacity
          style={[styles.calorieButton, { backgroundColor: colors.background }]}
          onPress={() => setCalorieTarget(Math.min(4000, calorieTarget + 100))}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('mealPlan.title')}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mealPlan ? (
        <>
          {/* Meal Plan */}
          <View style={styles.mealPlanContainer}>
            <View style={styles.mealPlanHeader}>
              <View>
                <Text style={[styles.mealPlanTitle, { color: colors.text }]}>
                  {selectedGoal === 'weightLoss' 
                    ? i18n.t('mealPlan.weightLoss') 
                    : selectedGoal === 'maintenance'
                      ? i18n.t('mealPlan.maintenance')
                      : i18n.t('mealPlan.muscleGain')
                  } Plan
                </Text>
                <Text style={[styles.mealPlanSubtitle, { color: colors.gray }]}>
                  {mealPlan.calorieTarget} calories
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.regenerateButton, { backgroundColor: colors.primary + '20' }]}
                onPress={handleGenerateMealPlan}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={[styles.regenerateButtonText, { color: colors.primary }]}>
                      {i18n.t('mealPlan.regenerate')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {renderMealSection(i18n.t('mealPlan.breakfast'), mealPlan.meals.breakfast)}
            {renderMealSection(i18n.t('mealPlan.lunch'), mealPlan.meals.lunch)}
            {renderMealSection(i18n.t('mealPlan.dinner'), mealPlan.meals.dinner)}
            {renderMealSection(i18n.t('mealPlan.snacks'), mealPlan.meals.snacks)}
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveMealPlan}
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.saveButtonText}>
                {i18n.t('mealPlan.savePlan')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.customizeButton, { borderColor: colors.border }]}
              onPress={() => {/* Show customize options */}}
            >
              <Text style={[styles.customizeButtonText, { color: colors.text }]}>
                {i18n.t('mealPlan.customizePlan')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Generate Meal Plan Form */}
          <View style={styles.generateContainer}>
            <Text style={[styles.generateTitle, { color: colors.text }]}>
              Create Your Personalized Meal Plan
            </Text>
            
            <Text style={[styles.generateDescription, { color: colors.gray }]}>
              Customize your preferences to generate a meal plan tailored to your needs.
            </Text>
            
            {renderGoals()}
            {renderDietaryPreferences()}
            {renderCalorieTarget()}
            
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.primary }]}
              onPress={handleGenerateMealPlan}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="restaurant-outline" size={20} color="white" />
                  <Text style={styles.generateButtonText}>
                    {i18n.t('mealPlan.generatePlan')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  mealPlanContainer: {
    padding: 20,
  },
  mealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealPlanTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  mealPlanSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
  mealSection: {
    marginBottom: 24,
  },
  mealSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  mealItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  mealNutrition: {
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
  mealMacros: {
    flexDirection: 'row',
  },
  mealMacro: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  mealIngredients: {
    marginTop: 8,
  },
  mealIngredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealIngredientsText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  customizeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  generateContainer: {
    padding: 20,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  generateDescription: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  preferencesSection: {
    marginBottom: 24,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preferenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  preferenceChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  calorieSection: {
    marginBottom: 24,
  },
  calorieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  calorieButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
});