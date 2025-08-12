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

// Mock service implementation
class MockNutritionCoachService {
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
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1500));
    
    return this.generateMockAnswer(question);
  }

  async getHistory(): Promise<NutritionCoachHistory> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock history
    const mockQuestions: NutritionQuestion[] = [
      {
        id: 'q1',
        question: 'How much protein should I eat daily?',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        category: 'nutrition-facts',
      },
      {
        id: 'q2',
        question: 'What are good sources of healthy fats?',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        category: 'nutrition-facts',
      },
      {
        id: 'q3',
        question: 'How can I meal prep for weight loss?',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        category: 'meal-planning',
      },
    ];

    const mockAnswers: NutritionAnswer[] = mockQuestions.map(q => ({
      id: `a-${q.id}`,
      questionId: q.id,
      answer: this.generateMockAnswer(q.question).answer,
      confidence: Math.floor(Math.random() * 20) + 80,
      sources: ['Nutrition Database', 'Health Guidelines'],
      relatedTopics: ['Diet', 'Health'],
      timestamp: q.timestamp,
      helpful: Math.random() > 0.3, // 70% helpful
    }));

    return {
      questions: mockQuestions,
      answers: mockAnswers,
      totalQuestions: mockQuestions.length,
      totalHelpfulAnswers: mockAnswers.filter(a => a.helpful).length,
    };
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
    return new MockNutritionCoachService();
  } else {
    log('Using production nutrition coach service');
    return new ProductionNutritionCoachService();
  }
};

// Export service instance
export const nutritionCoachService = createNutritionCoachService();
export default nutritionCoachService;