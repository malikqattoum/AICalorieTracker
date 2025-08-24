import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'nutrition' | 'fitness' | 'consistency' | 'milestones';
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedDate?: string;
  points: number;
}

interface AchievementsCardProps {
  achievements?: Achievement[];
}

export default function AchievementsCard({ achievements = [] }: AchievementsCardProps) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock achievements data
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Nutrition Master',
      description: 'Log 100 meals with complete nutritional information',
      icon: 'restaurant',
      color: '#EF4444',
      category: 'nutrition',
      progress: 75,
      target: 100,
      unlocked: false,
      points: 500,
    },
    {
      id: '2',
      title: 'Consistency King',
      description: 'Track meals for 30 consecutive days',
      icon: 'calendar',
      color: '#10B981',
      category: 'consistency',
      progress: 21,
      target: 30,
      unlocked: false,
      points: 300,
    },
    {
      id: '3',
      title: 'Early Bird',
      description: 'Log breakfast before 9 AM for 7 days',
      icon: 'sunny',
      color: '#F59E0B',
      category: 'consistency',
      progress: 7,
      target: 7,
      unlocked: true,
      unlockedDate: '2024-01-15',
      points: 200,
    },
    {
      id: '4',
      title: 'Protein Pro',
      description: 'Reach daily protein target for 14 days',
      icon: 'fitness',
      color: '#3B82F6',
      category: 'nutrition',
      progress: 10,
      target: 14,
      unlocked: false,
      points: 400,
    },
    {
      id: '5',
      title: 'Hydration Hero',
      description: 'Meet daily water intake goal for 21 days',
      icon: 'water',
      color: '#06B6D4',
      category: 'consistency',
      progress: 15,
      target: 21,
      unlocked: false,
      points: 350,
    },
    {
      id: '6',
      title: 'First Month',
      description: 'Complete one month of consistent tracking',
      icon: 'trophy',
      color: '#8B5CF6',
      category: 'milestones',
      progress: 1,
      target: 1,
      unlocked: true,
      unlockedDate: '2024-01-01',
      points: 1000,
    },
    {
      id: '7',
      title: 'Meal Variety',
      description: 'Log 50 different food items',
      icon: 'apps',
      color: '#EC4899',
      category: 'nutrition',
      progress: 32,
      target: 50,
      unlocked: false,
      points: 250,
    },
    {
      id: '8',
      title: 'Week Warrior',
      description: 'Track all meals for a full week',
      icon: 'star',
      color: '#F59E0B',
      category: 'milestones',
      progress: 0,
      target: 1,
      unlocked: false,
      points: 600,
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'nutrition', name: 'Nutrition', icon: 'restaurant-outline' },
    { id: 'fitness', name: 'Fitness', icon: 'fitness-outline' },
    { id: 'consistency', name: 'Consistency', icon: 'calendar-outline' },
    { id: 'milestones', name: 'Milestones', icon: 'trophy-outline' },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : mockAchievements;
  const filteredAchievements = selectedCategory === 'all' 
    ? displayAchievements 
    : displayAchievements.filter(achievement => achievement.category === selectedCategory);

  const totalPoints = displayAchievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const unlockedCount = displayAchievements.filter(a => a.unlocked).length;
  const totalCount = displayAchievements.length;

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return '#F59E0B';
    if (percentage >= 50) return '#EF4444';
    return '#6B7280';
  };

  const renderAchievementItem = ({ item }: { item: Achievement }) => (
    <View style={[styles.achievementItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.achievementHeader}>
        <View style={[styles.achievementIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={24} color={item.color} />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.achievementDescription, { color: colors.gray }]}>
            {item.description}
          </Text>
        </View>
        {item.unlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {item.progress} / {item.target}
          </Text>
          <Text style={[styles.pointsText, { color: item.color }]}>
            +{item.points} pts
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min((item.progress / item.target) * 100, 100)}%`,
                backgroundColor: getProgressColor(item.progress, item.target)
              }
            ]}
          />
        </View>
      </View>

      {item.unlocked && item.unlockedDate && (
        <View style={styles.unlockedInfo}>
          <Text style={[styles.unlockedDate, { color: colors.gray }]}>
            Unlocked on {new Date(item.unlockedDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.statsSection}>
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: colors.text }]}>
              {unlockedCount}
            </Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>
              Unlocked
            </Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: colors.text }]}>
              {totalCount}
            </Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>
              Total
            </Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={[styles.statsValue, { color: colors.primary }]}>
              {totalPoints}
            </Text>
            <Text style={[styles.statsLabel, { color: colors.gray }]}>
              Points
            </Text>
          </View>
        </View>
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
        style={styles.achievementsList}
      >
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievementItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.achievementsContent}
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
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
  achievementsList: {
    maxHeight: 400,
  },
  achievementsContent: {
    gap: 12,
  },
  achievementItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  unlockedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  unlockedDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});