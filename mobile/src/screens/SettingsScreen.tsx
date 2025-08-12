import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, DEFAULT_SETTINGS, NUTRITION_PRESETS } from '../config';
import { changeLanguage } from '../i18n';
import DataManager from '../utils/dataManager';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark, setTheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for settings
  const [settings, setSettings] = useState({
    notifications: {
      mealReminders: DEFAULT_SETTINGS.notifications.mealReminders,
      weeklyReports: DEFAULT_SETTINGS.notifications.weeklyReports,
      tips: DEFAULT_SETTINGS.notifications.tips,
    },
    privacy: {
      shareAnalytics: DEFAULT_SETTINGS.privacy.shareAnalytics,
      storeImages: DEFAULT_SETTINGS.privacy.storeImages,
    },
    goals: {
      calorieGoal: DEFAULT_SETTINGS.goals.calorieGoal,
      proteinGoal: DEFAULT_SETTINGS.goals.proteinGoal,
      carbsGoal: DEFAULT_SETTINGS.goals.carbsGoal,
      fatGoal: DEFAULT_SETTINGS.goals.fatGoal,
    },
    language: 'english',
  });

  // Fetch user settings
  const { isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/user/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }
      const data = await response.json();
      setSettings(data);
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: 'Settings updated successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Handle toggle switch
  const handleToggle = (section: string, setting: string) => {
    const updatedSettings = { ...settings };
    // @ts-ignore
    updatedSettings[section][setting] = !updatedSettings[section][setting];
    setSettings(updatedSettings);
    updateSettingsMutation.mutate(updatedSettings);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    const updatedSettings = { ...settings, language };
    setSettings(updatedSettings);
    updateSettingsMutation.mutate(updatedSettings);
    
    // Change app language
    const locale = language === 'english' ? 'en' : language === 'spanish' ? 'es' : 'fr';
    changeLanguage(locale);
  };

  // Handle data export
  const handleDataExport = async () => {
    Alert.alert(
      'Export Data',
      'This will create a file containing all your meals, settings, and progress data. You can use this for backup or to transfer to another device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: async () => {
            const success = await DataManager.exportUserData();
            if (success) {
              console.log('Data exported successfully');
            }
          }
        },
      ]
    );
  };

  // Handle data deletion
  const handleDataDelete = async () => {
    const success = await DataManager.deleteUserData();
    if (success) {
      // Data deletion successful - app would restart or logout
      console.log('Data deleted successfully');
    }
  };

  // Handle legal document links
  const handleTermsOfService = () => {
    Toast.show({
      type: 'info',
      text1: 'Terms of Service',
      text2: 'Opening terms document...',
    });
    // In production, this would open a web view or external link
  };

  const handlePrivacyPolicy = () => {
    Toast.show({
      type: 'info',
      text1: 'Privacy Policy',
      text2: 'Opening privacy policy...',
    });
    // In production, this would open a web view or external link
  };

  const handleLicenses = () => {
    Toast.show({
      type: 'info',
      text1: 'Open Source Licenses',
      text2: 'Opening licenses information...',
    });
    // In production, this would show third-party licenses
  };

  // Handle goal change
  const handleGoalChange = (goal: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const updatedSettings = { 
      ...settings,
      goals: {
        ...settings.goals,
        [goal]: numValue,
      }
    };
    setSettings(updatedSettings);
  };

  // Save goals
  const saveGoals = () => {
    updateSettingsMutation.mutate(settings);
  };

  // Apply preset
  const applyPreset = (preset: 'weightLoss' | 'maintenance' | 'muscleGain') => {
    Alert.alert(
      'Apply Preset',
      'This will replace your current nutrition goals. Continue?',
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common.confirm'),
          onPress: () => {
            const updatedSettings = {
              ...settings,
              goals: NUTRITION_PRESETS[preset],
            };
            setSettings(updatedSettings);
            updateSettingsMutation.mutate(updatedSettings);
          },
        },
      ],
    );
  };

  // Render section header
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>
      {title}
    </Text>
  );

  // Render toggle item
  const renderToggleItem = (
    section: string,
    setting: string,
    label: string,
    value: boolean
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={() => handleToggle(section, setting)}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor="white"
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('settings.title')}
        </Text>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.appearance.title'))}
        
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {i18n.t('settings.appearance.theme')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={handleThemeToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="white"
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.notifications.title'))}
        
        {renderToggleItem(
          'notifications',
          'mealReminders',
          i18n.t('settings.notifications.mealReminders'),
          settings.notifications.mealReminders
        )}
        
        {renderToggleItem(
          'notifications',
          'weeklyReports',
          i18n.t('settings.notifications.weeklyReports'),
          settings.notifications.weeklyReports
        )}
        
        {renderToggleItem(
          'notifications',
          'tips',
          i18n.t('settings.notifications.tips'),
          settings.notifications.tips
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.privacy.title'))}
        
        {renderToggleItem(
          'privacy',
          'shareAnalytics',
          i18n.t('settings.privacy.shareAnalytics'),
          settings.privacy.shareAnalytics
        )}
        
        {renderToggleItem(
          'privacy',
          'storeImages',
          i18n.t('settings.privacy.storeImages'),
          settings.privacy.storeImages
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border }]}
          onPress={handleDataExport}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            {i18n.t('settings.privacy.dataExport')}
          </Text>
          <Ionicons name="download-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.error, marginBottom: 0 }]}
          onPress={handleDataDelete}
        >
          <Text style={[styles.actionButtonText, { color: colors.error }]}>
            {i18n.t('settings.privacy.dataDelete')}
          </Text>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Nutrition Goals Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.goals.title'))}
        
        <View style={styles.goalsContainer}>
          <View style={styles.goalInputRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              {i18n.t('settings.goals.calorieGoal')}
            </Text>
            <TextInput
              style={[
                styles.goalInput,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={settings.goals.calorieGoal.toString()}
              onChangeText={(value) => handleGoalChange('calorieGoal', value)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          
          <View style={styles.goalInputRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              {i18n.t('settings.goals.proteinGoal')}
            </Text>
            <TextInput
              style={[
                styles.goalInput,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={settings.goals.proteinGoal.toString()}
              onChangeText={(value) => handleGoalChange('proteinGoal', value)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.goalInputRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              {i18n.t('settings.goals.carbsGoal')}
            </Text>
            <TextInput
              style={[
                styles.goalInput,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={settings.goals.carbsGoal.toString()}
              onChangeText={(value) => handleGoalChange('carbsGoal', value)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.goalInputRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              {i18n.t('settings.goals.fatGoal')}
            </Text>
            <TextInput
              style={[
                styles.goalInput,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={settings.goals.fatGoal.toString()}
              onChangeText={(value) => handleGoalChange('fatGoal', value)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveGoals}
          >
            <Text style={styles.saveButtonText}>
              {i18n.t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.presetsTitle, { color: colors.text }]}>
          {i18n.t('settings.goals.presets')}
        </Text>
        
        <View style={styles.presetsContainer}>
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => applyPreset('weightLoss')}
          >
            <Text style={[styles.presetButtonText, { color: colors.text }]}>
              {i18n.t('mealPlan.weightLoss')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => applyPreset('maintenance')}
          >
            <Text style={[styles.presetButtonText, { color: colors.text }]}>
              {i18n.t('mealPlan.maintenance')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.presetButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => applyPreset('muscleGain')}
          >
            <Text style={[styles.presetButtonText, { color: colors.text }]}>
              {i18n.t('mealPlan.muscleGain')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.language.title'))}
        
        <TouchableOpacity
          style={[
            styles.languageOption, 
            { 
              borderBottomColor: colors.border,
              backgroundColor: settings.language === 'english' ? colors.primary + '20' : 'transparent',
            }
          ]}
          onPress={() => handleLanguageChange('english')}
        >
          <Text style={[styles.languageText, { color: colors.text }]}>
            {i18n.t('settings.language.english')}
          </Text>
          {settings.language === 'english' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption, 
            { 
              borderBottomColor: colors.border,
              backgroundColor: settings.language === 'spanish' ? colors.primary + '20' : 'transparent',
            }
          ]}
          onPress={() => handleLanguageChange('spanish')}
        >
          <Text style={[styles.languageText, { color: colors.text }]}>
            {i18n.t('settings.language.spanish')}
          </Text>
          {settings.language === 'spanish' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageOption, 
            { 
              borderBottomColor: colors.border,
              backgroundColor: settings.language === 'french' ? colors.primary + '20' : 'transparent',
            }
          ]}
          onPress={() => handleLanguageChange('french')}
        >
          <Text style={[styles.languageText, { color: colors.text }]}>
            {i18n.t('settings.language.french')}
          </Text>
          {settings.language === 'french' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        {renderSectionHeader(i18n.t('settings.about.title'))}
        
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {i18n.t('settings.about.version')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.gray }]}>
            1.0.0
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={handleTermsOfService}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {i18n.t('settings.about.termsOfService')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={handlePrivacyPolicy}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {i18n.t('settings.about.privacyPolicy')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
          onPress={handleLicenses}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {i18n.t('settings.about.licenses')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  section: {
    paddingHorizontal: 20,
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
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  settingValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  goalsContainer: {
    marginBottom: 24,
  },
  goalInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  goalInput: {
    width: 80,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});