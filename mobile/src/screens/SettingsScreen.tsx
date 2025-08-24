import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';
import { DEFAULT_SETTINGS } from '../config';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AppSettings {
  notifications: {
    mealReminders: boolean;
    weeklyReports: boolean;
    tips: boolean;
    pushEnabled: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    storeImages: boolean;
    allowCrashReporting: boolean;
  };
  goals: {
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    fiberGoal: number;
    sugarGoal: number;
    sodiumGoal: number;
  };
  units: {
    weight: string;
    height: string;
    temperature: string;
  };
  theme: {
    mode: string;
    primaryColor: string;
  };
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<AppSettings>(() => DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user settings
  const { data: userSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async (): Promise<AppSettings> => {
      const result = await safeFetchJson(`${API_URL}/api/user/settings`);
      if (result === null) {
        throw new Error('Failed to fetch user settings');
      }
      return result;
    },
  });

  // Handle settings change
  const handleSettingChange = (section: keyof AppSettings, field: string, value: any) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
      return newSettings;
    });
  };

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      Alert.alert(
        'Success',
        'Settings saved successfully!',
        [{ text: 'OK', style: 'default' }]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        'Failed to save settings. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    },
  });

  const handleSaveSettings = () => {
    setIsLoading(true);
    saveSettingsMutation.mutate(settings);
    setIsLoading(false);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings(() => DEFAULT_SETTINGS);
            setHasChanges(true);
          },
        },
      ]
    );
  };

  if (isLoadingSettings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {i18n.t('settings.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('settings.notifications')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.mealReminders')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('settings.mealRemindersDesc')}
                </Text>
              </View>
              <Switch
                value={settings.notifications.mealReminders}
                onValueChange={(value) => handleSettingChange('notifications', 'mealReminders', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={settings.notifications.mealReminders ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.weeklyReports')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('settings.weeklyReportsDesc')}
                </Text>
              </View>
              <Switch
                value={settings.notifications.weeklyReports}
                onValueChange={(value) => handleSettingChange('notifications', 'weeklyReports', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={settings.notifications.weeklyReports ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.tips')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  {i18n.t('settings.tipsDesc')}
                </Text>
              </View>
              <Switch
                value={settings.notifications.tips}
                onValueChange={(value) => handleSettingChange('notifications', 'tips', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={settings.notifications.tips ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('settings.nutritionGoals')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.calorieGoal')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Daily calorie target
                </Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={settings.goals.calorieGoal.toString()}
                onChangeText={(text) => handleSettingChange('goals', 'calorieGoal', parseInt(text) || 0)}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.proteinGoal')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Daily protein target (grams)
                </Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={settings.goals.proteinGoal.toString()}
                onChangeText={(text) => handleSettingChange('goals', 'proteinGoal', parseInt(text) || 0)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.carbsGoal')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Daily carbs target (grams)
                </Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={settings.goals.carbsGoal.toString()}
                onChangeText={(text) => handleSettingChange('goals', 'carbsGoal', parseInt(text) || 0)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.fatGoal')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Daily fat target (grams)
                </Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={settings.goals.fatGoal.toString()}
                onChangeText={(text) => handleSettingChange('goals', 'fatGoal', parseInt(text) || 0)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Units Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('settings.units')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.weightUnit')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Unit for weight measurement
                </Text>
              </View>
              <View style={styles.unitButtons}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.units.weight === 'kg' && [styles.unitButtonActive, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleSettingChange('units', 'weight', 'kg')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    settings.units.weight === 'kg' && { color: 'white' }
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.units.weight === 'lbs' && [styles.unitButtonActive, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleSettingChange('units', 'weight', 'lbs')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    settings.units.weight === 'lbs' && { color: 'white' }
                  ]}>
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('settings.privacy')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.shareAnalytics')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Help improve the app by sharing anonymous usage data
                </Text>
              </View>
              <Switch
                value={settings.privacy.shareAnalytics}
                onValueChange={(value) => handleSettingChange('privacy', 'shareAnalytics', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={settings.privacy.shareAnalytics ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  {i18n.t('settings.storeImages')}
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Store meal images locally for faster loading
                </Text>
              </View>
              <Switch
                value={settings.privacy.storeImages}
                onValueChange={(value) => handleSettingChange('privacy', 'storeImages', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={settings.privacy.storeImages ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Connected Devices Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Connected Devices
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('WearableIntegration')}
          >
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemInfo}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                  Wearable Integration
                </Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.gray }]}>
                  Connect and manage your wearable devices
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasChanges && (
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
          )}
          
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleResetSettings}
          >
            <Text style={[styles.resetButtonText, { color: colors.text }]}>
              {i18n.t('settings.resetToDefault')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.gray }]}>
            AI Calorie Tracker v1.0.0
          </Text>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginRight: 16,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingItemSubtitle: {
    fontSize: 14,
  },
  input: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  unitButtons: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  unitButtonActive: {
    borderWidth: 0,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 32,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
  },
});