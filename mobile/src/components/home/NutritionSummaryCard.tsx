import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

type NutritionStat = {
  value: number;
  goal: number;
  unit: string;
};

type NutritionStats = {
  calories: NutritionStat;
  protein: NutritionStat;
  carbs: NutritionStat;
  fat: NutritionStat;
  fiber: NutritionStat;
};

type Props = {
  stats: NutritionStats | undefined;
};

export default function NutritionSummaryCard({ stats }: Props) {
  const { colors } = useTheme();

  if (!stats) {
    return null;
  }

  const { calories, protein, carbs, fat } = stats;

  // Calculate remaining calories
  const remaining = calories.goal - calories.value;
  const remainingPercentage = Math.min(100, Math.max(0, (remaining / calories.goal) * 100));

  // Calculate progress percentages
  const proteinPercentage = Math.min(100, Math.max(0, (protein.value / protein.goal) * 100));
  const carbsPercentage = Math.min(100, Math.max(0, (carbs.value / carbs.goal) * 100));
  const fatPercentage = Math.min(100, Math.max(0, (fat.value / fat.goal) * 100));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {i18n.t('home.dailyStats')}
      </Text>

      {/* Calories Remaining */}
      <View style={styles.caloriesContainer}>
        <View style={styles.caloriesTextContainer}>
          <Text style={[styles.caloriesTitle, { color: colors.text }]}>
            {i18n.t('home.caloriesRemaining')}
          </Text>
          <Text style={[styles.caloriesValue, { color: colors.primary }]}>
            {remaining > 0 ? remaining : 0}
          </Text>
        </View>

        <View style={[styles.progressBarContainer, { backgroundColor: colors.lightGray }]}>
          <View
            style={[
              styles.progressBar,
              { 
                backgroundColor: colors.primary,
                width: `${remainingPercentage}%`,
              },
            ]}
          />
        </View>

        <View style={styles.caloriesSummary}>
          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatLabel, { color: colors.gray }]}>
              {i18n.t('home.goal')}
            </Text>
            <Text style={[styles.calorieStatValue, { color: colors.text }]}>
              {calories.goal}
            </Text>
          </View>

          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatLabel, { color: colors.gray }]}>
              {i18n.t('home.consumed')}
            </Text>
            <Text style={[styles.calorieStatValue, { color: colors.text }]}>
              {calories.value}
            </Text>
          </View>

          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatLabel, { color: colors.gray }]}>
              {i18n.t('home.remaining')}
            </Text>
            <Text style={[styles.calorieStatValue, { color: colors.text }]}>
              {remaining > 0 ? remaining : 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Nutrition Summary */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {i18n.t('home.nutritionSummary')}
      </Text>

      {/* Protein */}
      <View style={styles.nutrientContainer}>
        <View style={styles.nutrientLabelContainer}>
          <Text style={[styles.nutrientLabel, { color: colors.text }]}>
            {i18n.t('home.protein')}
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {protein.value}g / {protein.goal}g
          </Text>
        </View>
        <View style={[styles.nutrientProgressContainer, { backgroundColor: colors.lightGray }]}>
          <View
            style={[
              styles.nutrientProgress,
              { backgroundColor: '#4ADE80', width: `${proteinPercentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Carbs */}
      <View style={styles.nutrientContainer}>
        <View style={styles.nutrientLabelContainer}>
          <Text style={[styles.nutrientLabel, { color: colors.text }]}>
            {i18n.t('home.carbs')}
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {carbs.value}g / {carbs.goal}g
          </Text>
        </View>
        <View style={[styles.nutrientProgressContainer, { backgroundColor: colors.lightGray }]}>
          <View
            style={[
              styles.nutrientProgress,
              { backgroundColor: '#60A5FA', width: `${carbsPercentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Fat */}
      <View style={styles.nutrientContainer}>
        <View style={styles.nutrientLabelContainer}>
          <Text style={[styles.nutrientLabel, { color: colors.text }]}>
            {i18n.t('home.fat')}
          </Text>
          <Text style={[styles.nutrientValue, { color: colors.text }]}>
            {fat.value}g / {fat.goal}g
          </Text>
        </View>
        <View style={[styles.nutrientProgressContainer, { backgroundColor: colors.lightGray }]}>
          <View
            style={[
              styles.nutrientProgress,
              { backgroundColor: '#F59E0B', width: `${fatPercentage}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  caloriesContainer: {
    marginBottom: 20,
  },
  caloriesTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  caloriesValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  caloriesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieStat: {
    alignItems: 'center',
  },
  calorieStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  calorieStatValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Inter-SemiBold',
  },
  nutrientContainer: {
    marginBottom: 12,
  },
  nutrientLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  nutrientValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  nutrientProgressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  nutrientProgress: {
    height: '100%',
    borderRadius: 3,
  },
});