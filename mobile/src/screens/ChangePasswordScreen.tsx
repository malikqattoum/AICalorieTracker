import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../config';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const { colors } = useTheme();
  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert(
        'Success',
        'Password changed successfully!',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        error.message || 'Failed to change password. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    },
  });

  const handleInputChange = (field: keyof ChangePasswordData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return false;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password.');
      return false;
    }

    if (formData.newPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      Alert.alert(
        'Validation Error',
        `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long.`
      );
      return false;
    }

    if (!VALIDATION_RULES.PASSWORD_REGEX.test(formData.newPassword)) {
      Alert.alert(
        'Validation Error',
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password.');
      return false;
    }

    return true;
  };

  const handleChangePassword = () => {
    if (!validateForm()) return;

    changePasswordMutation.mutate(formData);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid = formData.currentPassword.trim() && 
                     formData.newPassword.trim() && 
                     formData.confirmPassword.trim() &&
                     formData.newPassword === formData.confirmPassword &&
                     formData.newPassword.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('profile.changePassword')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {i18n.t('profile.changePasswordDesc')}
          </Text>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {i18n.t('profile.currentPassword')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                placeholder={i18n.t('profile.enterCurrentPassword')}
                placeholderTextColor={colors.gray}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {i18n.t('profile.newPassword')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                placeholder={i18n.t('profile.enterNewPassword')}
                placeholderTextColor={colors.gray}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.passwordHint, { color: colors.gray }]}>
              {i18n.t('profile.passwordRequirements')}
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {i18n.t('profile.confirmPassword')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder={i18n.t('profile.confirmNewPassword')}
                placeholderTextColor={colors.gray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <View style={styles.passwordStrengthContainer}>
              <Text style={[styles.passwordStrengthLabel, { color: colors.text }]}>
                {i18n.t('profile.passwordStrength')}
              </Text>
              <View style={styles.passwordStrengthBar}>
                <View
                  style={[
                    styles.passwordStrengthFill,
                    {
                      width: getPasswordStrength(formData.newPassword),
                      backgroundColor: getPasswordStrengthColor(formData.newPassword),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor(formData.newPassword) }]}>
                {getPasswordStrengthText(formData.newPassword)}
              </Text>
            </View>
          )}

          {/* Change Password Button */}
          <TouchableOpacity
            style={[
              styles.changePasswordButton,
              { backgroundColor: isFormValid ? colors.primary : colors.gray },
            ]}
            onPress={handleChangePassword}
            disabled={!isFormValid || changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="white" />
                <Text style={styles.changePasswordButtonText}>
                  {i18n.t('profile.changePassword')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={[styles.securityNoticeText, { color: colors.gray }]}>
              {i18n.t('profile.securityNotice')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Helper functions for password strength
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 12.5;
  if (/[A-Z]/.test(password)) strength += 12.5;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
  
  return Math.min(strength, 100);
}

function getPasswordStrengthColor(password: string): string {
  const strength = getPasswordStrength(password);
  if (strength < 25) return '#EF4444'; // Red
  if (strength < 50) return '#F59E0B'; // Orange
  if (strength < 75) return '#3B82F6'; // Blue
  return '#10B981'; // Green
}

function getPasswordStrengthText(password: string): string {
  const strength = getPasswordStrength(password);
  if (strength < 25) return 'Weak';
  if (strength < 50) return 'Fair';
  if (strength < 75) return 'Good';
  return 'Strong';
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
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  passwordStrengthContainer: {
    marginBottom: 24,
  },
  passwordStrengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
  },
  securityNoticeText: {
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
  },
});