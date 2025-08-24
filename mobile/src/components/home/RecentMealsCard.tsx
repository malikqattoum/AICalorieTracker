import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RecentMealsCardProps = {
  meals?: Array<{
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    date: string;
    image?: string;
  }>;
};

type RecentMealsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecentMealsCard({ meals = [] }: RecentMealsCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<RecentMealsNavigationProp>();
  const [expanded, setExpanded] = useState(false);

  // Mock data if no meals provided
  const mockMeals = [
    {
      id: '1',
      name: 'Grilled Chicken Salad',
      calories: 320,
      protein: 35,
      carbs: 12,
      fat: 15,
      time: '12:30 PM',
      date: 'Today',
      image: 'https://via.placeholder.com/60x60/10B981/FFFFFF?text=Salad',
    },
    {
      id: '2',
      name: 'Oatmeal with Berries',
      calories: 280,
      protein: 8,
      carbs: 45,
      fat: 8,
      time: '8:15 AM',
      date: 'Today',
      image: 'https://via.placeholder.com/60x60/F59E0B/FFFFFF?text=Oats',
    },
    {
      id: '3',
      name: 'Protein Shake',
      calories: 180,
      protein: 30,
      carbs: 10,
      fat: 2,
      time: '6:00 PM',
      date: 'Yesterday',
      image: 'https://via.placeholder.com/60x60/3B82F6/FFFFFF?text=Shake',
    },
    {
      id: '4',
      name: 'Salmon with Vegetables',
      calories: 420,
      protein: 38,
      carbs: 18,
      fat: 22,
      time: '7:30 PM',
      date: 'Yesterday',
      image: 'https://via.placeholder.com/60x60/EF4444/FFFFFF?text=Fish',
    },
  ];

  const displayMeals = meals.length > 0 ? meals : mockMeals;
  const visibleMeals = expanded ? displayMeals : displayMeals.slice(0, 2);

  const handleMealPress = (mealId: string) => {
    navigation.navigate('MealDetails', { mealId });
  };

  const renderMealItem = ({ item }: { item: typeof mockMeals[0] }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleMealPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.mealContent}>
        <View style={styles.mealImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.mealImage} />
          ) : (
            <View style={[styles.mealImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="restaurant" size={24} color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.mealInfo}>
          <Text style={[styles.mealName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.mealTime, { color: colors.gray }]}>
            {item.date} • {item.time}
          </Text>
          <View style={styles.mealMacros}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.text }]}>
                {item.calories}
              </Text>
              <Text style={[styles.macroLabel, { color: colors.gray }]}>
                cal
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.primary }]}>
                {item.protein}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.gray }]}>
                P
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.primary }]}>
                {item.carbs}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.gray }]}>
                C
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.primary }]}>
                {item.fat}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.gray }]}>
                F
              </Text>
            </View>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent Meals
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('MealHistory' as any)}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={visibleMeals.map(meal => ({ ...meal, image: meal.image || 'placeholder' }))}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.mealsList}
      />
      
      {displayMeals.length > 2 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={[styles.expandText, { color: colors.primary }]}>
            {expanded ? 'Show Less' : `Show ${displayMeals.length - 2} More`}
          </Text>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      )}
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
    marginBottom: 12,
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
  mealsList: {
    gap: 12,
  },
  mealItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImageContainer: {
    marginRight: 12,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  mealImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealTime: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
    fontFamily: 'Inter-SemiBold',
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    fontFamily: 'Inter-Medium',
  },
});