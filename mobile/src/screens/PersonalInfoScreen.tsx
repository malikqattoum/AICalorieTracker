import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

export default function PersonalInfoScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    activityLevel: user?.activityLevel || 'moderate',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // In production, this would call the real API
      // For now, simulate success with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...user, ...data };
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your personal information has been saved',
      });
      
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update profile',
      });
    },
  });

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    const profileData = {
      ...formData,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
    };

    updateProfileMutation.mutate(profileData);
  };

  const renderInputField = (
    key: string,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
            height: multiline ? 100 : 50,
          },
        ]}
        value={formData[key as keyof typeof formData]}
        onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  const renderPickerField = (
    key: string,
    label: string,
    options: { label: string; value: string }[]
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              {
                backgroundColor: formData[key as keyof typeof formData] === option.value
                  ? colors.primary + '20'
                  : 'transparent',
              },
            ]}
            onPress={() => setFormData(prev => ({ ...prev, [key]: option.value }))}
          >
            <Text style={[styles.pickerOptionText, { color: colors.text }]}>
              {option.label}
            </Text>
            {formData[key as keyof typeof formData] === option.value && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const activityLevelOptions = [
    { label: 'Sedentary (little/no exercise)', value: 'sedentary' },
    { label: 'Light (light exercise 1-3 days/week)', value: 'light' },
    { label: 'Moderate (moderate exercise 3-5 days/week)', value: 'moderate' },
    { label: 'Active (hard exercise 6-7 days/week)', value: 'active' },
    { label: 'Very Active (very hard exercise, physical job)', value: 'very_active' },
  ];

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
          Personal Information
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <Ionicons name="hourglass" size={20} color="white" />
          ) : (
            <Ionicons name="checkmark" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {renderInputField('firstName', 'First Name', 'Enter your first name')}
        {renderInputField('lastName', 'Last Name', 'Enter your last name')}
        {renderInputField('email', 'Email', 'Enter your email address', 'email-address')}
        {renderInputField('phone', 'Phone Number', 'Enter your phone number', 'phone-pad')}
        {renderInputField('dateOfBirth', 'Date of Birth', 'YYYY-MM-DD')}
        {renderInputField('height', 'Height (cm)', 'Enter your height', 'numeric')}
        {renderInputField('weight', 'Weight (kg)', 'Enter your weight', 'numeric')}
        
        {renderPickerField('activityLevel', 'Activity Level', activityLevelOptions)}

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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
});