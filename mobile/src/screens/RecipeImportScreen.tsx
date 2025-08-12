import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import recipeService, { Recipe } from '../services/recipeService';

export default function RecipeImportScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // Import recipe mutation
  const importRecipeMutation = useMutation({
    mutationFn: async () => {
      return await recipeService.importRecipe(url);
    },
    onSuccess: (data) => {
      setRecipe(data);
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: i18n.t('recipeImport.importSuccess'),
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

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async () => {
      if (!recipe) throw new Error('No recipe to save');
      return await recipeService.saveRecipe(recipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
      
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: 'Recipe saved to your meals',
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

  // Validate URL
  const validateUrl = () => {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!url) {
      setUrlError(i18n.t('recipeImport.invalidUrl'));
      return false;
    } else if (!urlRegex.test(url)) {
      setUrlError(i18n.t('recipeImport.invalidUrl'));
      return false;
    }
    setUrlError('');
    return true;
  };

  // Handle import recipe
  const handleImportRecipe = () => {
    const isUrlValid = validateUrl();
    
    if (isUrlValid) {
      importRecipeMutation.mutate();
    }
  };

  // Handle save recipe
  const handleSaveRecipe = () => {
    if (recipe) {
      saveRecipeMutation.mutate();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('recipeImport.title')}
        </Text>
      </View>

      {!recipe ? (
        <View style={styles.importContainer}>
          <Text style={[styles.description, { color: colors.gray }]}>
            Enter a recipe URL to import nutritional information and ingredients.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: urlError ? colors.error : colors.border,
                },
              ]}
              placeholder={i18n.t('recipeImport.pasteUrl')}
              placeholderTextColor={colors.gray}
              value={url}
              onChangeText={setUrl}
              onBlur={validateUrl}
              autoCapitalize="none"
              autoComplete="off"
            />
          </View>
          
          {urlError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {urlError}
            </Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: colors.primary }]}
            onPress={handleImportRecipe}
            disabled={importRecipeMutation.isPending}
          >
            {importRecipeMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="white" />
                <Text style={styles.importButtonText}>
                  {i18n.t('recipeImport.importButton')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={styles.examplesContainer}>
            <Text style={[styles.examplesTitle, { color: colors.text }]}>
              Example URLs:
            </Text>
            <Text style={[styles.exampleUrl, { color: colors.primary }]}>
              https://www.allrecipes.com/recipe/...
            </Text>
            <Text style={[styles.exampleUrl, { color: colors.primary }]}>
              https://www.epicurious.com/recipes/...
            </Text>
            <Text style={[styles.exampleUrl, { color: colors.primary }]}>
              https://www.foodnetwork.com/recipes/...
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.recipeContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.recipeTitle, { color: colors.text }]}>
            {recipe.title}
          </Text>
          
          <View style={styles.recipeMetaContainer}>
            <View style={styles.recipeMeta}>
              <Ionicons name="people-outline" size={16} color={colors.gray} />
              <Text style={[styles.recipeMetaText, { color: colors.gray }]}>
                {recipe.servings} {i18n.t('recipeImport.servings')}
              </Text>
            </View>
            
            <View style={styles.recipeMeta}>
              <Ionicons name="time-outline" size={16} color={colors.gray} />
              <Text style={[styles.recipeMetaText, { color: colors.gray }]}>
                {recipe.totalTime}
              </Text>
            </View>
          </View>
          
          <View style={[styles.nutritionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('recipeImport.nutritionInfo')}
            </Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                  {recipe.nutrition.calories}
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.gray }]}>
                  {i18n.t('home.calories')}
                </Text>
              </View>
              
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#4ADE80' }]}>
                  {recipe.nutrition.protein}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.gray }]}>
                  {i18n.t('home.protein')}
                </Text>
              </View>
              
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#60A5FA' }]}>
                  {recipe.nutrition.carbs}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.gray }]}>
                  {i18n.t('home.carbs')}
                </Text>
              </View>
              
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#F59E0B' }]}>
                  {recipe.nutrition.fat}g
                </Text>
                <Text style={[styles.nutritionLabel, { color: colors.gray }]}>
                  {i18n.t('home.fat')}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('recipeImport.ingredients')}
          </Text>
          
          <View style={[styles.ingredientsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recipe.ingredients.map((ingredient, index) => (
              <View 
                key={index} 
                style={[
                  styles.ingredientItem, 
                  index < recipe.ingredients.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.ingredientText, { color: colors.text }]}>
                  {ingredient}
                </Text>
              </View>
            ))}
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('recipeImport.instructions')}
          </Text>
          
          <View style={[styles.instructionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recipe.instructions.map((instruction, index) => (
              <View 
                key={index} 
                style={[
                  styles.instructionItem, 
                  index < recipe.instructions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                ]}
              >
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveRecipe}
            disabled={saveRecipeMutation.isPending}
          >
            {saveRecipeMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {i18n.t('recipeImport.saveToMeals')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  importContainer: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  importButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  examplesContainer: {
    marginTop: 16,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  exampleUrl: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  recipeContainer: {
    flex: 1,
    padding: 20,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  recipeMetaText: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  nutritionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  nutritionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  ingredientsContainer: {
    borderRadius: 12,
    marginBottom: 24,
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
  instructionsContainer: {
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  instructionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});