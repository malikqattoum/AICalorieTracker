import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

type MealDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MealDetails'>;
type MealDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Meal = {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  imageUrl: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string;
  isFavorite: boolean;
  ingredients?: string[];
  aiInsights?: string;
};

export default function MealDetailsScreen() {
  const route = useRoute<MealDetailsScreenRouteProp>();
  const navigation = useNavigation<MealDetailsScreenNavigationProp>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { mealId } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    foodName: '',
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    servingSize: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [] as string[],
  });

  // Fetch meal details
  const { data: meal, isLoading } = useQuery({
    queryKey: ['mealDetails', mealId],
    queryFn: async () => {
      const data = await safeFetchJson(`${API_URL}/api/meal-analyses/${mealId}`);
      if (data === null) {
        throw new Error('Failed to fetch meal details');
      }
      setIsFavorite(data.isFavorite);
      return data;
    },
  });

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async () => {
      const data = await safeFetchJson(`${API_URL}/api/meal-analyses/${mealId}`, {
        method: 'DELETE',
      });
      if (data === null) {
        throw new Error('Failed to delete meal');
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh meal history
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: i18n.t('mealDetails.deleteSuccess'),
      });
      
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const data = await safeFetchJson(`${API_URL}/api/meal-analyses/${mealId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (data === null) {
        throw new Error('Failed to update favorite status');
      }
      return data;
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: isFavorite 
          ? i18n.t('mealDetails.removeFromFavorites') 
          : i18n.t('mealDetails.addToFavorites'),
      });
      
      // Invalidate queries to refresh meal history
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error.message,
      });
    },
  });

  // Edit meal mutation
  const editMealMutation = useMutation({
    mutationFn: async (updatedMeal: any) => {
      const data = await safeFetchJson(`${API_URL}/api/meal-analyses/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMeal),
      });
      if (data === null) {
        throw new Error('Failed to update meal');
      }
      return data;
    },
    onSuccess: () => {
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['mealDetails', mealId] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: i18n.t('mealDetails.updateSuccess'),
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

  // Initialize edit form when meal data is loaded
  React.useEffect(() => {
    if (meal) {
      setEditForm({
        foodName: meal.foodName,
        mealType: meal.mealType,
        servingSize: meal.servingSize || '',
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        ingredients: meal.ingredients || [],
      });
    }
  }, [meal]);

  // Handle save meal
  const handleSaveMeal = () => {
    editMealMutation.mutate(editForm);
  };

  // Handle delete meal
  const handleDeleteMeal = () => {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('mealDetails.deleteConfirm'),
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMealMutation.mutate(),
        },
      ],
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !meal) {
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
      {/* Meal Image */}
      <View style={styles.imageContainer}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.lightGray }]}>
            <Ionicons name="image-outline" size={48} color={colors.gray} />
          </View>
        )}
      </View>

      {/* Meal Info */}
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={[styles.mealName, { color: colors.text }]}>
              {meal.foodName}
            </Text>
            <Text style={[styles.mealTime, { color: colors.gray }]}>
              {formatDate(meal.createdAt)} • {formatTime(meal.createdAt)}
            </Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => toggleFavoriteMutation.mutate()}
            >
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={20} 
                color={isFavorite ? colors.error : colors.text} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleDeleteMeal}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meal Type */}
        <View style={[styles.mealTypeContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons 
            name={
              meal.mealType === 'breakfast' ? 'sunny-outline' :
              meal.mealType === 'lunch' ? 'restaurant-outline' :
              meal.mealType === 'dinner' ? 'moon-outline' : 'cafe-outline'
            } 
            size={16} 
            color={colors.primary} 
          />
          <Text style={[styles.mealTypeText, { color: colors.primary }]}>
            {i18n.t(`mealHistory.${meal.mealType}`)}
          </Text>
        </View>

        {/* Calories */}
        <View style={[styles.caloriesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.caloriesValue, { color: colors.text }]}>
            {meal.calories}
          </Text>
          <Text style={[styles.caloriesLabel, { color: colors.gray }]}>
            {i18n.t('home.calories')}
          </Text>
        </View>

        {/* Nutrition Facts */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('mealDetails.nutritionFacts')}
          </Text>
          
          {meal.servingSize && (
            <View style={styles.servingContainer}>
              <Text style={[styles.servingText, { color: colors.gray }]}>
                {i18n.t('mealDetails.servingSize')}: {meal.servingSize}
              </Text>
            </View>
          )}
          
          <View style={[styles.nutritionTable, { borderColor: colors.border }]}>
            <View style={[styles.nutritionRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                {i18n.t('home.protein')}
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {meal.protein}g
              </Text>
            </View>
            
            <View style={[styles.nutritionRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                {i18n.t('home.carbs')}
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {meal.carbs}g
              </Text>
            </View>
            
            <View style={[styles.nutritionRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                {i18n.t('home.fat')}
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {meal.fat}g
              </Text>
            </View>
            
            <View style={[styles.nutritionRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                {i18n.t('home.fiber')}
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {meal.fiber}g
              </Text>
            </View>
            
            {meal.sugar !== undefined && (
              <View style={[styles.nutritionRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                  Sugar
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {meal.sugar}g
                </Text>
              </View>
            )}
            
            {meal.sodium !== undefined && (
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, { color: colors.text }]}>
                  Sodium
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.text }]}>
                  {meal.sodium}mg
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('mealDetails.ingredients')}
            </Text>
            
            <View style={[styles.ingredientsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {meal.ingredients.map((ingredient: string, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.ingredientItem, 
                    index < meal.ingredients!.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                  ]}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.ingredientText, { color: colors.text }]}>
                    {ingredient}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Insights */}
        {meal.aiInsights && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              AI Insights
            </Text>
            
            <View style={[styles.insightsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} style={styles.insightIcon} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                {meal.aiInsights}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.buttonText}>{i18n.t('mealDetails.editMeal')}</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <KeyboardAvoidingView
            style={[styles.editModalContainer, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Modal Header */}
            <View style={[styles.editModalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>
                {i18n.t('mealDetails.editMeal')}
              </Text>
              <View style={styles.editModalHeaderSpacer} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editModalContent}>
              {/* Food Name */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.foodName')}
                </Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={editForm.foodName}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, foodName: text }))}
                  placeholder={i18n.t('mealDetails.enterFoodName')}
                  placeholderTextColor={colors.gray}
                />
              </View>

              {/* Meal Type */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.mealType')}
                </Text>
                <View style={styles.mealTypeSelector}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        {
                          backgroundColor: editForm.mealType === type ? colors.primary : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, mealType: type }))}
                    >
                      <Text
                        style={[
                          styles.mealTypeButtonText,
                          { color: editForm.mealType === type ? 'white' : colors.text },
                        ]}
                      >
                        {i18n.t(`mealHistory.${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Serving Size */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.servingSize')}
                </Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={editForm.servingSize}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, servingSize: text }))}
                  placeholder={i18n.t('mealDetails.enterServingSize')}
                  placeholderTextColor={colors.gray}
                />
              </View>

              {/* Calories */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.calories')}
                </Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={editForm.calories.toString()}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, calories: parseInt(text) || 0 }))}
                  placeholder={i18n.t('mealDetails.enterCalories')}
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                />
              </View>

              {/* Macros */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.macros')}
                </Text>
                <View style={styles.macrosContainer}>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroLabel, { color: colors.text }]}>
                      {i18n.t('home.protein')}
                    </Text>
                    <TextInput
                      style={[styles.macroValue, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={editForm.protein.toString()}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, protein: parseFloat(text) || 0 }))}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroLabel, { color: colors.text }]}>
                      {i18n.t('home.carbs')}
                    </Text>
                    <TextInput
                      style={[styles.macroValue, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={editForm.carbs.toString()}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, carbs: parseFloat(text) || 0 }))}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroLabel, { color: colors.text }]}>
                      {i18n.t('home.fat')}
                    </Text>
                    <TextInput
                      style={[styles.macroValue, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={editForm.fat.toString()}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, fat: parseFloat(text) || 0 }))}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              <View style={styles.editInputContainer}>
                <Text style={[styles.editInputLabel, { color: colors.text }]}>
                  {i18n.t('mealDetails.ingredients')}
                </Text>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={editForm.ingredients.join(', ')}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, ingredients: text.split(',').map(i => i.trim()).filter(Boolean) }))}
                  placeholder={i18n.t('mealDetails.enterIngredients')}
                  placeholderTextColor={colors.gray}
                  multiline
                />
                <Text style={[styles.editInputHint, { color: colors.gray }]}>
                  {i18n.t('mealDetails.ingredientsHint')}
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveMeal}
                disabled={editMealMutation.isPending}
              >
                {editMealMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="white" />
                    <Text style={styles.saveButtonText}>
                      {i18n.t('mealDetails.saveChanges')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
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
  imageContainer: {
    width: '100%',
    height: 250,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  mealTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
  caloriesContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  caloriesLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  servingContainer: {
    marginBottom: 12,
  },
  servingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  nutritionTable: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  nutritionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  ingredientsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ingredientText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  insightsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
  },
  insightIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  insightText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  buttonsContainer: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  editModalHeaderSpacer: {
    width: 40,
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  editInputContainer: {
    marginBottom: 20,
  },
  editInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editInputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  mealTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  macrosContainer: {
    gap: 12,
  },
  macroInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroLabel: {
    fontSize: 14,
    width: 60,
  },
  macroValue: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
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