import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import { DOMAINS_CONFIG } from '../config';

type AboutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AboutScreen() {
  const navigation = useNavigation<AboutScreenNavigationProp>();
  const { colors } = useTheme();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${DOMAINS_CONFIG.supportEmail}`);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(DOMAINS_CONFIG.privacyUrl);
  };

  const handleTermsOfService = () => {
    Linking.openURL(DOMAINS_CONFIG.termsUrl);
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate App',
      'Thank you for using AI Calorie Tracker! Would you like to rate us on the App Store?',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => Linking.openURL('https://apps.apple.com/app/id123456789') },
      ]
    );
  };

  const handleShareApp = () => {
    Linking.openURL(DOMAINS_CONFIG.appUrl);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          About
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="restaurant" size={48} color="white" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>
            AI Calorie Tracker
          </Text>
          <Text style={[styles.appVersion, { color: colors.gray }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.appTagline, { color: colors.gray }]}>
            Smart nutrition tracking powered by AI
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About This App
          </Text>
          <Text style={[styles.sectionContent, { color: colors.text }]}>
            AI Calorie Tracker is a revolutionary mobile application that uses artificial intelligence to help you track your nutrition and achieve your health goals. Simply take photos of your meals, and our AI will analyze them to provide detailed nutritional information.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Key Features
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                AI-powered food recognition
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Detailed nutritional analysis
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Meal planning and tracking
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                AI nutrition coaching
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Progress tracking and insights
              </Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Links
          </Text>
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleContactSupport}
          >
            <View style={styles.linkItemContent}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkItemText, { color: colors.text }]}>
                Contact Support
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.linkItemContent}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkItemText, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleTermsOfService}
          >
            <View style={styles.linkItemContent}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkItemText, { color: colors.text }]}>
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Support Us
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleRateApp}
          >
            <Ionicons name="star-outline" size={20} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>
              Rate App
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShareApp}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Share App
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Credits
          </Text>
          <Text style={[styles.sectionContent, { color: colors.text }]}>
            Developed with ❤️ by the AI Calorie Tracker team
          </Text>
          <Text style={[styles.sectionContent, { color: colors.text }]}>
            Special thanks to our AI partners for providing advanced food recognition technology
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.gray }]}>
            © 2024 AI Calorie Tracker. All rights reserved.
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
  appInfoContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  linkItem: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  linkItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});