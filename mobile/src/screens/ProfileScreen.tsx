import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import profileService, { ProfileStats } from '../services/profileService';
import { APP_CONFIG } from '../config';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, isDark, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Fetch profile stats
  const { data: stats } = useQuery({
    queryKey: ['profileStats'],
    queryFn: async () => {
      return await profileService.getProfileStats();
    },
  });

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      i18n.t('profile.logoutConfirm'),
      '',
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('profile.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Navigation handlers
  const handlePersonalInfo = () => {
    navigation.navigate('PersonalInfo' as never);
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as never);
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings' as never);
  };

  const handleLanguage = () => {
    Toast.show({
      type: 'info',
      text1: 'Language Settings',
      text2: 'Language selection is available in Settings',
    });
    navigation.navigate('Settings' as never);
  };

  const handleAchievements = () => {
    Toast.show({
      type: 'info',
      text1: 'Achievements',
      text2: 'Achievement system coming soon!',
    });
  };

  const handleUpgradeToPremium = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Premium features include:\n\n• Advanced meal planning\n• Detailed analytics\n• Recipe collections\n• Priority support\n\nUpgrade now?',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Premium Upgrade',
              text2: 'Premium subscription coming soon!',
            });
          }
        },
      ]
    );
  };

  const handleManagePlan = () => {
    Alert.alert(
      'Manage Subscription',
      'Manage your premium subscription through your device\'s app store settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open App Store', 
          onPress: () => {
            // This would open the app store subscription management
            Toast.show({
              type: 'info',
              text1: 'Subscription Management',
              text2: 'Subscription management coming soon!',
            });
          }
        },
      ]
    );
  };

  const handleFAQ = () => {
    const faqUrl = 'https://aicalorietracker.com/faq';
    Linking.openURL(faqUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Unable to Open',
        text2: 'Could not open FAQ page',
      });
    });
  };

  const handleContactSupport = () => {
    const email = APP_CONFIG.supportEmail;
    const subject = `${APP_CONFIG.appName} Support Request`;
    const body = `Hi Support Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nApp Version: ${APP_CONFIG.version}\nUser: ${user?.email || 'N/A'}`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Unable to Open Email',
        text2: `Please email us at ${email}`,
      });
    });
  };

  const handleTermsOfService = () => {
    const termsUrl = 'https://aicalorietracker.com/terms';
    Linking.openURL(termsUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Unable to Open',
        text2: 'Could not open Terms of Service',
      });
    });
  };

  const handlePrivacyPolicy = () => {
    const privacyUrl = 'https://aicalorietracker.com/privacy';
    Linking.openURL(privacyUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Unable to Open',
        text2: 'Could not open Privacy Policy',
      });
    });
  };

  const handleAbout = () => {
    navigation.navigate('About' as never);
  };

  // Render menu item
  const renderMenuItem = (
    icon: string, 
    title: string, 
    onPress: () => void, 
    showBadge?: boolean,
    rightElement?: React.ReactNode,
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.menuItemText, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.menuItemRight}>
        {showBadge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        
        {rightElement || (
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
            {user?.firstName ? (
              <Text style={styles.avatarText}>
                {user.firstName.charAt(0)}{user.lastName?.charAt(0)}
              </Text>
            ) : (
              <Ionicons name="person" size={40} color="white" />
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.gray }]}>
              {user?.email}
            </Text>
            
            <View style={[styles.subscriptionTag, { backgroundColor: user?.isPremium ? colors.primary : colors.gray }]}>
              <Text style={styles.subscriptionText}>
                {user?.isPremium ? i18n.t('profile.premium') : i18n.t('profile.free')}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('PersonalInfo' as never)}
        >
          <Text style={[styles.editProfileText, { color: colors.text }]}>
            {i18n.t('profile.editProfile')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.totalMeals}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.totalMeals')}
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.streakDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.streakDays')}
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.perfectDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>
              {i18n.t('home.perfectDays')}
            </Text>
          </View>
        </View>
      )}

      {/* Menu Sections */}
      <View style={styles.menuSection}>
        <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
          {i18n.t('profile.accountSettings')}
        </Text>
        
        {renderMenuItem(
          'person-outline',
          i18n.t('profile.personalInfo'),
          handlePersonalInfo
        )}
        
        {renderMenuItem(
          'lock-closed-outline',
          i18n.t('profile.changePassword'),
          handleChangePassword
        )}
        
        {renderMenuItem(
          'notifications-outline',
          i18n.t('profile.notifications'),
          handleNotifications
        )}
        
        {renderMenuItem(
          'moon-outline',
          i18n.t('profile.theme'),
          handleThemeToggle,
          false,
          <Switch
            value={isDark}
            onValueChange={handleThemeToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor="white"
          />
        )}
        
        {renderMenuItem(
          'globe-outline',
          i18n.t('profile.language'),
          handleLanguage
        )}
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
          {i18n.t('profile.preferences')}
        </Text>
        
        {renderMenuItem(
          'fitness-outline',
          i18n.t('profile.goals'),
          () => navigation.navigate('Settings')
        )}
        
        {renderMenuItem(
          'trophy-outline',
          i18n.t('profile.achievements'),
          handleAchievements
        )}
        
        {!user?.isPremium && renderMenuItem(
          'star-outline',
          i18n.t('profile.upgradeToPremium'),
          handleUpgradeToPremium,
          true
        )}
        
        {user?.isPremium && renderMenuItem(
          'card-outline',
          i18n.t('profile.managePlan'),
          handleManagePlan
        )}
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
          {i18n.t('profile.help')}
        </Text>
        
        {renderMenuItem(
          'help-circle-outline',
          i18n.t('profile.faq'),
          handleFAQ
        )}
        
        {renderMenuItem(
          'mail-outline',
          i18n.t('profile.contactSupport'),
          handleContactSupport
        )}
        
        {renderMenuItem(
          'document-text-outline',
          i18n.t('profile.termsOfService'),
          handleTermsOfService
        )}
        
        {renderMenuItem(
          'shield-outline',
          i18n.t('profile.privacyPolicy'),
          handlePrivacyPolicy
        )}
        
        {renderMenuItem(
          'information-circle-outline',
          i18n.t('profile.about'),
          handleAbout
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error + '10' }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>
          {i18n.t('profile.logout')}
        </Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={[styles.versionText, { color: colors.gray }]}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  subscriptionTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  editProfileButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 32,
    fontFamily: 'Inter-Regular',
  },
});