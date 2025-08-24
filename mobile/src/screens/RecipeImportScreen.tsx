import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  imageUrl?: string;
}

interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function RecipeImportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('search');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const importMethods: ImportMethod[] = [
    {
      id: 'search',
      name: 'Search Recipes',
      description: 'Find recipes from our database',
      icon: 'search-outline',
      color: '#3B82F6',
    },
    {
      id: 'url',
      name: 'Import from URL',
      description: 'Import recipe from a website',
      icon: 'globe-outline',
      color: '#10B981',
    },
    {
      id: 'text',
      name: 'Paste Text',
      description: 'Copy and paste recipe text',
      icon: 'document-text-outline',
      color: '#F59E0B',
    },
    {
      id: 'photo',
      name: 'Photo Recognition',
      description: 'Take photo of recipe',
      icon: 'camera-outline',
      color: '#EF4444',
    },
  ];

  // Mock recipe data
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      description: 'A healthy and delicious bowl packed with Mediterranean flavors',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'easy',
      calories: 420,
      protein: 18,
      carbs: 55,
      fat: 15,
      ingredients: [
        '1 cup quinoa',
        '2 cups vegetable broth',
        '1 cucumber, diced',
        '2 tomatoes, diced',
        '1/2 red onion, thinly sliced',
        '1/2 cup kalamata olives',
        '1/2 cup feta cheese, crumbled',
        '1/4 cup olive oil',
        '2 tbsp lemon juice',
        'Fresh herbs (parsley, mint)',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Rinse quinoa under cold water',
        'Bring vegetable broth to a boil',
        'Add quinoa, reduce heat, and simmer for 15 minutes',
        'Let quinoa cool completely',
        'Dice cucumber, tomatoes, and red onion',
        'Combine quinoa with vegetables in a large bowl',
        'Add olives and feta cheese',
        'Whisk together olive oil, lemon juice, salt, and pepper',
        'Drizzle dressing over the bowl',
        'Garnish with fresh herbs and serve'
      ],
      tags: ['healthy', 'mediterranean', 'vegetarian', 'quinoa'],
    },
    {
      id: '2',
      name: 'Grilled Salmon with Lemon Herb Butter',
      description: 'Perfectly grilled salmon with a delicious lemon herb butter sauce',
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      difficulty: 'medium',
      calories: 380,
      protein: 35,
      carbs: 8,
      fat: 22,
      ingredients: [
        '4 salmon fillets',
        '4 tbsp butter',
        '2 cloves garlic, minced',
        '1 lemon, juiced and zested',
        '2 tbsp fresh dill, chopped',
        '2 tbsp fresh parsley, chopped',
        '1 tbsp olive oil',
        'Salt and pepper to taste',
        'Lemon wedges for serving'
      ],
      instructions: [
        'Preheat grill to medium-high heat',
        'Pat salmon fillets dry and season with salt and pepper',
        'In a small bowl, mix butter, garlic, lemon juice, zest, dill, and parsley',
        'Brush salmon with olive oil',
        'Grill salmon for 4-5 minutes per side',
        'Top with a dollop of lemon herb butter',
        'Grill for another 1-2 minutes',
        'Serve with lemon wedges'
      ],
      tags: ['seafood', 'grilled', 'salmon', 'healthy'],
    },
    {
      id: '3',
      name: 'Chocolate Avocado Mousse',
      description: 'A healthy and decadent chocolate mousse made with avocado',
      prepTime: 10,
      cookTime: 0,
      servings: 6,
      difficulty: 'easy',
      calories: 220,
      protein: 4,
      carbs: 20,
      fat: 16,
      ingredients: [
        '2 ripe avocados',
        '1/4 cup cocoa powder',
        '1/4 cup maple syrup',
        '2 tbsp milk (dairy or non-dairy)',
        '1 tsp vanilla extract',
        'Pinch of salt',
        'Fresh berries for garnish',
        'Mint leaves for garnish'
      ],
      instructions: [
        'Cut avocados in half and remove pits',
        'Scoop avocado flesh into a food processor',
        'Add cocoa powder, maple syrup, milk, vanilla, and salt',
        'Blend until completely smooth and creamy',
        'Taste and adjust sweetness if needed',
        'Spoon into serving glasses or bowls',
        'Refrigerate for at least 30 minutes',
        'Garnish with berries and mint leaves before serving'
      ],
      tags: ['dessert', 'chocolate', 'avocado', 'vegan'],
    },
    {
      id: '4',
      name: 'Thai Green Curry with Chicken',
      description: 'Authentic Thai green curry with tender chicken and vegetables',
      prepTime: 20,
      cookTime: 25,
      servings: 4,
      difficulty: 'medium',
      calories: 450,
      protein: 32,
      carbs: 25,
      fat: 25,
      ingredients: [
        '2 tbsp green curry paste',
        '1 lb chicken breast, sliced',
        '1 can (13.5 oz) coconut milk',
        '1 eggplant, cubed',
        '1 bell pepper, sliced',
        '1 onion, sliced',
        '2 tbsp fish sauce',
        '1 tbsp brown sugar',
        'Thai basil leaves',
        'Jasmine rice for serving',
        'Lime wedges for serving'
      ],
      instructions: [
        'Heat oil in a large pan or wok',
        'Add curry paste and fry for 1 minute',
        'Add chicken and cook until browned',
        'Pour in coconut milk and bring to a simmer',
        'Add eggplant and cook for 5 minutes',
        'Add bell pepper and onion',
        'Season with fish sauce and brown sugar',
        'Simmer until vegetables are tender',
        'Stir in Thai basil leaves',
        'Serve over jasmine rice with lime wedges'
      ],
      tags: ['thai', 'curry', 'spicy', 'chicken'],
    },
  ];

  useEffect(() => {
    // Simulate loading recipes
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRecipes(mockRecipes);
        setFilteredRecipes(mockRecipes);
      } catch (error) {
        Alert.alert('Error', 'Failed to load recipes');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, []);

  useEffect(() => {
    // Filter recipes based on search query
    if (searchQuery.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalVisible(true);
  };

  const handleRecipeClose = () => {
    setSelectedRecipe(null);
    setIsModalVisible(false);
  };

  const handleImportRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Import Recipe',
      `Are you sure you want to import "${recipe.name}" to your meal plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: () => {
            Alert.alert('Success', 'Recipe imported successfully!');
            handleRecipeClose();
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Easy';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Hard';
      default:
        return 'Unknown';
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.recipeDescription, { color: colors.gray }]}>
            {item.description}
          </Text>
        </View>
        <View style={styles.recipeStats}>
          <Text style={[styles.recipeCalories, { color: colors.text }]}>
            {item.calories} cal
          </Text>
          <Text style={[styles.recipeMacros, { color: colors.gray }]}>
            P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
          </Text>
        </View>
      </View>

      <View style={styles.recipeMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.gray} />
          <Text style={[styles.metaText, { color: colors.gray }]}>
            {item.prepTime + item.cookTime} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.gray} />
          <Text style={[styles.metaText, { color: colors.gray }]}>
            {item.servings} servings
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="fitness-outline" size={14} color={colors.gray} />
          <Text style={[styles.metaText, { color: getDifficultyColor(item.difficulty) }]}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.background }]}>
            <Text style={[styles.tagText, { color: colors.gray }]}>
              #{tag}
            </Text>
          </View>
        ))}
        {item.tags.length > 3 && (
          <View style={[styles.tag, { backgroundColor: colors.background }]}>
            <Text style={[styles.tagText, { color: colors.gray }]}>
              +{item.tags.length - 3}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null;

    return (
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleRecipeClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity onPress={handleRecipeClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Recipe Details
              </Text>
              <View style={styles.modalHeaderSpacer} />
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.recipeDetailsContainer}>
              <Text style={[styles.recipeDetailsName, { color: colors.text }]}>
                {selectedRecipe.name}
              </Text>

              <Text style={[styles.recipeDetailsDescription, { color: colors.gray }]}>
                {selectedRecipe.description}
              </Text>

              <View style={styles.recipeDetailsStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {selectedRecipe.calories}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Calories
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {selectedRecipe.protein}g
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Protein
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {selectedRecipe.carbs}g
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Carbs
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {selectedRecipe.fat}g
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>
                    Fat
                  </Text>
                </View>
              </View>

              <View style={styles.recipeDetailsMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.gray} />
                  <Text style={[styles.metaText, { color: colors.gray }]}>
                    Prep: {selectedRecipe.prepTime} min | Cook: {selectedRecipe.cookTime} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color={colors.gray} />
                  <Text style={[styles.metaText, { color: colors.gray }]}>
                    {selectedRecipe.servings} servings
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={16} color={colors.gray} />
                  <Text style={[styles.metaText, { color: getDifficultyColor(selectedRecipe.difficulty) }]}>
                    {getDifficultyText(selectedRecipe.difficulty)}
                  </Text>
                </View>
              </View>

              <View style={styles.recipeDetailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ingredients
                </Text>
                <FlatList
                  data={selectedRecipe.ingredients}
                  renderItem={({ item: ingredient }) => (
                    <Text style={[styles.ingredientItem, { color: colors.gray }]}>
                      • {ingredient}
                    </Text>
                  )}
                  keyExtractor={(item, index) => `ingredient-${index}`}
                  scrollEnabled={false}
                />
              </View>

              <View style={styles.recipeDetailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Instructions
                </Text>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <Text key={index} style={[styles.instructionItem, { color: colors.gray }]}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.importButton, { backgroundColor: colors.primary }]}
              onPress={() => handleImportRecipe(selectedRecipe)}
            >
              <Text style={styles.importButtonText}>
                Import Recipe
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => console.log('Back pressed')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Import Recipe
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Import Methods */}
      <View style={styles.methodsContainer}>
        <FlatList
          data={importMethods}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.methodButton,
                { 
                  backgroundColor: selectedMethod === item.id ? colors.primary : colors.background,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedMethod(item.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[
                styles.methodText,
                { color: selectedMethod === item.id ? 'white' : colors.text }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.methodsList}
        />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.background }]}
          placeholder="Search recipes..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading recipes...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recipesContainer}>
            <Text style={[styles.recipesTitle, { color: colors.text }]}>
              Popular Recipes
            </Text>
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.recipesList}
            />
          </View>
        </ScrollView>
      )}

      {/* Recipe Details Modal */}
      {renderRecipeDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  methodsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  methodsList: {
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  methodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Inter-Regular',
  },
  recipesContainer: {
    padding: 16,
  },
  recipesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  recipesList: {
    gap: 12,
  },
  recipeItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  recipeDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  recipeStats: {
    alignItems: 'flex-end',
  },
  recipeCalories: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  recipeMacros: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    flex: 1,
  },
  recipeDetailsContainer: {
    padding: 16,
  },
  recipeDetailsName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  recipeDetailsDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  recipeDetailsStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  recipeDetailsMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  recipeDetailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  ingredientItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  instructionItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  importButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});