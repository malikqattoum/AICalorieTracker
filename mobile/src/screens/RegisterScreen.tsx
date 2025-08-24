import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const data = await safeFetchJson(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      
      if (data === null) {
        throw new Error(i18n.t('auth.registerError'));
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Call login function from AuthContext
      login(data.token, data.user);
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: 'Registration successful',
      });
      
      // Navigate to onboarding
      navigation.navigate('Auth');
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Validate first name
  const validateFirstName = () => {
    if (!firstName.trim()) {
      setFirstNameError(i18n.t('auth.nameRequired'));
      return false;
    }
    setFirstNameError('');
    return true;
  };

  // Validate last name
  const validateLastName = () => {
    if (!lastName.trim()) {
      setLastNameError(i18n.t('auth.nameRequired'));
      return false;
    }
    setLastNameError('');
    return true;
  };

  // Validate email
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(i18n.t('auth.invalidEmail'));
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError(i18n.t('auth.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = () => {
    if (!password) {
      setPasswordError(i18n.t('auth.passwordRequirements'));
      return false;
    } else if (password.length < 8) {
      setPasswordError(i18n.t('auth.passwordRequirements'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError(i18n.t('auth.passwordMismatch'));
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Handle register
  const handleRegister = () => {
    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    if (isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      registerMutation.mutate();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {i18n.t('auth.register')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* First Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={20} color={colors.gray} />
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: firstNameError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('auth.firstName')}
              placeholderTextColor={colors.gray}
              value={firstName}
              onChangeText={setFirstName}
              onBlur={validateFirstName}
              autoCapitalize="words"
            />
          </View>
          
          {firstNameError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {firstNameError}
            </Text>
          ) : null}
          
          {/* Last Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={20} color={colors.gray} />
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: lastNameError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('auth.lastName')}
              placeholderTextColor={colors.gray}
              value={lastName}
              onChangeText={setLastName}
              onBlur={validateLastName}
              autoCapitalize="words"
            />
          </View>
          
          {lastNameError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {lastNameError}
            </Text>
          ) : null}
          
          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.gray} />
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: emailError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('auth.email')}
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={setEmail}
              onBlur={validateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          
          {emailError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {emailError}
            </Text>
          ) : null}
          
          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: passwordError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('auth.password')}
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={setPassword}
              onBlur={validatePassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
            />
            
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.gray}
              />
            </TouchableOpacity>
          </View>
          
          {passwordError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {passwordError}
            </Text>
          ) : null}
          
          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} />
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: confirmPasswordError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('auth.confirmPassword')}
              placeholderTextColor={colors.gray}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={validateConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>
          
          {confirmPasswordError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {confirmPasswordError}
            </Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.registerButtonText}>
                {i18n.t('auth.registerButton')}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.gray }]}>
              {i18n.t('auth.haveAccount')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                {i18n.t('auth.loginInstead')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 48,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    marginRight: 4,
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});