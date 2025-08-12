import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // In production, this would call the real API
      // For now, simulate success with mock validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (data.currentPassword !== 'mockpassword') {
        throw new Error('Current password is incorrect');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Password Changed',
        text2: 'Your password has been updated successfully',
      });
      
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Change Failed',
        text2: error.message || 'Failed to change password',
      });
    },
  });

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSave = () => {
    // Validation
    if (!formData.currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }

    if (!formData.newPassword) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Password Requirements', passwordErrors.join('\n\n'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return;
    }

    changePasswordMutation.mutate(formData);
  };

  const renderPasswordInput = (
    key: keyof typeof formData,
    label: string,
    placeholder: string,
    showKey: keyof typeof showPasswords
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.passwordContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          value={formData[key]}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          secureTextEntry={!showPasswords[showKey]}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPasswords(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
        >
          <Ionicons
            name={showPasswords[showKey] ? "eye-off-outline" : "eye-outline"}
            size={24}
            color={colors.gray}
          />
        </TouchableOpacity>
      </View>
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
          Change Password
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? (
            <Ionicons name="hourglass" size={20} color="white" />
          ) : (
            <Ionicons name="checkmark" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderPasswordInput(
          'currentPassword',
          'Current Password',
          'Enter your current password',
          'current'
        )}

        {renderPasswordInput(
          'newPassword',
          'New Password',
          'Enter your new password',
          'new'
        )}

        {renderPasswordInput(
          'confirmPassword',
          'Confirm New Password',
          'Confirm your new password',
          'confirm'
        )}

        {/* Password Requirements */}
        <View style={[styles.requirementsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.requirementsTitle, { color: colors.text }]}>
            Password Requirements:
          </Text>
          
          <View style={styles.requirementsList}>
            <Text style={[styles.requirement, { color: colors.gray }]}>
              • At least 8 characters long
            </Text>
            <Text style={[styles.requirement, { color: colors.gray }]}>
              • Contains uppercase and lowercase letters
            </Text>
            <Text style={[styles.requirement, { color: colors.gray }]}>
              • Contains at least one number
            </Text>
            <Text style={[styles.requirement, { color: colors.gray }]}>
              • Contains at least one special character (@$!%*?&)
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={[styles.noticeContainer, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            Your password is encrypted and secure. We recommend using a unique password that you don't use elsewhere.
          </Text>
        </View>
      </View>
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  toggleButton: {
    padding: 8,
  },
  requirementsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  requirementsList: {
    gap: 4,
  },
  requirement: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});