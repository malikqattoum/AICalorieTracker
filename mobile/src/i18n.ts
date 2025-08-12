import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// English translations
const en = {
  common: {
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
  },
  auth: {
    login: 'Login',
    register: 'Create Account',
    forgotPassword: 'Forgot Password?',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
    resetPasswordButton: 'Reset Password',
    noAccount: 'Don\'t have an account?',
    createAccount: 'Sign Up',
    haveAccount: 'Already have an account?',
    loginInstead: 'Sign In',
    nameRequired: 'Name is required',
    invalidEmail: 'Please enter a valid email',
    passwordRequirements: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
    loginError: 'Invalid email or password',
    registerError: 'Registration failed',
    resetPasswordSuccess: 'Password reset email sent',
    resetPasswordInstructions: 'Enter your email address and we\'ll send you instructions to reset your password.',
  },
  home: {
    welcome: 'Welcome',
    todayStats: 'Today\'s Stats',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    remaining: 'Remaining',
    consumed: 'Consumed',
    goal: 'Goal',
    recentMeals: 'Recent Meals',
    viewAll: 'View All',
    scanMeal: 'Scan Meal',
    nutritionCoach: 'Nutrition Coach',
    mealPlan: 'Meal Plan',
    mealHistory: 'Meal History',
    settings: 'Settings',
    noMeals: 'No meals recorded today',
    addMeal: 'Add a meal',
  },
  mealHistory: {
    title: 'Meal History',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    earlier: 'Earlier',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    noMeals: 'No meals recorded',
    searchPlaceholder: 'Search meals...',
    filterByDate: 'Filter by date',
    filterByMealType: 'Filter by meal type',
    clearFilters: 'Clear filters',
  },
  mealDetails: {
    title: 'Meal Details',
    nutritionFacts: 'Nutrition Facts',
    servingSize: 'Serving Size',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbohydrates',
    fat: 'Fat',
    fiber: 'Fiber',
    sugar: 'Sugar',
    sodium: 'Sodium',
    ingredients: 'Ingredients',
    editMeal: 'Edit Meal',
    deleteMeal: 'Delete Meal',
    deleteConfirmation: 'Are you sure you want to delete this meal?',
    mealDeleted: 'Meal deleted successfully',
  },
  camera: {
    takePicture: 'Take Picture',
    retake: 'Retake',
    analyzing: 'Analyzing your food...',
    scanInstructions: 'Position your food in the frame',
    permissionDenied: 'Camera permission denied',
    permissionRequired: 'Camera permission is required to scan meals',
    openSettings: 'Open Settings',
    uploadFromGallery: 'Upload from Gallery',
  },
  mealPlan: {
    title: 'Meal Plan',
    generatePlan: 'Generate Plan',
    regenerate: 'Regenerate',
    savePlan: 'Save Plan',
    planSaved: 'Meal plan saved successfully',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    dailyTotal: 'Daily Total',
    preferences: 'Preferences',
    dietType: 'Diet Type',
    calorieTarget: 'Calorie Target',
    excludeIngredients: 'Exclude Ingredients',
    generateError: 'Failed to generate meal plan',
    weightLoss: 'Weight Loss',
    maintenance: 'Maintenance',
    muscleGain: 'Muscle Gain',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    keto: 'Keto',
    paleo: 'Paleo',
    mediterranean: 'Mediterranean',
    noRestrictions: 'No Restrictions',
  },
  nutritionCoach: {
    title: 'Nutrition Coach',
    askQuestion: 'Ask a question...',
    suggestions: 'Suggestions',
    suggestedQuestions: [
      'How can I increase my protein intake?',
      'What are good snacks for weight loss?',
      'How many calories should I eat daily?',
      'What foods are high in fiber?',
    ],
    loadingResponse: 'Thinking...',
    errorMessage: 'Sorry, I couldn\'t process your request. Please try again.',
    welcomeMessage: 'Hi! I\'m your AI Nutrition Coach. Ask me anything about nutrition, diet, or healthy eating habits.',
  },
  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    weight: 'Weight',
    height: 'Height',
    age: 'Age',
    gender: 'Gender',
    activityLevel: 'Activity Level',
    updateProfile: 'Update Profile',
    profileUpdated: 'Profile updated successfully',
    changePassword: 'Change Password',
    passwordChanged: 'Password changed successfully',
    logOut: 'Log Out',
    logOutConfirmation: 'Are you sure you want to log out?',
    deleteAccount: 'Delete Account',
    deleteAccountConfirmation: 'Are you sure you want to delete your account? This action cannot be undone.',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    sedentary: 'Sedentary',
    lightlyActive: 'Lightly Active',
    moderatelyActive: 'Moderately Active',
    veryActive: 'Very Active',
    extremelyActive: 'Extremely Active',
  },
  settings: {
    title: 'Settings',
    appearance: {
      title: 'Appearance',
      theme: 'Dark Theme',
    },
    notifications: {
      title: 'Notifications',
      mealReminders: 'Meal Reminders',
      weeklyReports: 'Weekly Reports',
      tips: 'Nutrition Tips',
    },
    privacy: {
      title: 'Privacy',
      shareAnalytics: 'Share Analytics',
      storeImages: 'Store Food Images',
      dataExport: 'Export My Data',
      dataDelete: 'Delete My Data',
    },
    goals: {
      title: 'Nutrition Goals',
      calorieGoal: 'Calorie Goal',
      proteinGoal: 'Protein Goal (g)',
      carbsGoal: 'Carbs Goal (g)',
      fatGoal: 'Fat Goal (g)',
      presets: 'Presets',
    },
    language: {
      title: 'Language',
      english: 'English',
      spanish: 'Spanish',
      french: 'French',
    },
    about: {
      title: 'About',
      version: 'Version',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      licenses: 'Licenses',
    },
  },
  recipeImport: {
    title: 'Import Recipe',
    pasteUrl: 'Paste recipe URL',
    importButton: 'Import Recipe',
    importSuccess: 'Recipe imported successfully',
    importError: 'Failed to import recipe',
    invalidUrl: 'Please enter a valid URL',
    nutritionInfo: 'Nutrition Information',
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    servings: 'servings',
    saveToMeals: 'Save to My Meals',
  },
  mealCalendar: {
    title: 'Meal Calendar',
    weeklyView: 'Week',
    monthlyView: 'Month',
    totalCalories: 'Total Calories',
    dailyNutrition: 'Daily Nutrition',
    noMeals: 'No meals recorded on this day',
    addMeal: 'Add Meal',
  },
};

