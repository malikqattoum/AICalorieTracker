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

type AiInsightsCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Insight = {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'warning' | 'achievement';
  createdAt: string;
};

export default function AiInsightsCard() {
  const navigation = useNavigation<AiInsightsCardNavigationProp>();
  const { colors } = useTheme();

  // Fetch AI insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/insights`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      return response.json();
    },
    // Mock data for development
    placeholderData: [
      {
        id: '1',
        title: 'Protein Intake',
        content: 'Your protein intake has been consistently below your goal. Consider adding more lean protein sources like chicken, fish, or legumes to your meals.',
        type: 'tip',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Calorie Consistency',
        content: 'Great job maintaining consistent calorie intake this week! This helps establish a stable metabolic pattern.',
        type: 'achievement',
        createdAt: new Date().toISOString(),
      },
    ],
  });

  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return 'bulb-outline';
      case 'warning':
        return 'alert-circle-outline';
      case 'achievement':
        return 'trophy-outline';
      default:
        return 'information-circle-outline';
    }
  };

  // Get color based on insight type
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'tip':
        return colors.primary;
      case 'warning':
        return colors.error;
      case 'achievement':
        return '#F59E0B'; // Amber
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {i18n.t('home.aiInsights')}
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
      ) : insights && insights.length > 0 ? (
        <View style={styles.insightsContainer}>
          {insights.slice(0, 2).map((insight: Insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[styles.insightItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('NutritionCoach')}
            >
              <View 
                style={[
                  styles.insightIconContainer, 
                  { backgroundColor: getInsightColor(insight.type) + '20' }
                ]}
              >
                <Ionicons 
                  name={getInsightIcon(insight.type)} 
                  size={20} 
                  color={getInsightColor(insight.type)} 
                />
              </View>
              
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  {insight.title}
                </Text>
                <Text 
                  style={[styles.insightText, { color: colors.gray }]} 
                  numberOfLines={2}
                >
                  {insight.content}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            No insights available yet. Keep tracking your meals to receive personalized insights.
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
  insightsContainer: {
    paddingHorizontal: 16,
  },
  insightItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
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