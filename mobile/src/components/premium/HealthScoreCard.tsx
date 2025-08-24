import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface HealthScore {
  id: number;
  scoreType: string;
  scoreValue: number;
  calculationDate: string;
  trendDirection: string;
}

interface HealthScoreCardProps {
  score: HealthScore;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score }) => {
  const { colors } = useTheme();
  
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return '#10B981'; // Green
    if (scoreValue >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreLabel = (scoreType: string) => {
    switch (scoreType) {
      case 'nutrition':
        return 'Nutrition';
      case 'fitness':
        return 'Fitness';
      case 'recovery':
        return 'Recovery';
      case 'consistency':
        return 'Consistency';
      case 'overall':
        return 'Overall';
      default:
        return scoreType;
    }
  };

  const getTrendIcon = (trendDirection: string) => {
    switch (trendDirection) {
      case 'increasing':
        return '↗';
      case 'decreasing':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = (trendDirection: string) => {
    switch (trendDirection) {
      case 'increasing':
        return '#10B981';
      case 'decreasing':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.scoreLabel, { color: colors.text }]}>
          {getScoreLabel(score.scoreType)}
        </Text>
        <Text style={[styles.trendIcon, { color: getTrendColor(score.trendDirection) }]}>
          {getTrendIcon(score.trendDirection)}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: getScoreColor(score.scoreValue) }]}>
          {Math.round(score.scoreValue)}
        </Text>
        <Text style={[styles.scoreMax, { color: colors.gray }]}>
          / 100
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: getScoreColor(score.scoreValue),
              width: `${score.scoreValue}%`
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});