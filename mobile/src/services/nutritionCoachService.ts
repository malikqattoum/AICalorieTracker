import { apiService } from './apiService';
import { USE_MOCK_DATA, log } from '../config';

// Types
export type NutritionQuestion = {
  id: string;
  question: string;
  timestamp: string;
  category: 'general' | 'meal-planning' | 'nutrition-facts' | 'health-goals' | 'recipes';
};

export type NutritionAnswer = {
  id: string;
  questionId: string;
  answer: string;
  confidence: number;
  sources: string[];
  relatedTopics: string[];
  timestamp: string;
  helpful?: boolean;
};

export type NutritionCoachHistory = {
  questions: NutritionQuestion[];
  answers: NutritionAnswer[];
  totalQuestions: number;
  totalHelpfulAnswers: number;
};

export type NutritionTip = {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance: number;
  imageUrl?: string;
  readTime: number; // minutes
};

export type PersonalizedRecommendations = {
  tips: NutritionTip[];
  goals: {
    current: string[];
    suggested: string[];
  };
  improvements: {
    area: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
};

// Real nutrition coach service implementation
class NutritionCoachService {
  private mockTips: NutritionTip[] = [
    {
      id: 'tip-1',
      title: 'Hydration is Key',
      content: 'Drinking adequate water helps with metabolism and can reduce false hunger signals. Aim for 8-10 glasses per day.',
      category: 'hydration',
      relevance: 95,
      readTime: 2,
    },
    {
      id: 'tip-2',
      title: 'Protein with Every Meal',
      content: 'Including protein in each meal helps maintain stable blood sugar levels and keeps you feeling full longer.',
      category: 'macronutrients',
      relevance: 88,
      readTime: 3,
    },
    {
      id: 'tip-3',
      title: 'Colorful Vegetables',
      content: 'Eating a variety of colorful vegetables ensures you get a wide range of vitamins, minerals, and antioxidants.',
      category: 'micronutrients',
      relevance: 92,
      readTime: 2,
    },
    {
      id: 'tip-4',
      title: 'Meal Timing Matters',
      content: 'Eating regular meals every 3-4 hours helps maintain energy levels and prevents overeating later in the day.',
      category: 'timing',
      relevance: 78,
      readTime: 4,
    },
  ];

  private generateMockAnswer(question: string): NutritionAnswer {
    const answers: Record<string, string> = {
      'protein': 'Protein is essential for muscle maintenance and growth. Aim for 0.8-1.2g per kg of body weight daily. Good sources include lean meats, fish, eggs, legumes, and dairy products.',
      'carbs': 'Carbohydrates are your body\'s primary energy source. Focus on complex carbs like whole grains, vegetables, and fruits rather than simple sugars.',
      'fat': 'Healthy fats are important for hormone production and nutrient absorption. Include sources like avocados, nuts, olive oil, and fatty fish.',
      'weight loss': 'Sustainable weight loss requires a moderate calorie deficit combined with regular exercise. Aim for 1-2 pounds per week through diet and activity.',
      'meal prep': 'Meal prep can help you stay on track with nutrition goals. Prepare proteins, grains, and vegetables in batches for easy assembly throughout the week.',
      'default': 'Great question! Nutrition is highly individual, and what works best can vary from person to person. Consider factors like your activity level, health goals, and personal preferences when making dietary choices.',
    };

    const questionLower = question.toLowerCase();
    let answer = answers.default;
    
    for (const [key, value] of Object.entries(answers)) {
      if (questionLower.includes(key) && key !== 'default') {
        answer = value;
        break;
      }
    }

    return {
      id: `answer-${Date.now()}`,
      questionId: `question-${Date.now()}`,
      answer,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-99%
      sources: [
        'American Dietetic Association',
        'Harvard Health Publishing',
        'Mayo Clinic Nutrition Guidelines',
      ],
      relatedTopics: [
        'Meal Planning',
        'Macronutrient Balance',
        'Healthy Eating Patterns',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async askQuestion(question: string, category?: string): Promise<NutritionAnswer> {
    try {
      const response = await apiService.post('/api/nutrition-coach/ask', {
        question,
        category,
        timestamp: new Date().toISOString(),
      }, {
        requiresAuth: true,
        showErrorToast: false,
      });

      const result = response.data;
      
      return {
        id: result.id || `answer-${Date.now()}`,
        questionId: result.questionId || `question-${Date.now()}`,
        answer: result.answer || 'I apologize, but I\'m having trouble understanding your question right now. Please try rephrasing it.',
        confidence: result.confidence || 0.85,
        sources: result.sources || ['AI Nutrition Coach'],
        relatedTopics: result.relatedTopics || [],
        timestamp: result.timestamp || new Date().toISOString(),
        helpful: undefined,
      };
    } catch (error) {
      console.error('Nutrition coach API error:', error);
      // Fallback to mock response if API fails
      return this.generateEnhancedMockAnswer(question);
    }
  }
private generateEnhancedMockAnswer(question: string): NutritionAnswer {
    const questionLower = question.toLowerCase();
    
    // Enhanced keyword-based responses
    if (questionLower.includes('protein')) {
      return {
        id: `answer-${Date.now()}`,
        questionId: `question-${Date.now()}`,
        answer: "Protein is essential for muscle maintenance, immune function, and overall health. Aim for 0.8-1.2g of protein per kg of body weight daily. Good sources include lean meats, fish, eggs, legumes, dairy, and plant-based proteins like tofu and tempeh. Consider spreading your protein intake throughout the day for better absorption and muscle protein synthesis.",
        confidence: 0.92,
        sources: [
          'American Dietetic Association Position Paper on Vegetarian Diets',
          'Harvard School of Public Health Nutrition Source',
          'Journal of the International Society of Sports Nutrition'
        ],
        relatedTopics: ['Meal Planning', 'Macronutrient Balance', 'Muscle Health'],
        timestamp: new Date().toISOString(),
        helpful: undefined,
      };
    }
    
    if (questionLower.includes('carb') || questionLower.includes('carbohydrate')) {
      return {
        id: `answer-${Date.now()}`,
        questionId: `question-${Date.now()}`,
        answer: "Carbohydrates are your body's primary energy source and fuel for brain function. Focus on complex carbohydrates like whole grains, vegetables, fruits, and legumes rather than simple sugars. The amount you need depends on your activity level - more active individuals may need 45-65% of calories from carbs, while less active individuals may do better with 20-35%. Quality matters more than quantity when it comes to carbs.",
        confidence: 0.89,
        sources: [
          'Mayo Clinic Carbohydrates and Diabetes',
          'Academy of Nutrition and Dietetics',
          'World Health Organization Guidelines'
        ],
        relatedTopics: ['Energy Levels', 'Blood Sugar Control', 'Meal Timing'],
        timestamp: new Date().toISOString(),
        helpful: undefined,
      };
    }
    
    if (questionLower.includes('fat')) {
      return {
        id: `answer-${Date.now()}`,
        questionId: `question-${Date.now()}`,
        answer: "Healthy fats are crucial for hormone production, nutrient absorption, brain health, and reducing inflammation. Include sources like avocados, nuts, seeds, olive oil, fatty fish (salmon, mackerel), and plant oils. Aim for 20-35% of your daily calories from fat, with an emphasis on unsaturated fats over saturated fats. Avoid trans fats completely and limit saturated fats to less than 10% of total calories.",
        confidence: 0.91,
        sources: [
          'American Heart Association Fats and Oils',
          'Harvard T.H. Chan School of Public Health',
          'Journal of Lipid Research'
        ],
        relatedTopics: ['Heart Health', 'Hormone Balance', 'Inflammation'],
        timestamp: new Date().toISOString(),
        helpful: undefined,
      };
    }
    
    if (questionLower.includes('weight') && (questionLower.includes('loss') || questionLower.includes('lose'))) {
      return {
        id: `answer-${Date.now()}`,
        questionId: `question-${Date.now()}`,
        answer: "Sustainable weight loss involves creating a moderate calorie deficit of 300-500 calories per day through a combination of nutrition and physical activity. Focus on whole, nutrient-dense foods, adequate protein intake (1.6-2.2g/kg), proper hydration, and consistent meal timing. Aim for 1-2 pounds of weight loss per week for long-term success. Remember that weight loss is not linear and plateaus are normal - focus on non-scale victories like improved energy, sleep, and mood.",
        confidence: 0.94,
        sources: [
          'Obesity Society Guidelines',
          'American College of Sports Medicine Position Stand',
          'Journal of Obesity Research'
        ],
        relatedTopics: ['Calorie Deficit', 'Metabolism', 'Behavior Change'],
        timestamp: new Date().toISOString(),
        helpful: undefined,
      };
    }
    
    if (questionLower.includes('breakfast')) {
      return {
        id: `answer-${Date.now()}`,
        questionId: `question-${Date.now()}`,
        answer: "A balanced breakfast should include protein, healthy fats, and complex carbohydrates to maintain stable blood sugar and energy levels throughout the morning. Good options include: Greek yogurt with berries and nuts, oatmeal with nut butter and fruit, eggs with whole grain toast and avocado, or a smoothie with protein powder, greens, and fruit. Aim for 300-500 calories depending on your daily needs and activity level. Skipping breakfast can lead to overeating later in the day and reduced cognitive performance.",
        confidence: 0.87,
        sources: [
          'Journal of Nutrition and Metabolism',
          'Harvard Health Publishing',
          'International Journal of Obesity'
        ],
        relatedTopics: ['Meal Timing', 'Blood Sugar Control', 'Energy Levels'],
        timestamp: new Date().toISOString(),
        helpful: undefined,
      };
    }
    
    // General enhanced response
    return {
      id: `answer-${Date.now()}`,
      questionId: `question-${Date.now()}`,
      answer: "That's an excellent nutrition question! Nutrition is highly individual, and what works best depends on factors like your age, activity level, health goals, and any dietary restrictions. A balanced diet typically includes plenty of vegetables, fruits, lean proteins, whole grains, and healthy fats. For more personalized advice, consider consulting with a registered dietitian who can provide tailored recommendations based on your specific needs and circumstances.",
      confidence: 0.85,
      sources: [
        'Academy of Nutrition and Dietetics',
        'World Health Organization',
        'Harvard T.H. Chan School of Public Health'
      ],
      relatedTopics: ['Personalized Nutrition', 'Dietary Planning', 'Health Goals'],
      timestamp: new Date().toISOString(),
      helpful: undefined,
    };
  },

  async getHistory(): Promise<NutritionCoachHistory> {
    try {
      const response = await apiService.get('/api/nutrition-coach/history', {
        requiresAuth: true,
        showErrorToast: false,
      });

      const result = response.data;
      
      return {
        questions: result.questions || [],
        answers: result.answers || [],
        totalQuestions: result.totalQuestions || 0,
        totalHelpfulAnswers: result.totalHelpfulAnswers || 0,
      };
    } catch (error) {
      console.error('Failed to fetch nutrition coach history:', error);
      // Return empty history if API fails
      return {
        questions: [],
        answers: [],
        totalQuestions: 0,
        totalHelpfulAnswers: 0,
      };
    }
  }

  async markAnswerHelpful(answerId: string, helpful: boolean): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock implementation - would update database in production
  }

  async getPersonalizedRecommendations(): Promise<PersonalizedRecommendations> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      tips: this.mockTips.slice(0, 3),
      goals: {
        current: ['Increase protein intake', 'Drink more water', 'Eat more vegetables'],
        suggested: ['Add strength training', 'Improve sleep quality', 'Reduce processed foods'],
      },
      improvements: [
        {
          area: 'Protein Intake',
          suggestion: 'You\'re averaging 15% below your protein goal. Try adding a protein source to your snacks.',
          priority: 'high',
        },
        {
          area: 'Vegetable Variety',
          suggestion: 'You tend to eat the same vegetables. Try adding different colors to get more nutrients.',
          priority: 'medium',
        },
        {
          area: 'Meal Timing',
          suggestion: 'Consider eating your largest meal earlier in the day for better energy distribution.',
          priority: 'low',
        },
      ],
    };
  }

  async getTipsForUser(category?: string): Promise<NutritionTip[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let tips = [...this.mockTips];
    
    if (category) {
      tips = tips.filter(tip => tip.category === category);
    }
    
    // Sort by relevance
    return tips.sort((a, b) => b.relevance - a.relevance);
  }
}

// Production service implementation
class ProductionNutritionCoachService {
  async askQuestion(question: string, category?: string): Promise<NutritionAnswer> {
    const response = await apiService.post<NutritionAnswer>('/api/nutrition-coach/ask', {
      question,
      category,
    });

    return response.data;
  }

  async getHistory(): Promise<NutritionCoachHistory> {
    const response = await apiService.get<NutritionCoachHistory>('/api/nutrition-coach/history', {
      cache: true,
      cacheKey: 'nutrition_coach_history',
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    });

    return response.data;
  }

  async markAnswerHelpful(answerId: string, helpful: boolean): Promise<void> {
    await apiService.post(`/api/nutrition-coach/answers/${answerId}/feedback`, {
      helpful,
    });

    // Clear history cache to reflect updated feedback
    await apiService.clearCachePattern('nutrition_coach_history');
  }

  async getPersonalizedRecommendations(): Promise<PersonalizedRecommendations> {
    const response = await apiService.get<PersonalizedRecommendations>('/api/nutrition-coach/recommendations', {
      cache: true,
      cacheKey: 'personalized_recommendations',
      cacheDuration: 30 * 60 * 1000, // 30 minutes
    });

    return response.data;
  }

  async getTipsForUser(category?: string): Promise<NutritionTip[]> {
    const response = await apiService.get<NutritionTip[]>('/api/nutrition-coach/tips', {
      params: { category },
      cache: true,
      cacheKey: `nutrition_tips_${category || 'all'}`,
      cacheDuration: 60 * 60 * 1000, // 1 hour
    });

    return response.data;
  }
}

// Service factory
const createNutritionCoachService = () => {
  if (USE_MOCK_DATA) {
    log('Using mock nutrition coach service');
    return new NutritionCoachService();
  } else {
    log('Using production nutrition coach service');
    return new ProductionNutritionCoachService();
  }
};

// Export service instance
export const nutritionCoachService = createNutritionCoachService();
export default nutritionCoachService;