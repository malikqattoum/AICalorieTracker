import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

interface Meal {
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
  tags: string[];
}

interface DayPlan {
  day: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export default function MealPlanScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealPlans, setMealPlans] = useState<DayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock meal plan data
  const mockMealPlans: DayPlan[] = [
    {
      day: 'Monday',
      date: '2024-01-15',
      meals: [
        {
          id: '1',
          name: 'Overnight Oats with Berries',
          type: 'breakfast',
          calories: 320,
          protein: 12,
          carbs: 45,
          fat: 8,
          prepTime: 5,
          difficulty: 'easy',
          ingredients: ['Rolled oats', 'Milk', 'Greek yogurt', 'Mixed berries', 'Honey', 'Chia seeds'],
          instructions: [
            'Combine oats, milk, and chia seeds in a jar',
            'Add Greek yogurt and mix well',
            'Top with berries and drizzle with honey',
            'Refrigerate overnight',
            'Enjoy in the morning'
          ],
          tags: ['quick', 'healthy', 'breakfast'],
        },
        {
          id: '2',
          name: 'Grilled Chicken Salad',
          type: 'lunch',
          calories: 420,
          protein: 35,
          carbs: 20,
          fat: 18,
          prepTime: 15,
          difficulty: 'medium',
          ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Olive oil', 'Lemon'],
          instructions: [
            'Season chicken breast with salt and pepper',
            'Grill for 6-8 minutes per side',
            'Let rest for 5 minutes',
            'Combine all vegetables in a bowl',
            'Slice chicken and add to salad',
            'Drizzle with olive oil and lemon'
          ],
          tags: ['high-protein', 'salad', 'lunch'],
        },
        {
          id: '3',
          name: 'Salmon with Roasted Vegetables',
          type: 'dinner',
          calories: 480,
          protein: 38,
          carbs: 25,
          fat: 22,
          prepTime: 25,
          difficulty: 'medium',
          ingredients: ['Salmon fillet', 'Broccoli', 'Carrots', 'Bell peppers', 'Olive oil', 'Garlic'],
          instructions: [
            'Preheat oven to 400°F (200°C)',
            'Season salmon with herbs and lemon',
            'Toss vegetables with olive oil and garlic',
            'Roast for 20-25 minutes',
            'Serve salmon with roasted vegetables'
          ],
          tags: ['omega-3', 'dinner', 'healthy'],
        },
        {
          id: '4',
          name: 'Protein Smoothie',
          type: 'snack',
          calories: 180,
          protein: 25,
          carbs: 15,
          fat: 5,
          prepTime: 5,
          difficulty: 'easy',
          ingredients: ['Protein powder', 'Banana', 'Almond milk', 'Spinach', 'Ice'],
          instructions: [
            'Add protein powder to blender',
            'Add banana and spinach',
            'Pour in almond milk',
            'Add ice and blend until smooth',
            'Pour into glass and enjoy'
          ],
          tags: ['protein', 'smoothie', 'snack'],
        },
      ],
      totalCalories: 1400,
      totalProtein: 110,
      totalCarbs: 105,
      totalFat: 53,
    },
    {
      day: 'Tuesday',
      date: '2024-01-16',
      meals: [
        {
          id: '5',
          name: 'Avocado Toast with Eggs',
          type: 'breakfast',
          calories: 380,
          protein: 18,
          carbs: 28,
          fat: 22,
          prepTime: 10,
          difficulty: 'easy',
          ingredients: ['Whole grain bread', 'Avocado', 'Eggs', 'Salt', 'Pepper', 'Olive oil'],
          instructions: [
            'Toast bread until golden brown',
            'Mash avocado and spread on toast',
            'Fry or poach eggs',
            'Place eggs on avocado toast',
            'Season with salt, pepper, and drizzle with olive oil'
          ],
          tags: ['avocado', 'eggs', 'breakfast'],
        },
        {
          id: '6',
          name: 'Quinoa Buddha Bowl',
          type: 'lunch',
          calories: 450,
          protein: 20,
          carbs: 55,
          fat: 15,
          prepTime: 20,
          difficulty: 'medium',
          ingredients: ['Quinoa', 'Chickpeas', 'Vegetables', 'Tahini', 'Lemon', 'Herbs'],
          instructions: [
            'Cook quinoa according to package directions',
            'Roast chickpeas with spices',
            'Prepare fresh vegetables',
            'Make tahini dressing',
            'Combine all ingredients in a bowl',
            'Drizzle with dressing and serve'
          ],
          tags: ['vegetarian', 'quinoa', 'bowl'],
        },
        {
          id: '7',
          name: 'Lean Beef Stir-fry',
          type: 'dinner',
          calories: 420,
          protein: 35,
          carbs: 30,
          fat: 18,
          prepTime: 25,
          difficulty: 'medium',
          ingredients: ['Lean beef', 'Mixed vegetables', 'Soy sauce', 'Ginger', 'Garlic', 'Brown rice'],
          instructions: [
            'Slice beef into thin strips',
            'Prepare all vegetables',
            'Heat oil in wok or large pan',
            'Stir-fry beef until browned',
            'Add vegetables and cook until crisp-tender',
            'Add sauce and serve over rice'
          ],
          tags: ['beef', 'stir-fry', 'dinner'],
        },
        {
          id: '8',
          name: 'Greek Yogurt Parfait',
          type: 'snack',
          calories: 150,
          protein: 12,
          carbs: 20,
          fat: 3,
          prepTime: 5,
          difficulty: 'easy',
          ingredients: ['Greek yogurt', 'Granola', 'Mixed berries', 'Honey'],
          instructions: [
            'Layer yogurt in glass or bowl',
            'Add layer of granola',
            'Add layer of berries',
            'Repeat layers',
            'Drizzle with honey on top'
          ],
          tags: ['yogurt', 'parfait', 'snack'],
        },
      ],
      totalCalories: 1400,
      totalProtein: 85,
      totalCarbs: 133,
      totalFat: 58,
    },
  ];

  useEffect(() => {
    // Simulate loading meal plans
    const loadMealPlans = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMealPlans(mockMealPlans);
      } catch (error) {
        Alert.alert('Error', 'Failed to load meal plans');
      } finally {
        setIsLoading(false);
      }
    };

    loadMealPlans();
  }, []);

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

  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
  };

  const handleMealClose = () => {
    setSelectedMeal(null);
  };

  const renderMealItem = ({ item }: { item: Meal }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleMealPress(item)}
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
          <Text style={[styles.metaText, { color: getDifficultyColor(item.difficulty) }]}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {item.tags.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.background }]}>
            <Text style={[styles.tagText, { color: colors.gray }]}>
              #{tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderDayPlan = () => {
    const dayPlan = mealPlans[selectedDay];
    if (!dayPlan) return null;

    return (
      <View style={styles.dayPlanContainer}>
        <View style={styles.dayPlanHeader}>
          <Text style={[styles.dayPlanTitle, { color: colors.text }]}>
            {dayPlan.day} - {new Date(dayPlan.date).toLocaleDateString()}
          </Text>
          <View style={styles.dayPlanStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dayPlan.totalCalories}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>
                Calories
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dayPlan.totalProtein}g
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>
                Protein
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dayPlan.totalCarbs}g
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>
                Carbs
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dayPlan.totalFat}g
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>
                Fat
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={dayPlan.meals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsList}
        />
      </View>
    );
  };

  const renderMealDetails = () => {
    if (!selectedMeal) return null;

    return (
      <View style={[styles.mealDetailsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.mealDetailsHeader}>
          <View style={styles.mealDetailsType}>
            <Ionicons 
              name={getMealTypeIcon(selectedMeal.type)} 
              size={24} 
              color={getMealTypeColor(selectedMeal.type)} 
            />
            <Text style={[styles.mealDetailsTypeText, { color: getMealTypeColor(selectedMeal.type) }]}>
              {selectedMeal.type.charAt(0).toUpperCase() + selectedMeal.type.slice(1)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleMealClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.mealDetailsName, { color: colors.text }]}>
          {selectedMeal.name}
        </Text>

        <View style={styles.mealDetailsStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {selectedMeal.calories}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Calories
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {selectedMeal.protein}g
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Protein
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {selectedMeal.carbs}g
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Carbs
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {selectedMeal.fat}g
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              Fat
            </Text>
          </View>
        </View>

        <View style={styles.mealDetailsMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.gray} />
            <Text style={[styles.metaText, { color: colors.gray }]}>
              Prep Time: {selectedMeal.prepTime} minutes
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="fitness-outline" size={16} color={colors.gray} />
            <Text style={[styles.metaText, { color: getDifficultyColor(selectedMeal.difficulty) }]}>
              Difficulty: {getDifficultyText(selectedMeal.difficulty)}
            </Text>
          </View>
        </View>

        <View style={styles.mealDetailsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredients
          </Text>
          <FlatList
            data={selectedMeal.ingredients}
            renderItem={({ item: ingredient }) => (
              <Text style={[styles.ingredientItem, { color: colors.gray }]}>
                • {ingredient}
              </Text>
            )}
            keyExtractor={(item, index) => `ingredient-${index}`}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.mealDetailsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Instructions
          </Text>
          {selectedMeal.instructions.map((instruction, index) => (
            <Text key={index} style={[styles.instructionItem, { color: colors.gray }]}>
              {index + 1}. {instruction}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addToPlanButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Success', 'Meal added to your plan!')}
        >
          <Text style={styles.addToPlanText}>
            Add to My Plan
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => console.log('Back pressed')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Meal Plan
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.background }]}
          placeholder="Search meals..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Day Selector */}
      <View style={styles.daysSelector}>
        <FlatList
          data={mealPlans}
          renderItem={({ item, index }) => (
            <TouchableOpacity
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
                {item.day}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.day}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysList}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading meal plan...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderDayPlan()}
        </ScrollView>
      )}

      {/* Meal Details Modal */}
      {selectedMeal && renderMealDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  daysSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  daysList: {
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Inter-Regular',
  },
  dayPlanContainer: {
    padding: 16,
  },
  dayPlanHeader: {
    marginBottom: 20,
  },
  dayPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  dayPlanStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  mealsList: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  mealDetailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  mealDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealDetailsType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealDetailsTypeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  mealDetailsName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  mealDetailsStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  mealDetailsMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  mealDetailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  ingredientItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  instructionItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  addToPlanButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  addToPlanText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});