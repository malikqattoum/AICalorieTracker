import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface Prediction {
  id: number;
  predictionType: string;
  predictionValue: number;
  confidenceScore: number;
  targetDate: string;
  recommendations: string[];
}

interface PredictionCardProps {
  prediction: Prediction;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const { colors } = useTheme();
  
  const getPredictionIcon = (predictionType: string) => {
    switch (predictionType) {
      case 'weight_projection':
        return 'scale-outline';
      case 'goal_achievement':
        return 'trophy-outline';
      case 'health_risk':
        return 'warning-outline';
      case 'performance_optimization':
        return 'fitness-outline';
      default:
        return 'analytics-outline';
    }
  };

  const getPredictionColor = (predictionType: string) => {
    switch (predictionType) {
      case 'weight_projection':
        return '#3B82F6';
      case 'goal_achievement':
        return '#10B981';
      case 'health_risk':
        return '#EF4444';
      case 'performance_optimization':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPredictionLabel = (predictionType: string) => {
    switch (predictionType) {
      case 'weight_projection':
        return 'Weight Projection';
      case 'goal_achievement':
        return 'Goal Achievement';
      case 'health_risk':
        return 'Health Risk';
      case 'performance_optimization':
        return 'Performance';
      default:
        return predictionType;
    }
  };

  const getConfidenceColor = (confidenceScore: number) => {
    if (confidenceScore >= 0.8) return '#10B981';
    if (confidenceScore >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const formatPredictionValue = (predictionType: string, value: number) => {
    switch (predictionType) {
      case 'weight_projection':
        return `${value.toFixed(1)} kg`;
      case 'goal_achievement':
        return `${value.toFixed(0)}%`;
      case 'health_risk':
        return value > 0.5 ? 'High Risk' : 'Low Risk';
      case 'performance_optimization':
        return value > 0.7 ? 'Optimal' : value > 0.4 ? 'Good' : 'Needs Improvement';
      default:
        return value.toString();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getPredictionIcon(prediction.predictionType) as any} 
            size={24} 
            color={getPredictionColor(prediction.predictionType)} 
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.predictionType, { color: colors.text }]}>
            {getPredictionLabel(prediction.predictionType)}
          </Text>
          <Text style={[styles.targetDate, { color: colors.gray }]}>
            {formatDate(prediction.targetDate)}
          </Text>
        </View>
      </View>
      
      <View style={styles.predictionValue}>
        <Text style={[styles.value, { color: getPredictionColor(prediction.predictionType) }]}>
          {formatPredictionValue(prediction.predictionType, prediction.predictionValue)}
        </Text>
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceLabel, { color: colors.gray }]}>
            Confidence:
          </Text>
          <Text style={[styles.confidenceValue, { color: getConfidenceColor(prediction.confidenceScore) }]}>
            {(prediction.confidenceScore * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
      
      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <View style={styles.recommendations}>
          <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
            Recommendations:
          </Text>
          <View style={styles.recommendationsList}>
            {prediction.recommendations.slice(0, 2).map((rec, index) => (
              <Text key={index} style={[styles.recommendationItem, { color: colors.gray }]}>
                • {rec}
              </Text>
            ))}
            {prediction.recommendations.length > 2 && (
              <Text style={[styles.recommendationItem, { color: colors.gray }]}>
                • +{prediction.recommendations.length - 2} more
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  predictionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  targetDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  predictionValue: {
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  recommendations: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  recommendationsList: {
    gap: 4,
  },
  recommendationItem: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
});