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

type AchievementsCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  unlockedAt: string | null;
};

export default function AchievementsCard() {
  const navigation = useNavigation<AchievementsCardNavigationProp>();
  const { colors } = useTheme();

  // Fetch user achievements
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/achievements`);
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      return response.json();
    },
    // Mock data for development
    placeholderData: [
      {
        id: '1',
        title: 'Consistent Tracker',
        description: 'Track your meals for 7 consecutive days',
        icon: 'calendar-outline',
        progress: 5,
        target: 7,
        completed: false,
        unlockedAt: null,
      },
      {
        id: '2',
        title: 'Protein Champion',
        description: 'Meet your protein goal for 5 days',
        icon: 'barbell-outline',
        progress: 3,
        target: 5,
        completed: false,
        unlockedAt: null,
      },
      {
        id: '3',
        title: 'First Scan',
        description: 'Scan your first meal',
        icon: 'camera-outline',
        progress: 1,
        target: 1,
        completed: true,
        unlockedAt: new Date().toISOString(),
      },
    ],
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/user/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
    // Mock data for development
    placeholderData: {
      streakDays: 5,
      perfectDays: 3,
      totalMeals: 28,
    },
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {i18n.t('home.achievements')}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.viewAllButton}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            {i18n.t('home.viewAll')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="flame-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.streakDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.streakDays')}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.perfectDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.perfectDays')}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#6366F120' }]}>
              <Ionicons name="restaurant-outline" size={20} color="#6366F1" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.totalMeals}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.totalMeals')}
            </Text>
          </View>
        </View>
      )}

      {/* Achievements Section */}
      <View style={styles.achievementsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          In Progress
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : achievements && achievements.length > 0 ? (
          <View>
            {achievements
              .filter(a => !a.completed)
              .slice(0, 2)
              .map((achievement: Achievement) => (
                <View 
                  key={achievement.id} 
                  style={[styles.achievementItem, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={achievement.icon as any} size={20} color={colors.primary} />
                  </View>
                  
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementTitle, { color: colors.text }]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDescription, { color: colors.gray }]}>
                      {achievement.description}
                    </Text>
                    
                    <View style={styles.progressContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { backgroundColor: colors.lightGray }
                        ]}
                      >
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              backgroundColor: colors.primary,
                              width: `${(achievement.progress / achievement.target) * 100}%`,
                            }
                          ]} 
                        />
                      </View>
                      
                      <Text style={[styles.progressText, { color: colors.gray }]}>
                        {achievement.progress}/{achievement.target}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              
            {achievements.some(a => a.completed) && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                  Completed
                </Text>
                
                {achievements
                  .filter(a => a.completed)
                  .slice(0, 1)
                  .map((achievement: Achievement) => (
                    <View 
                      key={achievement.id} 
                      style={styles.achievementItem}
                    >
                      <View style={[styles.achievementIconContainer, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name={achievement.icon as any} size={20} color="#10B981" />
                      </View>
                      
                      <View style={styles.achievementInfo}>
                        <Text style={[styles.achievementTitle, { color: colors.text }]}>
                          {achievement.title}
                        </Text>
                        <Text style={[styles.achievementDescription, { color: colors.gray }]}>
                          {achievement.description}
                        </Text>
                        
                        <View style={styles.completedContainer}>
                          <Ionicons name="trophy" size={16} color="#F59E0B" />
                          <Text style={[styles.completedText, { color: '#10B981' }]}>
                            Completed!
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No achievements available yet. Keep using the app to unlock achievements!
            </Text>
          </View>
        )}
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  achievementsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});