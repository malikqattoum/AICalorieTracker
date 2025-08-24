import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HealthcareProfessional {
  id: number;
  professionalName: string;
  professionalType: string;
  practiceName?: string;
  accessLevel: string;
  status: string;
}

interface HealthcareConnectionCardProps {
  professional: HealthcareProfessional;
  onEdit?: () => void;
  onRemove?: () => void;
}

export const HealthcareConnectionCard: React.FC<HealthcareConnectionCardProps> = ({ 
  professional, 
  onEdit, 
  onRemove 
}) => {
  const { colors } = useTheme();
  
  const getProfessionalIcon = (professionalType: string) => {
    switch (professionalType) {
      case 'doctor':
        return 'medical-outline';
      case 'nutritionist':
        return 'restaurant-outline';
      case 'fitness_coach':
        return 'fitness-outline';
      case 'therapist':
        return 'chatbubbles-outline';
      default:
        return 'person-outline';
    }
  };

  const getProfessionalColor = (professionalType: string) => {
    switch (professionalType) {
      case 'doctor':
        return '#EF4444';
      case 'nutritionist':
        return '#10B981';
      case 'fitness_coach':
        return '#3B82F6';
      case 'therapist':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getAccessLevelColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'read_only':
        return '#F59E0B';
      case 'read_write':
        return '#3B82F6';
      case 'full_access':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getAccessLevelLabel = (accessLevel: string) => {
    switch (accessLevel) {
      case 'read_only':
        return 'Read Only';
      case 'read_write':
        return 'Read/Write';
      case 'full_access':
        return 'Full Access';
      default:
        return accessLevel;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle-outline';
      case 'inactive':
        return 'pause-circle-outline';
      case 'pending':
        return 'time-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Professional',
      `Are you sure you want to remove ${professional.professionalName} from your healthcare connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: onRemove
        }
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${getProfessionalColor(professional.professionalType)}20` }]}>
          <Ionicons 
            name={getProfessionalIcon(professional.professionalType) as any} 
            size={24} 
            color={getProfessionalColor(professional.professionalType)} 
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.professionalName, { color: colors.text }]}>
            {professional.professionalName}
          </Text>
          <View style={styles.professionalMeta}>
            <Text style={[styles.professionalType, { color: getProfessionalColor(professional.professionalType) }]}>
              {professional.professionalType.charAt(0).toUpperCase() + professional.professionalType.slice(1)}
            </Text>
            {professional.practiceName && (
              <Text style={[styles.practiceName, { color: colors.gray }]}>
                • {professional.practiceName}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(professional.status) as any} 
            size={16} 
            color={getStatusColor(professional.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(professional.status) }]}>
            {professional.status.charAt(0).toUpperCase() + professional.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.accessLevelContainer}>
        <Text style={[styles.accessLabel, { color: colors.text }]}>
          Access Level:
        </Text>
        <View style={[styles.accessBadge, { backgroundColor: getAccessLevelColor(professional.accessLevel) + '20' }]}>
          <Text style={[styles.accessText, { color: getAccessLevelColor(professional.accessLevel) }]}>
            {getAccessLevelLabel(professional.accessLevel)}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
          onPress={handleRemove}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 12,
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
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  professionalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  professionalType: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  practiceName: {
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
  accessLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accessLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accessText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});