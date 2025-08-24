import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HealthGoal {
  id: number;
  goalType: string;
  goalTitle: string;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  status: string;
}

interface GoalProgressCardProps {
  goal: HealthGoal;
  onPress?: () => void;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ goal, onPress }) => {
  const { colors } = useTheme();
  
  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'weight_loss':
        return 'fitness-outline';
      case 'weight_gain':
        return 'add-circle-outline';
      case 'muscle_gain':
        return 'fitness-outline';
      case 'fitness_improvement':
        return 'fitness-outline';
      case 'health_improvement':
        return 'heart-outline';
      default:
        return 'flag-outline';
    }
  };

  const getGoalColor = (goalType: string) => {
    switch (goalType) {
      case 'weight_loss':
        return '#EF4444';
      case 'weight_gain':
        return '#10B981';
      case 'muscle_gain':
        return '#3B82F6';
      case 'fitness_improvement':
        return '#8B5CF6';
      case 'health_improvement':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'paused':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'paused':
        return 'pause-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getProgressColor = (progressPercentage: number) => {
    if (progressPercentage >= 80) return '#10B981';
    if (progressPercentage >= 50) return '#F59E0B';
    return '#3B82F6';
  };

  const formatProgress = (progressPercentage: number) => {
    return `${Math.round(progressPercentage)}%`;
  };

  const formatTargetValue = (targetValue: number, unit: string) => {
    return `${targetValue} ${unit}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${getGoalColor(goal.goalType)}20` }]}>
          <Ionicons 
            name={getGoalIcon(goal.goalType) as any} 
            size={24} 
            color={getGoalColor(goal.goalType)} 
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            {goal.goalTitle}
          </Text>
          <View style={styles.goalMeta}>
            <Text style={[styles.goalTarget, { color: colors.gray }]}>
              Target: {formatTargetValue(goal.targetValue, goal.unit)}
            </Text>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={getStatusIcon(goal.status) as any} 
                size={16} 
                color={getStatusColor(goal.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(goal.status) }]}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: getProgressColor(goal.progressPercentage) }]}>
            {formatProgress(goal.progressPercentage)}
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: getProgressColor(goal.progressPercentage),
                width: `${goal.progressPercentage}%`
              }
            ]} 
          />
        </View>
        
        {goal.progressPercentage >= 100 && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={[styles.achievementText, { color: '#F59E0B' }]}>
              Goal Achieved!
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  goalMeta: {
    gap: 8,
  },
  goalTarget: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    padding: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});