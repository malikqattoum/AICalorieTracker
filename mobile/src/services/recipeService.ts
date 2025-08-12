import api from './api';

// Types
export type Recipe = {
  title: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  sourceUrl: string;
};

// Mock data for development
const mockRecipes: Record<string, Recipe> = {
  'allrecipes.com': {
    title: 'Grilled Lemon Herb Chicken',
    servings: 4,
    prepTime: '15 min',
    cookTime: '25 min',
    totalTime: '40 min',
    ingredients: [
      '4 boneless, skinless chicken breasts',
      '3 tablespoons olive oil',
      '2 tablespoons lemon juice',
      '2 cloves garlic, minced',
      '1 teaspoon dried oregano',
      '1 teaspoon dried thyme',
      '1/2 teaspoon salt',
      '1/4 teaspoon black pepper',
      'Lemon slices for garnish',
    ],
    instructions: [
      'In a large bowl, whisk together olive oil, lemon juice, garlic, oregano, thyme, salt, and pepper.',
      'Add chicken breasts to the marinade and coat well. Cover and refrigerate for at least 30 minutes, or up to 4 hours.',
      'Preheat grill to medium-high heat.',
      'Remove chicken from marinade and grill for 6-7 minutes per side, or until internal temperature reaches 165°F (74°C).',
      'Let chicken rest for 5 minutes before serving.',
      'Garnish with lemon slices and serve with your favorite sides.',
    ],
    nutrition: {
      calories: 320,
      protein: 35,
      carbs: 3,
      fat: 18,
      fiber: 0,
      sugar: 1,
      sodium: 380,
    },
    sourceUrl: 'https://www.allrecipes.com/recipe/grilled-lemon-herb-chicken',
  },
  'epicurious.com': {
    title: 'Mediterranean Quinoa Salad',
    servings: 6,
    prepTime: '20 min',
    cookTime: '15 min',
    totalTime: '35 min',
    ingredients: [
      '1 cup quinoa, rinsed',
      '2 cups water',
      '1 cucumber, diced',
      '1 pint cherry tomatoes, halved',
      '1/2 red onion, finely diced',
      '1/2 cup kalamata olives, pitted and sliced',
      '1/2 cup feta cheese, crumbled',
      '1/4 cup fresh parsley, chopped',
      '1/4 cup fresh mint, chopped',
      '3 tablespoons olive oil',
      '2 tablespoons lemon juice',
      '1 clove garlic, minced',
      'Salt and pepper to taste',
    ],
    instructions: [
      'In a medium saucepan, combine quinoa and water. Bring to a boil, then reduce heat to low, cover, and simmer for 15 minutes, or until water is absorbed.',
      'Remove from heat and let stand, covered, for 5 minutes. Fluff with a fork and let cool to room temperature.',
      'In a large bowl, combine cooled quinoa, cucumber, tomatoes, red onion, olives, feta cheese, parsley, and mint.',
      'In a small bowl, whisk together olive oil, lemon juice, garlic, salt, and pepper.',
      'Pour dressing over salad and toss to combine.',
      'Serve immediately or refrigerate for up to 3 days.',
    ],
    nutrition: {
      calories: 280,
      protein: 8,
      carbs: 32,
      fat: 14,
      fiber: 5,
      sugar: 3,
      sodium: 320,
    },
    sourceUrl: 'https://www.epicurious.com/recipes/food/views/mediterranean-quinoa-salad',
  },
  'foodnetwork.com': {
    title: 'Baked Salmon with Asparagus',
    servings: 4,
    prepTime: '10 min',
    cookTime: '20 min',
    totalTime: '30 min',
    ingredients: [
      '4 salmon fillets (6 oz each)',
      '1 bunch asparagus, trimmed',
      '2 tablespoons olive oil',
      '2 tablespoons lemon juice',
      '2 cloves garlic, minced',
      '1 teaspoon dried dill',
      'Salt and pepper to taste',
      'Lemon slices for garnish',
    ],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Place salmon fillets and asparagus on a large baking sheet lined with parchment paper.',
      'In a small bowl, whisk together olive oil, lemon juice, garlic, dill, salt, and pepper.',
      'Drizzle the mixture over the salmon and asparagus.',
      'Bake for 15-20 minutes, or until salmon is cooked through and asparagus is tender.',
      'Garnish with lemon slices and serve immediately.',
    ],
    nutrition: {
      calories: 350,
      protein: 34,
      carbs: 6,
      fat: 22,
      fiber: 3,
      sugar: 2,
      sodium: 150,
    },
    sourceUrl: 'https://www.foodnetwork.com/recipes/baked-salmon-with-asparagus',
  },
};

// Recipe service
const recipeService = {
  // Import recipe from URL
  importRecipe: async (url: string): Promise<Recipe> => {
    try {
      // In production, this would call the API
      // return await api.recipes.importRecipe(url);
      
      // For development, return mock data based on domain
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Find a matching mock recipe or return the first one
      const mockRecipe = mockRecipes[domain] || Object.values(mockRecipes)[0];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        ...mockRecipe,
        sourceUrl: url,
      };
    } catch (error) {
      console.error('Error importing recipe:', error);
      throw new Error('Failed to import recipe. Please check the URL and try again.');
    }
  },
  
  // Save recipe to user's meals
  saveRecipe: async (recipe: Recipe): Promise<void> => {
    try {
      // In production, this would call the API
      // return await api.recipes.saveRecipe(recipe);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return;
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw new Error('Failed to save recipe. Please try again.');
    }
  },
};

export default recipeService;