import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface NutritionSummaryCardProps {
  stats: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    water: number;
  };
}

export default function NutritionSummaryCard({ stats }: NutritionSummaryCardProps) {
  const { colors } = useTheme();

  const getCalorieColor = (calories: number) => {
    if (calories < 1500) return '#10B981'; // Green - under target
    if (calories < 2000) return '#F59E0B'; // Yellow - on target
    return '#EF4444'; // Red - over target
  };

  const getMacroColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage < 80) return '#EF4444'; // Red - under target
    if (percentage > 120) return '#F59E0B'; // Yellow - over target
    return '#10B981'; // Green - on target
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Today's Nutrition Summary
      </Text>
      
      {/* Calories */}
      <View style={styles.calorieSection}>
        <View style={styles.calorieInfo}>
          <Text style={[styles.calorieLabel, { color: colors.gray }]}>
            Calories
          </Text>
          <Text style={[styles.calorieValue, { color: getCalorieColor(stats.calories) }]}>
            {stats.calories}
          </Text>
          <Text style={[styles.calorieTarget, { color: colors.gray }]}>
            / 2000 cal
          </Text>
        </View>
        <View style={[styles.calorieProgress, { backgroundColor: colors.background }]}>
          <View 
            style={[
              styles.calorieProgressFill, 
              { 
                width: `${Math.min((stats.calories / 2000) * 100, 100)}%`,
                backgroundColor: getCalorieColor(stats.calories)
              }
            ]}
          />
        </View>
      </View>

      {/* Macros */}
      <View style={styles.macrosSection}>
        <View style={styles.macroItem}>
          <View style={styles.macroIcon}>
            <Ionicons name="fitness-outline" size={16} color={getMacroColor(stats.protein, 150)} />
          </View>
          <View style={styles.macroInfo}>
            <Text style={[styles.macroLabel, { color: colors.gray }]}>
              Protein
            </Text>
            <Text style={[styles.macroValue, { color: getMacroColor(stats.protein, 150) }]}>
              {stats.protein}g
            </Text>
          </View>
          <View style={styles.macroTarget}>
            <Text style={[styles.macroTargetText, { color: colors.gray }]}>
              150g
            </Text>
          </View>
        </View>

        <View style={styles.macroItem}>
          <View style={styles.macroIcon}>
            <Ionicons name="restaurant-outline" size={16} color={getMacroColor(stats.carbs, 250)} />
          </View>
          <View style={styles.macroInfo}>
            <Text style={[styles.macroLabel, { color: colors.gray }]}>
              Carbs
            </Text>
            <Text style={[styles.macroValue, { color: getMacroColor(stats.carbs, 250) }]}>
              {stats.carbs}g
            </Text>
          </View>
          <View style={styles.macroTarget}>
            <Text style={[styles.macroTargetText, { color: colors.gray }]}>
              250g
            </Text>
          </View>
        </View>

        <View style={styles.macroItem}>
          <View style={styles.macroIcon}>
            <Ionicons name="water-outline" size={16} color={getMacroColor(stats.fat, 70)} />
          </View>
          <View style={styles.macroInfo}>
            <Text style={[styles.macroLabel, { color: colors.gray }]}>
              Fat
            </Text>
            <Text style={[styles.macroValue, { color: getMacroColor(stats.fat, 70) }]}>
              {stats.fat}g
            </Text>
          </View>
          <View style={styles.macroTarget}>
            <Text style={[styles.macroTargetText, { color: colors.gray }]}>
              70g
            </Text>
          </View>
        </View>
      </View>

      {/* Additional nutrients */}
      <View style={styles.nutrientsSection}>
        <View style={styles.nutrientItem}>
          <Text style={[styles.nutrientLabel, { color: colors.gray }]}>
            Fiber
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {stats.fiber}g
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={[styles.nutrientLabel, { color: colors.gray }]}>
            Sugar
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {stats.sugar}g
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={[styles.nutrientLabel, { color: colors.gray }]}>
            Sodium
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {stats.sodium}mg
          </Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={[styles.nutrientLabel, { color: colors.gray }]}>
            Water
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {stats.water}L
          </Text>
        </View>
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  calorieSection: {
    marginBottom: 20,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calorieLabel: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Inter-Regular',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
    fontFamily: 'Inter-Bold',
  },
  calorieTarget: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  calorieProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  calorieProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macrosSection: {
    marginBottom: 20,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  macroInfo: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  macroTarget: {
    alignItems: 'flex-end',
  },
  macroTargetText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  nutrientsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    width: '48%',
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
});