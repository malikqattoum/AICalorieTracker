import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MealPlanCardProps = {
  meals?: Array<{
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    prepTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: string[];
    instructions: string[];
  }>;
};

type MealPlanNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MealPlanCard({ meals = [] }: MealPlanCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<MealPlanNavigationProp>();
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Mock meal plan data
  const mockMealPlan = [
    {
      id: '1',
      name: 'Overnight Oats with Berries',
      type: 'breakfast' as const,
      calories: 320,
      protein: 12,
      carbs: 45,
      fat: 8,
      prepTime: 5,
      difficulty: 'easy' as const,
      ingredients: ['Rolled oats', 'Milk', 'Greek yogurt', 'Mixed berries', 'Honey', 'Chia seeds'],
      instructions: [
        'Combine oats, milk, and chia seeds in a jar',
        'Add Greek yogurt and mix well',
        'Top with berries and drizzle with honey',
        'Refrigerate overnight',
        'Enjoy in the morning'
      ],
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      type: 'lunch' as const,
      calories: 420,
      protein: 35,
      carbs: 20,
      fat: 18,
      prepTime: 15,
      difficulty: 'medium' as const,
      ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Olive oil', 'Lemon'],
      instructions: [
        'Season chicken breast with salt and pepper',
        'Grill for 6-8 minutes per side',
        'Let rest for 5 minutes',
        'Combine all vegetables in a bowl',
        'Slice chicken and add to salad',
        'Drizzle with olive oil and lemon'
      ],
    },
    {
      id: '3',
      name: 'Salmon with Roasted Vegetables',
      type: 'dinner' as const,
      calories: 480,
      protein: 38,
      carbs: 25,
      fat: 22,
      prepTime: 25,
      difficulty: 'medium' as const,
      ingredients: ['Salmon fillet', 'Broccoli', 'Carrots', 'Bell peppers', 'Olive oil', 'Garlic'],
      instructions: [
        'Preheat oven to 400°F (200°C)',
        'Season salmon with herbs and lemon',
        'Toss vegetables with olive oil and garlic',
        'Roast for 20-25 minutes',
        'Serve salmon with roasted vegetables'
      ],
    },
    {
      id: '4',
      name: 'Protein Smoothie',
      type: 'snack' as const,
      calories: 180,
      protein: 25,
      carbs: 15,
      fat: 5,
      prepTime: 5,
      difficulty: 'easy' as const,
      ingredients: ['Protein powder', 'Banana', 'Almond milk', 'Spinach', 'Ice'],
      instructions: [
        'Add protein powder to blender',
        'Add banana and spinach',
        'Pour in almond milk',
        'Add ice and blend until smooth',
        'Pour into glass and enjoy'
      ],
    },
  ];

  const days = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
  const displayMeals = meals.length > 0 ? meals : mockMealPlan;

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'ice-cream-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast':
        return '#F59E0B';
      case 'lunch':
        return '#10B981';
      case 'dinner':
        return '#3B82F6';
      case 'snack':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Easy';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Hard';
      default:
        return 'Unknown';
    }
  };

  const handleMealPress = (mealId: string) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const handleRecipePress = (mealId: string) => {
    navigation.navigate('MealDetails', { mealId });
  };

  const renderMealItem = ({ item }: { item: typeof mockMealPlan[0] }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleMealPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.mealHeader}>
        <View style={styles.mealType}>
          <Ionicons 
            name={getMealTypeIcon(item.type)} 
            size={20} 
            color={getMealTypeColor(item.type)} 
          />
          <Text style={[styles.mealTypeText, { color: getMealTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={styles.mealStats}>
          <Text style={[styles.mealCalories, { color: colors.text }]}>
            {item.calories} cal
          </Text>
          <Text style={[styles.mealMacros, { color: colors.gray }]}>
            P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
          </Text>
        </View>
      </View>

      <Text style={[styles.mealName, { color: colors.text }]}>
        {item.name}
      </Text>

      <View style={styles.mealMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.gray} />
          <Text style={[styles.metaText, { color: colors.gray }]}>
            {item.prepTime} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="fitness-outline" size={14} color={colors.gray} />
          <Text style={[styles.metaText, { color: colors.gray }]}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>

      {expandedMeal === item.id && (
        <View style={styles.mealDetails}>
          <View style={styles.ingredientsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ingredients
            </Text>
            <FlatList
              data={item.ingredients}
              renderItem={({ item: ingredient }) => (
                <Text style={[styles.ingredientItem, { color: colors.gray }]}>
                  • {ingredient}
                </Text>
              )}
              keyExtractor={(item, index) => `ingredient-${index}`}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.instructionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Instructions
            </Text>
            {item.instructions.map((instruction, index) => (
              <Text key={index} style={[styles.instructionItem, { color: colors.gray }]}>
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.viewRecipeButton, { backgroundColor: colors.primary }]}
            onPress={() => handleRecipePress(item.id)}
          >
            <Text style={styles.viewRecipeText}>
              View Full Recipe
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Meal Plan
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('MealPlan' as any)}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysSelector}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              { 
                backgroundColor: selectedDay === index ? colors.primary : colors.background,
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text style={[
              styles.dayText,
              { color: selectedDay === index ? 'white' : colors.text }
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.mealsList}
      >
        <FlatList
          data={displayMeals.map(meal => ({ ...meal, type: meal.type as any, difficulty: meal.difficulty as any }))}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsContent}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  mealsList: {
    maxHeight: 400,
  },
  mealsContent: {
    gap: 12,
  },
  mealItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  mealStats: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  mealMacros: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  mealDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  ingredientItem: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  instructionsSection: {
    marginBottom: 16,
  },
  instructionItem: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  viewRecipeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewRecipeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});