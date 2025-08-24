import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface AiInsightsCardProps {
  insights?: Array<{
    id: string;
    title: string;
    description: string;
    type: 'nutrition' | 'fitness' | 'health' | 'behavior';
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    timestamp: string;
  }>;
}

export default function AiInsightsCard({ insights = [] }: AiInsightsCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Mock AI insights data
  const mockInsights = [
    {
      id: '1',
      title: 'Protein Intake Optimization',
      description: 'Your protein intake is 15% below target. Consider adding lean proteins like chicken, fish, or legumes to your meals.',
      type: 'nutrition' as const,
      priority: 'high' as const,
      actionable: true,
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      title: 'Hydration Reminder',
      description: 'You\'ve consumed only 1.2L of water today. Aim for 2.5L to maintain optimal hydration levels.',
      type: 'health' as const,
      priority: 'medium' as const,
      actionable: true,
      timestamp: '4 hours ago',
    },
    {
      id: '3',
      title: 'Meal Timing Analysis',
      description: 'Your dinner is typically consumed 30 minutes later than optimal. Try to eat dinner 2-3 hours before bedtime.',
      type: 'behavior' as const,
      priority: 'low' as const,
      actionable: true,
      timestamp: '6 hours ago',
    },
    {
      id: '4',
      title: 'Nutrient Deficiency Alert',
      description: 'Your vitamin D levels appear to be low based on your meal patterns. Consider incorporating fatty fish or fortified foods.',
      type: 'nutrition' as const,
      priority: 'high' as const,
      actionable: true,
      timestamp: '1 day ago',
    },
    {
      id: '5',
      title: 'Exercise Recovery',
      description: 'Your post-workout nutrition could be improved. Add 20-30g of protein within 30 minutes of exercise for better recovery.',
      type: 'fitness' as const,
      priority: 'medium' as const,
      actionable: true,
      timestamp: '1 day ago',
    },
  ];

  const displayInsights = insights.length > 0 ? insights : mockInsights;
  const visibleInsights = expanded ? displayInsights : displayInsights.slice(0, 3);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'nutrition':
        return 'restaurant';
      case 'fitness':
        return 'fitness';
      case 'health':
        return 'heart';
      case 'behavior':
        return 'people';
      default:
        return 'bulb';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'nutrition':
        return '#EF4444';
      case 'fitness':
        return '#10B981';
      case 'health':
        return '#3B82F6';
      case 'behavior':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Normal';
    }
  };

  const handleInsightPress = (insightId: string) => {
    // Handle insight interaction
    console.log('Insight pressed:', insightId);
  };

  const handleActionablePress = (insightId: string) => {
    // Handle actionable insight
    console.log('Actionable insight:', insightId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.insightsIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="bulb" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                AI Insights
              </Text>
              <Text style={[styles.subtitle, { color: colors.gray }]}>
                Personalized recommendations for you
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.insightsList}
      >
        {visibleInsights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            style={[styles.insightItem, { backgroundColor: colors.background }]}
            onPress={() => handleInsightPress(insight.id)}
            activeOpacity={0.7}
          >
            <View style={styles.insightHeader}>
              <View style={[styles.insightType, { backgroundColor: getInsightColor(insight.type) + '20' }]}>
                <Ionicons name={getInsightIcon(insight.type)} size={16} color={getInsightColor(insight.type)} />
              </View>
              <View style={styles.insightPriority}>
                <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
                  {getPriorityText(insight.priority)}
                </Text>
              </View>
            </View>

            <Text style={[styles.insightTitle, { color: colors.text }]}>
              {insight.title}
            </Text>

            <Text style={[styles.insightDescription, { color: colors.gray }]}>
              {insight.description}
            </Text>

            <View style={styles.insightFooter}>
              <Text style={[styles.insightTime, { color: colors.gray }]}>
                {insight.timestamp}
              </Text>
              {insight.actionable && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleActionablePress(insight.id);
                  }}
                >
                  <Text style={styles.actionButtonText}>
                    Take Action
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {displayInsights.length > 3 && !expanded && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(true)}
        >
          <Text style={[styles.expandText, { color: colors.primary }]}>
            Show {displayInsights.length - 3} More Insights
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
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
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  insightsList: {
    maxHeight: 400,
  },
  insightItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
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