// Spanish translations
const es = {
  common: {
    success: 'Éxito',
    error: 'Error',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
  },
  auth: {
    login: 'Iniciar Sesión',
    register: 'Crear Cuenta',
    forgotPassword: '¿Olvidaste tu contraseña?',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    loginButton: 'Iniciar Sesión',
    registerButton: 'Registrarse',
    resetPasswordButton: 'Restablecer Contraseña',
    noAccount: '¿No tienes una cuenta?',
    createAccount: 'Regístrate',
    haveAccount: '¿Ya tienes una cuenta?',
    loginInstead: 'Iniciar Sesión',
    nameRequired: 'El nombre es obligatorio',
    invalidEmail: 'Por favor, introduce un correo electrónico válido',
    passwordRequirements: 'La contraseña debe tener al menos 8 caracteres',
    passwordMismatch: 'Las contraseñas no coinciden',
    loginError: 'Correo electrónico o contraseña inválidos',
    registerError: 'Error en el registro',
    resetPasswordSuccess: 'Correo de restablecimiento de contraseña enviado',
    resetPasswordInstructions: 'Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.',
  },
  // Add more Spanish translations as needed
};

// French translations
const fr = {
  common: {
    success: 'Succès',
    error: 'Erreur',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
  },
  auth: {
    login: 'Connexion',
    register: 'Créer un Compte',
    forgotPassword: 'Mot de passe oublié?',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom',
    loginButton: 'Se Connecter',
    registerButton: 'S\'inscrire',
    resetPasswordButton: 'Réinitialiser le mot de passe',
    noAccount: 'Vous n\'avez pas de compte?',
    createAccount: 'S\'inscrire',
    haveAccount: 'Vous avez déjà un compte?',
    loginInstead: 'Se Connecter',
    nameRequired: 'Le nom est requis',
    invalidEmail: 'Veuillez entrer un email valide',
    passwordRequirements: 'Le mot de passe doit comporter au moins 8 caractères',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    loginError: 'Email ou mot de passe invalide',
    registerError: 'Échec de l\'inscription',
    resetPasswordSuccess: 'Email de réinitialisation du mot de passe envoyé',
    resetPasswordInstructions: 'Entrez votre adresse email et nous vous enverrons des instructions pour réinitialiser votre mot de passe.',
  },
  // Add more French translations as needed
};

// Initialize i18n
export const setupI18n = async () => {
  // Get user's preferred language from storage or use device locale
  let userLanguage;
  try {
    userLanguage = await AsyncStorage.getItem('userLanguage');
  } catch (error) {
    console.log('Error getting language from storage:', error);
  }

  // If no stored preference, use device locale
  if (!userLanguage) {
    const deviceLocale = Localization.locale.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')
    userLanguage = ['en', 'es', 'fr'].includes(deviceLocale) ? deviceLocale : 'en';
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
      },
      lng: userLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

// Function to change language
export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem('userLanguage', language);
  } catch (error) {
    console.log('Error saving language to storage:', error);
  }
};

export default i18n;