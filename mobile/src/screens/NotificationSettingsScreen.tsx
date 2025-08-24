import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationSettings {
  mealReminders: {
    enabled: boolean;
    time: string;
    days: string[];
  };
  weeklyReports: {
    enabled: boolean;
    day: string;
    time: string;
  };
  tips: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  pushNotifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  mealReminders: {
    enabled: true,
    time: '12:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  weeklyReports: {
    enabled: true,
    day: 'sunday',
    time: '20:00',
  },
  tips: {
    enabled: true,
    frequency: 'weekly',
  },
  pushNotifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notification settings
  const { data: notificationSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async (): Promise<NotificationSettings> => {
      const result = await safeFetchJson(`${API_URL}/api/user/notification-settings`);
      if (result === null) {
        throw new Error('Failed to fetch notification settings');
      }
      return result;
    },
  });

  // Handle setting change
  const handleSettingChange = (section: keyof NotificationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle meal reminders toggle
  const handleMealRemindersToggle = (enabled: boolean) => {
    handleSettingChange('mealReminders', 'enabled', enabled);
  };

  // Handle weekly reports toggle
  const handleWeeklyReportsToggle = (enabled: boolean) => {
    handleSettingChange('weeklyReports', 'enabled', enabled);
  };

  // Handle tips toggle
  const handleTipsToggle = (enabled: boolean) => {
    handleSettingChange('tips', 'enabled', enabled);
  };

  // Handle push notifications toggle
  const handlePushNotificationsToggle = (enabled: boolean) => {
    handleSettingChange('pushNotifications', 'enabled', enabled);
  };

  // Handle sound toggle
  const handleSoundToggle = (enabled: boolean) => {
    handleSettingChange('pushNotifications', 'sound', enabled);
  };

  // Handle vibration toggle
  const handleVibrationToggle = (enabled: boolean) => {
    handleSettingChange('pushNotifications', 'vibration', enabled);
  };

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const response = await fetch(`${API_URL}/api/user/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      Alert.alert(
        'Success',
        'Notification settings saved successfully!',
        [{ text: 'OK', style: 'default' }]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        'Failed to save notification settings. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    },
  });

  const handleSaveSettings = () => {
    setIsLoading(true);
    saveSettingsMutation.mutate(settings);
    setIsLoading(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoadingSettings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading notification settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('profile.notifications')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Meal Reminders */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('settings.mealReminders')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
              Get reminders to log your meals throughout the day
            </Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingItemInfo}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                    {i18n.t('settings.mealReminders')}
                  </Text>
                  <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                    {settings.mealReminders.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Switch
                  value={settings.mealReminders.enabled}
                  onValueChange={handleMealRemindersToggle}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={settings.mealReminders.enabled ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {settings.mealReminders.enabled && (
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingItemContent}>
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                      {i18n.t('settings.reminderTime')}
                    </Text>
                    <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                      Reminder time
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.timeButton}>
                    <Text style={[styles.timeButtonText, { color: colors.primary }]}>
                      {settings.mealReminders.time}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Weekly Reports */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('settings.weeklyReports')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
              Receive weekly summaries of your nutrition progress
            </Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingItemInfo}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                    {i18n.t('settings.weeklyReports')}
                  </Text>
                  <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                    {settings.weeklyReports.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Switch
                  value={settings.weeklyReports.enabled}
                  onValueChange={handleWeeklyReportsToggle}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={settings.weeklyReports.enabled ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {settings.weeklyReports.enabled && (
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingItemContent}>
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                      {i18n.t('settings.reportDay')}
                    </Text>
                    <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                      Day of week
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.dayButton}>
                    <Text style={[styles.dayButtonText, { color: colors.primary }]}>
                      {settings.weeklyReports.day.charAt(0).toUpperCase() + settings.weeklyReports.day.slice(1)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Nutrition Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('settings.tips')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
              Receive personalized nutrition tips and advice
            </Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingItemInfo}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                    {i18n.t('settings.tips')}
                  </Text>
                  <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                    {settings.tips.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Switch
                  value={settings.tips.enabled}
                  onValueChange={handleTipsToggle}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={settings.tips.enabled ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {settings.tips.enabled && (
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingItemContent}>
                  <View style={styles.settingItemInfo}>
                    <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                      {i18n.t('settings.frequency')}
                    </Text>
                    <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                      Frequency
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.frequencyButton}>
                    <Text style={[styles.frequencyButtonText, { color: colors.primary }]}>
                      {settings.tips.frequency.charAt(0).toUpperCase() + settings.tips.frequency.slice(1)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Push Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('settings.pushNotifications')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>
              Configure push notification preferences
            </Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingItemInfo}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                    {i18n.t('settings.pushNotifications')}
                  </Text>
                  <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                    {settings.pushNotifications.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <Switch
                  value={settings.pushNotifications.enabled}
                  onValueChange={handlePushNotificationsToggle}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={settings.pushNotifications.enabled ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {settings.pushNotifications.enabled && (
              <>
                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.settingItemContent}>
                    <View style={styles.settingItemInfo}>
                      <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                        {i18n.t('settings.sound')}
                      </Text>
                      <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                        Play sound with notifications
                      </Text>
                    </View>
                    <Switch
                      value={settings.pushNotifications.sound}
                      onValueChange={handleSoundToggle}
                      trackColor={{ false: '#767577', true: colors.primary }}
                      thumbColor={settings.pushNotifications.sound ? '#f4f3f4' : '#f4f3f4'}
                    />
                  </View>
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.settingItemContent}>
                    <View style={styles.settingItemInfo}>
                      <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                        {i18n.t('settings.vibration')}
                      </Text>
                      <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                        Vibrate for notifications
                      </Text>
                    </View>
                    <Switch
                      value={settings.pushNotifications.vibration}
                      onValueChange={handleVibrationToggle}
                      trackColor={{ false: '#767577', true: colors.primary }}
                      thumbColor={settings.pushNotifications.vibration ? '#f4f3f4' : '#f4f3f4'}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  {i18n.t('settings.saveChanges')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});