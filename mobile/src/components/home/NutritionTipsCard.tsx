import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface NutritionTipsCardProps {
  tips?: Array<{
    id: string;
    title: string;
    description: string;
    category: 'weight-loss' | 'muscle-gain' | 'general-health' | 'meal-prep' | 'supplements';
    readTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    content: string;
  }>;
}

export default function NutritionTipsCard({ tips = [] }: NutritionTipsCardProps) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  // Mock nutrition tips data
  const mockTips = [
    {
      id: '1',
      title: 'The Science of Protein Timing',
      description: 'Learn when to consume protein for optimal muscle recovery and growth.',
      category: 'muscle-gain' as const,
      readTime: 5,
      difficulty: 'intermediate' as const,
      tags: ['protein', 'muscle', 'recovery'],
      content: `
Protein timing is crucial for maximizing muscle protein synthesis and recovery. Here are the key principles:

1. **Post-Workout Window**: Consume 20-30g of protein within 30-60 minutes after exercise to kickstart recovery.

2. **Evenly Distributed**: Spread your protein intake evenly throughout the day (4-6 meals) to maintain optimal muscle protein synthesis.

3. **Pre-Sleep Protein**: Casein protein or Greek yogurt before bed can provide sustained amino acid release during sleep.

4. **Total Daily Intake**: Aim for 1.6-2.2g of protein per kg of body weight for optimal muscle growth.

5. **Quality Matters**: Choose complete protein sources containing all essential amino acids.
      `.trim(),
    },
    {
      id: '2',
      title: 'Meal Prep Success Strategies',
      description: 'Master the art of meal prepping with these proven strategies.',
      category: 'meal-prep' as const,
      readTime: 8,
      difficulty: 'beginner' as const,
      tags: ['meal-prep', 'planning', 'efficiency'],
      content: `
Successful meal prepping requires the right approach and tools. Here's how to do it effectively:

1. **Plan Your Meals**: Start with a weekly meal plan and create a detailed shopping list.

2. **Choose the Right Containers**: Invest in high-quality, portion-controlled containers that are microwave and freezer safe.

3. **Batch Cooking**: Cook proteins, grains, and vegetables in bulk to save time throughout the week.

4. **Prep Ingredients**: Wash and chop vegetables, cook grains, and portion out snacks ahead of time.

5. **Label Everything**: Use labels to track dates and contents, especially for frozen items.

6. **Storage Guidelines**: Follow proper food safety practices and know storage times for different food types.
      `.trim(),
    },
    {
      id: '3',
      title: 'Understanding Macronutrients',
      description: 'A comprehensive guide to carbs, proteins, and fats.',
      category: 'general-health' as const,
      readTime: 10,
      difficulty: 'beginner' as const,
      tags: ['macros', 'nutrition', 'diet'],
      content: `
Macronutrients are the three main components of your diet that provide energy. Understanding them is key to optimal nutrition:

**Carbohydrates (45-65% of daily calories)**
- **Simple Carbs**: Found in fruits, milk, and processed foods. Provide quick energy.
- **Complex Carbs**: Found in whole grains, legumes, and vegetables. Provide sustained energy.
- **Fiber**: Important for digestive health and blood sugar control.

**Proteins (10-35% of daily calories)**
- **Complete Proteins**: Contain all essential amino acids (animal products, soy).
- **Incomplete Proteins**: Lack one or more essential amino acids (plant sources).
- **Quality**: Choose lean sources like chicken, fish, eggs, legumes, and tofu.

**Fats (20-35% of daily calories)**
- **Saturated Fats**: Limit intake (red meat, butter, coconut oil).
- **Unsaturated Fats**: Heart-healthy (olive oil, avocados, nuts).
- **Trans Fats**: Avoid completely (processed foods, fried foods).
      `.trim(),
    },
    {
      id: '4',
      title: 'Supplement Smart: What You Really Need',
      description: 'Cut through the supplement confusion with evidence-based recommendations.',
      category: 'supplements' as const,
      readTime: 7,
      difficulty: 'intermediate' as const,
      tags: ['supplements', 'vitamins', 'nutrition'],
      content: `
Not all supplements are created equal. Here's what science says about the most common ones:

**Essential Supplements:**
1. **Multivitamin**: Fills nutritional gaps in your diet.
2. **Vitamin D**: Especially important if you have limited sun exposure.
3. **Omega-3 Fatty Acids**: Supports brain and heart health.
4. **Protein Powder**: Convenient way to meet protein needs.

**Performance-Enhancing:**
1. **Creatine**: Proven to improve strength and power output.
2. **Caffeine**: Enhances focus and exercise performance.
3. **Beta-Alanine**: Reduces muscle fatigue during high-intensity exercise.

**Use With Caution:**
- Always consult with a healthcare provider before starting new supplements.
- Look for third-party testing (NSF, Informed Choice).
- Quality matters more than quantity.
      `.trim(),
    },
    {
      id: '5',
      title: 'Sustainable Weight Loss Strategies',
      description: 'Lose weight the healthy way with these science-backed approaches.',
      category: 'weight-loss' as const,
      readTime: 12,
      difficulty: 'intermediate' as const,
      tags: ['weight-loss', 'diet', 'health'],
      content: `
Sustainable weight loss is about making lasting lifestyle changes, not quick fixes:

1. **Create a Moderate Calorie Deficit**: Aim for 500-750 calories below maintenance for 1-2 lbs per week.

2. **Focus on Nutrient Density**: Choose foods that are high in nutrients but relatively low in calories.

3. **Increase Protein Intake**: Helps preserve muscle mass and increases satiety.

4. **Stay Hydrated**: Drink plenty of water and limit sugary beverages.

5. **Incorporate Strength Training**: Builds muscle which boosts metabolism.

6. **Get Enough Sleep**: Poor sleep disrupts hunger hormones and increases cravings.

7. **Manage Stress**: Chronic stress can lead to emotional eating and weight gain.

8. **Be Patient**: Healthy weight loss takes time and consistency.
      `.trim(),
    },
  ];

  const categories = [
    { id: 'all', name: 'All Tips', icon: 'grid-outline' },
    { id: 'weight-loss', name: 'Weight Loss', icon: 'fitness-outline' },
    { id: 'muscle-gain', name: 'Muscle Gain', icon: 'fitness-outline' },
    { id: 'general-health', name: 'Health', icon: 'heart-outline' },
    { id: 'meal-prep', name: 'Meal Prep', icon: 'restaurant-outline' },
    { id: 'supplements', name: 'Supplements', icon: 'pill-outline' },
  ];

  const displayTips = tips.length > 0 ? tips : mockTips;
  const filteredTips = selectedCategory === 'all' 
    ? displayTips 
    : displayTips.filter(tip => tip.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'weight-loss':
        return '#EF4444';
      case 'muscle-gain':
        return '#10B981';
      case 'general-health':
        return '#3B82F6';
      case 'meal-prep':
        return '#F59E0B';
      case 'supplements':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10B981';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return 'Unknown';
    }
  };

  const handleTipPress = (tipId: string) => {
    setExpandedTip(expandedTip === tipId ? null : tipId);
  };

  const renderTipItem = ({ item }: { item: typeof mockTips[0] }) => (
    <TouchableOpacity
      style={[styles.tipItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleTipPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.tipCategory, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]} />
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {item.category.replace('-', ' ')}
          </Text>
        </View>
        <View style={styles.tipMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.gray} />
            <Text style={[styles.metaText, { color: colors.gray }]}>
              {item.readTime} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="fitness-outline" size={12} color={colors.gray} />
            <Text style={[styles.metaText, { color: getDifficultyColor(item.difficulty) }]}>
              {getDifficultyText(item.difficulty)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.tipTitle, { color: colors.text }]}>
        {item.title}
      </Text>

      <Text style={[styles.tipDescription, { color: colors.gray }]}>
        {item.description}
      </Text>

      <View style={styles.tagsContainer}>
        {item.tags.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.background }]}>
            <Text style={[styles.tagText, { color: colors.gray }]}>
              #{tag}
            </Text>
          </View>
        ))}
      </View>

      {expandedTip === item.id && (
        <View style={styles.tipContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.contentText, { color: colors.text }]}>
              {item.content}
            </Text>
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Nutrition Tips
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedCategory === item.id ? colors.primary : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={16} 
                color={selectedCategory === item.id ? 'white' : colors.text} 
              />
              <Text style={[
                styles.categoryButtonText,
                { color: selectedCategory === item.id ? 'white' : colors.text }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.tipsList}
      >
        <FlatList
          data={filteredTips.map(tip => ({ ...tip, category: tip.category as any, difficulty: tip.difficulty as any }))}
          renderItem={renderTipItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.tipsContent}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  tipsList: {
    maxHeight: 400,
  },
  tipsContent: {
    gap: 12,
  },
  tipItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tipMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
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
  tipContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
});