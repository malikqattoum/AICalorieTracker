import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { APP_CONFIG } from '../config';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open link:', err);
    });
  };

  const handleEmailSupport = () => {
    const email = APP_CONFIG.supportEmail;
    const subject = `${APP_CONFIG.appName} Support Request`;
    const body = `
App Version: ${APP_CONFIG.version}
Device: iOS/Android
Issue Description: [Please describe your issue here]
`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(err => {
      console.error('Failed to open email client:', err);
    });
  };

  const renderInfoSection = (title: string, items: Array<{label: string, value: string, onPress?: () => void}>) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.infoItem, { borderBottomColor: colors.border }]}
          onPress={item.onPress}
          disabled={!item.onPress}
        >
          <Text style={[styles.infoLabel, { color: colors.text }]}>{item.label}</Text>
          <View style={styles.infoValueContainer}>
            <Text style={[styles.infoValue, { color: colors.gray }]}>{item.value}</Text>
            {item.onPress && (
              <Ionicons name="chevron-forward" size={16} color={colors.gray} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
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
          About
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.appInfoContainer}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.appIconText}>🍎</Text>
          </View>
          
          <Text style={[styles.appName, { color: colors.text }]}>
            {APP_CONFIG.appName}
          </Text>
          
          <Text style={[styles.appVersion, { color: colors.gray }]}>
            Version {APP_CONFIG.version}
          </Text>
          
          <Text style={[styles.appDescription, { color: colors.gray }]}>
            Your AI-powered nutrition companion for tracking calories, planning meals, and achieving health goals with personalized insights and smart food recognition.
          </Text>
        </View>

        {/* App Information */}
        {renderInfoSection('App Information', [
          { label: 'Version', value: APP_CONFIG.version },
          { label: 'Build Number', value: '1.0.0 (100)' },
          { label: 'Environment', value: APP_CONFIG.environment },
          { label: 'Release Date', value: '2024' },
        ])}

        {/* Features */}
        {renderInfoSection('Key Features', [
          { label: 'AI Food Recognition', value: 'Powered by advanced AI' },
          { label: 'Nutrition Tracking', value: 'Complete macro & micro nutrients' },
          { label: 'Meal Planning', value: 'Personalized meal recommendations' },
          { label: 'Nutrition Coaching', value: 'Expert guidance & tips' },
          { label: 'Recipe Import', value: 'Import from any website' },
          { label: 'Progress Analytics', value: 'Detailed insights & reports' },
        ])}

        {/* Support & Contact */}
        {renderInfoSection('Support & Contact', [
          { 
            label: 'Email Support', 
            value: APP_CONFIG.supportEmail,
            onPress: handleEmailSupport
          },
          { 
            label: 'Website', 
            value: 'aicalorietracker.com',
            onPress: () => handleOpenLink('https://aicalorietracker.com')
          },
          { 
            label: 'Privacy Policy', 
            value: 'View our privacy policy',
            onPress: () => handleOpenLink('https://aicalorietracker.com/privacy')
          },
          { 
            label: 'Terms of Service', 
            value: 'View terms and conditions',
            onPress: () => handleOpenLink('https://aicalorietracker.com/terms')
          },
        ])}

        {/* Technology */}
        {renderInfoSection('Technology', [
          { label: 'Platform', value: 'React Native with Expo' },
          { label: 'AI Models', value: 'OpenAI GPT-4 Vision, Google Gemini' },
          { label: 'Database', value: 'MySQL with Sequelize ORM' },
          { label: 'Authentication', value: 'JWT with secure storage' },
          { label: 'Offline Support', value: 'Full offline functionality' },
        ])}

        {/* Acknowledgments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acknowledgments</Text>
          <Text style={[styles.acknowledgmentText, { color: colors.gray }]}>
            This app is made possible by the contributions of the open-source community and the following technologies:
          </Text>
          
          <View style={styles.techList}>
            <Text style={[styles.techItem, { color: colors.gray }]}>• React Native & Expo</Text>
            <Text style={[styles.techItem, { color: colors.gray }]}>• OpenAI API</Text>
            <Text style={[styles.techItem, { color: colors.gray }]}>• Google Generative AI</Text>
            <Text style={[styles.techItem, { color: colors.gray }]}>• React Query</Text>
            <Text style={[styles.techItem, { color: colors.gray }]}>• Inter Font Family</Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: colors.gray }]}>
            © 2024 AI Calorie Tracker. All rights reserved.
          </Text>
          <Text style={[styles.copyrightText, { color: colors.gray }]}>
            Made with ❤️ for healthier living
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    marginRight: 8,
  },
  acknowledgmentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  techList: {
    paddingLeft: 8,
  },
  techItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});