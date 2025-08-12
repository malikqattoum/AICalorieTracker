import React, { useState } from 'react';
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

type NutritionTipsCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Tip = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

export default function NutritionTipsCard() {
  const navigation = useNavigation<NutritionTipsCardNavigationProp>();
  const { colors } = useTheme();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Fetch nutrition tips
  const { data: tips, isLoading } = useQuery({
    queryKey: ['nutritionTips'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/nutrition-tips`);
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition tips');
      }
      return response.json();
    },
    // Mock data for development
    placeholderData: [
      {
        id: '1',
        title: 'Hydration Matters',
        content: 'Drinking enough water is crucial for metabolism and digestion. Aim for at least 8 glasses daily, and more if you exercise regularly.',
        category: 'hydration',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Protein After Workouts',
        content: 'Consuming protein within 30 minutes after exercise helps muscle recovery and growth. Good options include a protein shake, Greek yogurt, or lean meat.',
        category: 'protein',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Fiber for Gut Health',
        content: 'A diet rich in fiber promotes good gut bacteria and helps prevent digestive issues. Include plenty of fruits, vegetables, and whole grains in your meals.',
        category: 'fiber',
        createdAt: new Date().toISOString(),
      },
    ],
  });

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hydration':
        return 'water-outline';
      case 'protein':
        return 'barbell-outline';
      case 'fiber':
        return 'leaf-outline';
      case 'vitamins':
        return 'medkit-outline';
      case 'fats':
        return 'flask-outline';
      default:
        return 'nutrition-outline';
    }
  };

  // Handle next tip
  const handleNextTip = () => {
    if (tips && tips.length > 0) {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }
  };

  // Handle previous tip
  const handlePrevTip = () => {
    if (tips && tips.length > 0) {
      setCurrentTipIndex((prevIndex) => (prevIndex - 1 + tips.length) % tips.length);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {i18n.t('home.nutritionTips')}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('NutritionCoach')}
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
      ) : tips && tips.length > 0 ? (
        <View style={styles.tipContainer}>
          <View style={styles.tipContent}>
            <View 
              style={[
                styles.tipIconContainer, 
                { backgroundColor: colors.primary + '20' }
              ]}
            >
              <Ionicons 
                name={getCategoryIcon(tips[currentTipIndex].category)} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            
            <View style={styles.tipTextContainer}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                {tips[currentTipIndex].title}
              </Text>
              <Text style={[styles.tipText, { color: colors.gray }]}>
                {tips[currentTipIndex].content}
              </Text>
            </View>
          </View>
          
          <View style={styles.tipNavigation}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.background }]}
              onPress={handlePrevTip}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.tipIndicators}>
              {tips.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tipIndicator, 
                    { 
                      backgroundColor: index === currentTipIndex 
                        ? colors.primary 
                        : colors.border 
                    }
                  ]} 
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.background }]}
              onPress={handleNextTip}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            No nutrition tips available at the moment.
          </Text>
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
  tipContainer: {
    padding: 16,
  },
  tipContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  tipNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});