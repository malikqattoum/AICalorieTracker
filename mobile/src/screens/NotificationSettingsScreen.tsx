import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    mealReminders: true,
    mealReminderTimes: {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '19:00',
    },
    weeklyReports: true,
    weeklyReportDay: 'sunday',
    weeklyReportTime: '09:00',
    nutritionTips: true,
    nutritionTipFrequency: 'daily',
    achievementNotifications: true,
    goalReminders: true,
    waterReminders: false,
    waterReminderInterval: 60, // minutes
  });

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const permission = await Notifications.getPermissionsAsync();
    setPermissions(permission);
  };

  const requestPermissions = async () => {
    const permission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    setPermissions(permission);
    
    if (!permission.granted) {
      Alert.alert(
        'Permissions Required',
        'To receive notifications, please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => Notifications.openSettingsAsync() 
          },
        ]
      );
    }
  };

  // Save notification settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      // In production, this would call the real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Schedule notifications based on settings
      if (newSettings.pushEnabled && permissions?.granted) {
        await scheduleNotifications(newSettings);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Your notification preferences have been updated',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.message || 'Failed to save notification settings',
      });
    },
  });

  const scheduleNotifications = async (notificationSettings: typeof settings) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationSettings.pushEnabled) return;

    // Schedule meal reminders
    if (notificationSettings.mealReminders) {
      const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
      
      for (const mealType of mealTypes) {
        const time = notificationSettings.mealReminderTimes[mealType];
        const [hours, minutes] = time.split(':').map(Number);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${mealType}! 🍽️`,
            body: `Don't forget to track your ${mealType} in AI Calorie Tracker`,
            data: { type: 'meal_reminder', mealType },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }
    }

    // Schedule weekly reports
    if (notificationSettings.weeklyReports) {
      const [hours, minutes] = notificationSettings.weeklyReportTime.split(':').map(Number);
      const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(notificationSettings.weeklyReportDay) + 1;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Weekly Nutrition Report 📊',
          body: 'Check out your weekly nutrition progress and insights!',
          data: { type: 'weekly_report' },
        },
        trigger: {
          weekday,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }

    // Schedule water reminders
    if (notificationSettings.waterReminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Stay Hydrated! 💧',
          body: 'Remember to drink some water',
          data: { type: 'water_reminder' },
        },
        trigger: {
          seconds: notificationSettings.waterReminderInterval * 60,
          repeats: true,
        },
      });
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    if (key === 'pushEnabled' && value && !permissions?.granted) {
      requestPermissions();
      return;
    }

    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedToggle = (parent: string, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...prev[parent as keyof typeof prev], [key]: value },
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const renderToggleItem = (key: string, title: string, subtitle?: string, disabled = false) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.gray }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={settings[key as keyof typeof settings] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor="white"
        disabled={disabled}
      />
    </View>
  );

  const renderTimeSelector = (label: string, time: string, onTimeChange: (time: string) => void) => (
    <TouchableOpacity
      style={[styles.timeSelector, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={() => {
        // In a real app, you'd open a time picker
        Alert.alert('Time Picker', 'Time picker would open here');
      }}
    >
      <Text style={[styles.timeLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.timeValue}>
        <Text style={[styles.timeText, { color: colors.primary }]}>{time}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saveSettingsMutation.isPending}
        >
          {saveSettingsMutation.isPending ? (
            <Ionicons name="hourglass" size={20} color="white" />
          ) : (
            <Ionicons name="checkmark" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        {permissions && !permissions.granted && (
          <View style={[styles.permissionAlert, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <View style={styles.permissionContent}>
              <Text style={[styles.permissionTitle, { color: colors.error }]}>
                Notifications Disabled
              </Text>
              <Text style={[styles.permissionText, { color: colors.text }]}>
                Enable notifications in your device settings to receive reminders and updates.
              </Text>
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: colors.error }]}
                onPress={() => Notifications.openSettingsAsync()}
              >
                <Text style={styles.permissionButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Push Notifications</Text>
          {renderToggleItem('pushEnabled', 'Enable Push Notifications', 'Receive notifications on your device')}
        </View>

        {/* Meal Reminders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Reminders</Text>
          {renderToggleItem(
            'mealReminders',
            'Meal Reminders',
            'Get reminded when it\'s time to eat',
            !settings.pushEnabled
          )}
          
          {settings.mealReminders && settings.pushEnabled && (
            <View style={styles.subSection}>
              {renderTimeSelector(
                'Breakfast',
                settings.mealReminderTimes.breakfast,
                (time) => handleNestedToggle('mealReminderTimes', 'breakfast', time)
              )}
              {renderTimeSelector(
                'Lunch',
                settings.mealReminderTimes.lunch,
                (time) => handleNestedToggle('mealReminderTimes', 'lunch', time)
              )}
              {renderTimeSelector(
                'Dinner',
                settings.mealReminderTimes.dinner,
                (time) => handleNestedToggle('mealReminderTimes', 'dinner', time)
              )}
            </View>
          )}
        </View>

        {/* Reports & Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reports & Insights</Text>
          {renderToggleItem(
            'weeklyReports',
            'Weekly Reports',
            'Get a summary of your nutrition progress',
            !settings.pushEnabled
          )}
          {renderToggleItem(
            'nutritionTips',
            'Nutrition Tips',
            'Receive helpful tips and advice',
            !settings.pushEnabled
          )}
        </View>

        {/* Health & Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health & Goals</Text>
          {renderToggleItem(
            'achievementNotifications',
            'Achievement Notifications',
            'Get notified when you reach milestones',
            !settings.pushEnabled
          )}
          {renderToggleItem(
            'goalReminders',
            'Goal Reminders',
            'Reminders to help you stay on track',
            !settings.pushEnabled
          )}
          {renderToggleItem(
            'waterReminders',
            'Water Reminders',
            'Stay hydrated with regular reminders',
            !settings.pushEnabled
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  permissionAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  permissionContent: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  subSection: {
    marginTop: 16,
    paddingLeft: 16,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    fontFamily: 'Inter-Medium',
  },
});