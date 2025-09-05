import db from '../db';
import { CoachAnswer } from '../models/coachAnswer';
import OpenAI from 'openai';
import { log } from '../../vite';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default {
  async askQuestion(userId: number, question: string, imageData?: string): Promise<CoachAnswer> {
    try {
      // Create AI prompt for nutrition coaching
      const systemPrompt = `You are an expert nutrition coach with deep knowledge of:
- Macronutrients and micronutrients
- Meal planning and food combinations
- Weight management and fitness nutrition
- Dietary restrictions and special diets
- Health conditions and nutrition
- Sports nutrition and performance
- Metabolism and digestive health
- Food quality and sourcing

Provide evidence-based, personalized nutrition advice. Be encouraging, practical, and specific.
Include scientific reasoning when appropriate, but keep advice accessible and actionable.

User context: User ID ${userId}
Question: ${question}`;

      // Prepare user message content
      let userContent: any;
      if (imageData) {
        userContent = [
          { type: "text", text: question },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`
            }
          }
        ];
      } else {
        userContent = question;
      }

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
      });

      const aiAnswer = response.choices[0]?.message?.content || "I apologize, but I'm having trouble providing a response right now. Please try rephrasing your question.";

      // Create structured answer
      const answer: CoachAnswer = {
        id: Date.now(),
        user_id: userId,
        question,
        answer: aiAnswer,
        rating: null,
        comment: null,
        created_at: new Date()
      };
      
      // Store in database
      log(`Attempting to insert into coach_answers table for user ${userId}`);
      await db.execute(
        'INSERT INTO coach_answers (user_id, question, answer) VALUES (?, ?, ?)',
        [userId, question, aiAnswer]
      );
      log(`Successfully inserted coach answer for user ${userId}`);
      
      log(`AI nutrition coach response generated for user ${userId}`);
      return answer;
    } catch (error) {
      log('AI nutrition coach error:', error instanceof Error ? error.message : String(error));
      
      // Fallback to structured response if AI fails
      const fallbackAnswer = this.generateFallbackAnswer(question);
      
      const answer: CoachAnswer = {
        id: Date.now(),
        user_id: userId,
        question,
        answer: fallbackAnswer,
        rating: null,
        comment: null,
        created_at: new Date()
      };
      
      log(`Attempting fallback insert into coach_answers table for user ${userId}`);
      await db.execute(
        'INSERT INTO coach_answers (user_id, question, answer) VALUES (?, ?, ?)',
        [userId, question, fallbackAnswer]
      );
      log(`Successfully inserted fallback coach answer for user ${userId}`);
      
      return answer;
    }
  },

  generateFallbackAnswer(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Keyword-based fallback responses
    if (questionLower.includes('protein')) {
      return "Protein is essential for muscle maintenance and overall health. Aim for 0.8-1.2g of protein per kg of body weight daily. Good sources include lean meats, fish, eggs, legumes, and dairy. Consider spreading your protein intake throughout the day for better absorption.";
    }
    
    if (questionLower.includes('carb') || questionLower.includes('carbohydrate')) {
      return "Carbohydrates are your body's primary energy source. Focus on complex carbohydrates like whole grains, vegetables, and fruits rather than simple sugars. The amount you need depends on your activity level - more active individuals may need 45-65% of calories from carbs, while less active individuals may do better with 20-35%.";
    }
    
    if (questionLower.includes('fat')) {
      return "Healthy fats are crucial for hormone production, nutrient absorption, and brain health. Include sources like avocados, nuts, seeds, olive oil, and fatty fish. Aim for 20-35% of your daily calories from fat, with an emphasis on unsaturated fats over saturated fats.";
    }
    
    if (questionLower.includes('weight') && (questionLower.includes('loss') || questionLower.includes('lose'))) {
      return "Sustainable weight loss typically involves a moderate calorie deficit of 300-500 calories per day, combined with regular physical activity. Focus on whole, nutrient-dense foods, adequate protein intake, and proper hydration. Aim for 1-2 pounds of weight loss per week for long-term success.";
    }
    
    if (questionLower.includes('weight') && (questionLower.includes('gain') || questionLower.includes('muscle'))) {
      return "To gain weight healthily, focus on a calorie surplus of 300-500 calories per day, with emphasis on protein and strength training. Include nutrient-dense foods like nuts, seeds, avocados, whole grains, and lean proteins. Aim for 0.5-1 pound of weight gain per week.";
    }
    
    if (questionLower.includes('breakfast')) {
      return "A balanced breakfast should include protein, healthy fats, and complex carbohydrates. Good options include Greek yogurt with berries and nuts, oatmeal with nut butter and fruit, or eggs with whole grain toast and avocado. This combination helps maintain stable blood sugar and keeps you full longer.";
    }
    
    if (questionLower.includes('snack')) {
      return "Healthy snacks should combine protein and fiber to keep you satisfied. Good options include apple slices with peanut butter, Greek yogurt with a few almonds, carrot sticks with hummus, or a small handful of nuts with a piece of fruit. Avoid sugary snacks that cause energy crashes.";
    }
    
    if (questionLower.includes('hydrate') || questionLower.includes('water')) {
      return "Proper hydration is crucial for metabolism, energy levels, and overall health. Aim for 8-10 glasses (2-3 liters) of water daily, more if you're active. Signs of dehydration include dark urine, fatigue, and headaches. Drink water before meals to help with portion control and consider adding lemon or cucumber for flavor.";
    }
    
    if (questionLower.includes('supplement')) {
      return "Most people can get adequate nutrients from a balanced diet. However, certain supplements may be beneficial based on individual needs: Vitamin D (especially in winter months), Omega-3 fatty acids for heart and brain health, and probiotics for gut health. Always consult with a healthcare provider before starting supplements.";
    }
    
    if (questionLower.includes('meal') && questionLower.includes('plan')) {
      return "Effective meal planning involves: 1) Setting realistic goals, 2) Preparing in advance, 3) Balancing macronutrients, 4) Including variety, 5) Prepping ingredients ahead of time, and 6) Having backup options. Start with planning 3-4 days at a time and gradually increase as you get comfortable.";
    }
    
    // General fallback
    return "That's a great nutrition question! For personalized advice, consider factors like your age, activity level, health goals, and any dietary restrictions. A balanced diet typically includes plenty of vegetables, fruits, lean proteins, whole grains, and healthy fats. Would you like to share more details about your specific situation so I can provide more targeted advice?";
  },

  async getHistory(userId: number): Promise<CoachAnswer[]> {
    log(`Attempting to query coach_answers table for user ${userId} history`);
    const [answers] = await db.execute(
      'SELECT * FROM coach_answers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    log(`Successfully retrieved ${answers.length} coach answers for user ${userId}`);
    return (answers as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      question: row.question,
      answer: row.answer,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at ? new Date(row.created_at) : undefined
    }));
  },

  async submitFeedback(userId: number, answerId: number, rating: number, comment?: string) {
    log(`Attempting to update coach_answers table for answer ${answerId}, user ${userId}`);
    await db.execute(
      'UPDATE coach_answers SET rating = ?, comment = ? WHERE id = ? AND user_id = ?',
      [rating, comment, answerId, userId]
    );
    log(`Successfully updated feedback for coach answer ${answerId}`);
  },

  async getRecommendations(userId: number) {
    try {
      // Get user's recent activity and goals for personalized recommendations
      const [userStats] = await db.execute(
        'SELECT COUNT(*) as meal_count, AVG(calories) as avg_calories FROM meals WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [userId]
      );

      const [goals] = await db.execute(
        'SELECT daily_calories, daily_protein, daily_carbs, daily_fat FROM nutrition_goals WHERE user_id = ?',
        [userId]
      );

      const systemPrompt = `Generate 3-5 personalized nutrition recommendations for a user with the following context:

Recent Activity:
- Meals logged in last 7 days: ${userStats[0]?.meal_count || 0}
- Average calories per meal: ${Math.round(userStats[0]?.avg_calories || 0)}

Nutrition Goals:
- Daily calories: ${goals[0]?.daily_calories || 'not set'}
- Daily protein: ${goals[0]?.daily_protein || 'not set'}g
- Daily carbs: ${goals[0]?.daily_carbs || 'not set'}g
- Daily fat: ${goals[0]?.daily_fat || 'not set'}g

Provide specific, actionable recommendations that address potential gaps or improvements. Focus on practical changes that can be implemented immediately.

Format your response as a JSON array of objects with: id, text, category, priority (high/medium/low)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.6,
      });

      const recommendationsText = response.choices[0]?.message?.content || '[]';
      let recommendations;
      
      try {
        recommendations = JSON.parse(recommendationsText);
      } catch {
        // Fallback to structured recommendations if JSON parsing fails
        recommendations = this.generateFallbackRecommendations(userStats[0], goals[0]);
      }

      return recommendations;
    } catch (error) {
      log('AI recommendations error:', error instanceof Error ? error.message : String(error));
      return this.generateFallbackRecommendations(null, null);
    }
  },

  generateFallbackRecommendations(userStats: any, goals: any) {
    const recommendations = [];
    
    // Generate recommendations based on available data
    if (!goals || !goals.daily_calories) {
      recommendations.push({
        id: 1,
        text: "Set your daily calorie goals to better track your nutrition",
        category: "goal_setting",
        priority: "high"
      });
    }
    
    if (!goals || !goals.daily_protein) {
      recommendations.push({
        id: 2,
        text: "Ensure adequate protein intake (0.8-1.2g per kg of body weight)",
        category: "protein",
        priority: "medium"
      });
    }
    
    if (userStats && userStats.meal_count < 10) {
      recommendations.push({
        id: 3,
        text: "Try to log your meals consistently for better nutrition tracking",
        category: "meal_tracking",
        priority: "medium"
      });
    }
    
    recommendations.push({
      id: 4,
      text: "Include vegetables in every meal for better micronutrient intake",
      category: "vegetables",
      priority: "low"
    });
    
    return recommendations;
  },

  async getTips() {
    try {
      const systemPrompt = `Generate 5 practical, evidence-based nutrition tips that are:
1. Easy to implement in daily life
2. Backed by nutritional science
3. Applicable to most people
4. Specific and actionable
5. Cover different aspects of nutrition (hydration, meal timing, food quality, etc.)

Format your response as a JSON array of strings, where each string is a complete tip.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const tipsText = response.choices[0]?.message?.content || '[]';
      let tips;
      
      try {
        tips = JSON.parse(tipsText);
      } catch {
        // Fallback to structured tips if JSON parsing fails
        tips = [
          "Drink a glass of water before each meal to help with portion control",
          "Include a source of protein in every meal to stay satisfied longer",
          "Choose whole grains over refined carbohydrates for better energy levels",
          "Eat the rainbow - include colorful fruits and vegetables for diverse nutrients",
          "Practice mindful eating by eating slowly and without distractions"
        ];
      }

      return tips;
    } catch (error) {
      log('AI tips error:', error instanceof Error ? error.message : String(error));
      return [
        "Drink a glass of water before each meal to help with portion control",
        "Include a source of protein in every meal to stay satisfied longer",
        "Choose whole grains over refined carbohydrates for better energy levels",
        "Eat the rainbow - include colorful fruits and vegetables for diverse nutrients",
        "Practice mindful eating by eating slowly and without distractions"
      ];
    }
  }
};