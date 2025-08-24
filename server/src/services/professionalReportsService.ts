import { db } from '../db';
import { 
  healthReports, 
  healthScores, 
  healthPredictions,
  healthGoals,
  realTimeMonitoring,
  users
} from '../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc, sql, count, avg, sum } from 'drizzle-orm';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

export interface ReportInput {
  userId: number;
  reportType: 'weekly_summary' | 'monthly_progress' | 'quarterly_review' | 'annual_journey' | 'custom';
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  includeCharts?: boolean;
  includePredictions?: boolean;
  includeRecommendations?: boolean;
  professionalId?: string;
  professionalName?: string;
  reportFormat?: 'pdf' | 'html' | 'json';
}

export interface ReportSection {
  title: string;
  content: string;
  charts?: any[];
  data?: any;
  recommendations?: string[];
}

export interface ProfessionalReport {
  id: number;
  userId: number;
  professionalId: string;
  professionalName: string;
  reportType: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  sections: ReportSection[];
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  generatedAt: Date;
  sharedAt?: Date;
  status: 'draft' | 'completed' | 'shared' | 'archived';
  metadata?: any;
}

export class ProfessionalReportsService {
  /**
   * Generate a professional health report
   */
  async generateReport(input: ReportInput) {
    try {
      const { userId, reportType, reportPeriodStart, reportPeriodEnd, includeCharts = true, includePredictions = true, includeRecommendations = true, professionalId, professionalName } = input;

      // Generate report sections
      const sections = await this.generateReportSections(userId, reportType, reportPeriodStart, reportPeriodEnd, includeCharts, includePredictions, includeRecommendations);

      // Generate summary and key findings
      const { summary, keyFindings, recommendations } = await this.generateReportSummary(sections);

      // Create report record
      const report = await db.insert(healthReports).values({
        userId,
        professionalId: professionalId || 'self',
        professionalName: professionalName || 'Self-generated',
        reportType,
        reportPeriodStart: format(reportPeriodStart, 'yyyy-MM-dd'),
        reportPeriodEnd: format(reportPeriodEnd, 'yyyy-MM-dd'),
        sections,
        summary,
        keyFindings,
        recommendations,
        generatedAt: new Date(),
        status: 'completed',
        metadata: {
          includeCharts,
          includePredictions,
          includeRecommendations,
          generatedBy: 'system'
        }
      }).returning();

      return report[0];
    } catch (error) {
      console.error('Error generating professional report:', error);
      throw new Error(`Failed to generate professional report: ${error.message}`);
    }
  }

  /**
   * Generate report sections
   */
  private async generateReportSections(userId: number, reportType: string, startDate: Date, endDate: Date, includeCharts: boolean, includePredictions: boolean, includeRecommendations: boolean) {
    const sections: ReportSection[] = [];

    // Executive Summary
    sections.push(await this.generateExecutiveSummary(userId, startDate, endDate));

    // Health Scores Overview
    sections.push(await this.generateHealthScoresOverview(userId, startDate, endDate));

    // Nutrition Analysis
    sections.push(await this.generateNutritionAnalysis(userId, startDate, endDate));

    // Fitness & Activity Analysis
    sections.push(await this.generateFitnessAnalysis(userId, startDate, endDate));

    // Sleep & Recovery Analysis
    sections.push(await this.generateSleepAnalysis(userId, startDate, endDate));

    // Predictive Analytics
    if (includePredictions) {
      sections.push(await this.generatePredictiveAnalysis(userId, startDate, endDate));
    }

    // Goal Progress
    sections.push(await this.generateGoalProgress(userId, startDate, endDate));

    // Recommendations
    if (includeRecommendations) {
      sections.push(await this.generateRecommendations(userId, startDate, endDate));
    }

    return sections;
  }

  /**
   * Generate executive summary
   */
  private async generateExecutiveSummary(userId: number, startDate: Date, endDate: Date) {
    const [healthScoresData, metricsData, goalsData] = await Promise.all([
      this.getHealthScoresForPeriod(userId, startDate, endDate),
      this.getMetricsForPeriod(userId, startDate, endDate),
      this.getActiveGoals(userId)
    ]);

    const avgOverallScore = healthScoresData.length > 0 
      ? healthScoresData.filter(s => s.scoreType === 'overall').reduce((sum, s) => sum + s.scoreValue, 0) / healthScoresData.filter(s => s.scoreType === 'overall').length
      : 0;

    const totalMetrics = metricsData.length;
    const activeGoals = goalsData.length;

    const summary = `
This ${this.getReportPeriodName(startDate, endDate)} health report provides a comprehensive overview of your health journey during the specified period. 
Your overall health score averaged ${avgOverallScore.toFixed(1)} out of 100, with ${totalMetrics} health metrics tracked and ${activeGoals} active health goals.
    `.trim();

    return {
      title: 'Executive Summary',
      content: summary,
      data: {
        avgOverallScore,
        totalMetrics,
        activeGoals,
        reportPeriod: { start: startDate, end: endDate }
      }
    };
  }

  /**
   * Generate health scores overview
   */
  private async generateHealthScoresOverview(userId: number, startDate: Date, endDate: Date) {
    const healthScoresData = await this.getHealthScoresForPeriod(userId, startDate, endDate);
    
    const scoreTypes = ['nutrition', 'fitness', 'recovery', 'consistency', 'overall'];
    const scoreData: { [key: string]: any } = {};

    scoreTypes.forEach(type => {
      const typeScores = healthScoresData.filter(s => s.scoreType === type);
      if (typeScores.length > 0) {
        scoreData[type] = {
          average: typeScores.reduce((sum, s) => sum + s.scoreValue, 0) / typeScores.length,
          min: Math.min(...typeScores.map(s => s.scoreValue)),
          max: Math.max(...typeScores.map(s => s.scoreValue)),
          trend: this.calculateTrend(typeScores.map(s => s.scoreValue))
        };
      }
    });

    const content = `
Health scores provide a comprehensive view of your wellness across multiple dimensions:

${Object.entries(scoreData).map(([type, data]: [string, any]) => `
**${type.charAt(0).toUpperCase() + type.slice(1)} Score**: ${data.average.toFixed(1)}/100
- Trend: ${data.trend}
- Range: ${data.min} - ${data.max}
`).join('\n')}

These scores help identify areas of strength and opportunities for improvement.
    `.trim();

    return {
      title: 'Health Scores Overview',
      content,
      data: scoreData
    };
  }

  /**
   * Generate nutrition analysis
   */
  private async generateNutritionAnalysis(userId: number, startDate: Date, endDate: Date) {
    const nutritionData = await this.getNutritionDataForPeriod(userId, startDate, endDate);
    
    if (nutritionData.length === 0) {
      return {
        title: 'Nutrition Analysis',
        content: 'No nutrition data available for the selected period.',
        data: {}
      };
    }

    const totalCalories = nutritionData.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const avgCalories = totalCalories / nutritionData.length;
    const totalProtein = nutritionData.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = nutritionData.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = nutritionData.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    const uniqueCategories = new Set(nutritionData.map(meal => meal.foodCategory)).size;
    const mealsPerDay = nutritionData.length / this.getDaysInPeriod(startDate, endDate);

    const content = `
Nutrition analysis for ${this.getReportPeriodName(startDate, endDate)}:

**Daily Averages:**
- Calories: ${avgCalories.toFixed(0)} kcal
- Protein: ${(totalProtein / this.getDaysInPeriod(startDate, endDate)).toFixed(1)}g
- Carbohydrates: ${(totalCarbs / this.getDaysInPeriod(startDate, endDate)).toFixed(1)}g
- Fat: ${(totalFat / this.getDaysInPeriod(startDate, endDate)).toFixed(1)}g

**Meal Patterns:**
- Total meals tracked: ${nutritionData.length}
- Average meals per day: ${mealsPerDay.toFixed(1)}
- Food diversity: ${uniqueCategories} unique categories

**Nutrition Quality:**
${this.evaluateNutritionQuality(avgCalories, totalProtein / this.getDaysInPeriod(startDate, endDate), totalCarbs / this.getDaysInPeriod(startDate, endDate), totalFat / this.getDaysInPeriod(startDate, endDate))}
    `.trim();

    return {
      title: 'Nutrition Analysis',
      content,
      data: {
        totalCalories,
        avgCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        uniqueCategories,
        mealsPerDay,
        nutritionQuality: this.calculateNutritionScore(avgCalories, totalProtein / this.getDaysInPeriod(startDate, endDate), totalCarbs / this.getDaysInPeriod(startDate, endDate), totalFat / this.getDaysInPeriod(startDate, endDate))
      }
    };
  }

  /**
   * Generate fitness analysis
   */
  private async generateFitnessAnalysis(userId: number, startDate: Date, endDate: Date) {
    const fitnessData = await this.getFitnessDataForPeriod(userId, startDate, endDate);
    
    if (fitnessData.length === 0) {
      return {
        title: 'Fitness & Activity Analysis',
        content: 'No fitness data available for the selected period.',
        data: {}
      };
    }

    const totalDuration = fitnessData.reduce((sum, workout) => sum + (workout.duration || 0), 0);
    const avgDuration = totalDuration / fitnessData.length;
    const totalCaloriesBurned = fitnessData.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);
    const highIntensityCount = fitnessData.filter(w => w.intensity === 'high').length;
    const highIntensityRatio = (highIntensityCount / fitnessData.length) * 100;

    const content = `
Fitness and activity analysis for ${this.getReportPeriodName(startDate, endDate)}:

**Activity Summary:**
- Total workouts: ${fitnessData.length}
- Total duration: ${this.formatDuration(totalDuration)}
- Average workout duration: ${this.formatDuration(avgDuration)}
- Total calories burned: ${totalCaloriesBurned} kcal
- High-intensity workouts: ${highIntensityRatio.toFixed(1)}%

**Activity Trends:**
${this.evaluateActivityTrends(fitnessData, startDate, endDate)}

**Fitness Recommendations:**
${this.generateFitnessRecommendations(avgDuration, highIntensityRatio, totalCaloriesBurned)}
    `.trim();

    return {
      title: 'Fitness & Activity Analysis',
      content,
      data: {
        totalWorkouts: fitnessData.length,
        totalDuration,
        avgDuration,
        totalCaloriesBurned,
        highIntensityRatio,
        fitnessScore: this.calculateFitnessScore(avgDuration, highIntensityRatio, totalCaloriesBurned)
      }
    };
  }

  /**
   * Generate sleep analysis
   */
  private async generateSleepAnalysis(userId: number, startDate: Date, endDate: Date) {
    const sleepData = await this.getSleepDataForPeriod(userId, startDate, endDate);
    
    if (sleepData.length === 0) {
      return {
        title: 'Sleep & Recovery Analysis',
        content: 'No sleep data available for the selected period.',
        data: {}
      };
    }

    const avgDuration = sleepData.reduce((sum, sleep) => sum + (sleep.duration || 0), 0) / sleepData.length;
    const avgQuality = sleepData.reduce((sum, sleep) => sum + (sleep.qualityScore || 0), 0) / sleepData.length;
    const avgDeepSleepRatio = sleepData.reduce((sum, sleep) => sum + (sleep.deepSleepRatio || 0), 0) / sleepData.length;

    const content = `
Sleep and recovery analysis for ${this.getReportPeriodName(startDate, endDate)}:

**Sleep Quality Metrics:**
- Average sleep duration: ${this.formatDuration(avgDuration)}
- Average sleep quality: ${avgQuality.toFixed(1)}/100
- Average deep sleep ratio: ${(avgDeepSleepRatio * 100).toFixed(1)}%

**Sleep Patterns:**
${this.evaluateSleepPatterns(sleepData, startDate, endDate)}

**Recovery Assessment:**
${this.evaluateRecovery(avgDuration, avgQuality, avgDeepSleepRatio)}

**Sleep Recommendations:**
${this.generateSleepRecommendations(avgDuration, avgQuality, avgDeepSleepRatio)}
    `.trim();

    return {
      title: 'Sleep & Recovery Analysis',
      content,
      data: {
        avgDuration,
        avgQuality,
        avgDeepSleepRatio,
        recoveryScore: this.calculateRecoveryScore(avgDuration, avgQuality, avgDeepSleepRatio)
      }
    };
  }

  /**
   * Generate predictive analysis
   */
  private async generatePredictiveAnalysis(userId: number, startDate: Date, endDate: Date) {
    const predictions = await this.getRecentPredictions(userId);
    
    if (predictions.length === 0) {
      return {
        title: 'Predictive Analytics',
        content: 'No predictions available for the selected period.',
        data: {}
      };
    }

    const content = `
Predictive analytics for ${this.getReportPeriodName(startDate, endDate)}:

**Health Predictions:**
${predictions.map(prediction => `
- **${prediction.predictionType.replace('_', ' ')}**: ${prediction.predictionValue} 
  - Confidence: ${prediction.confidenceScore}%
  - Target date: ${new Date(prediction.targetDate).toLocaleDateString()}
  - Recommendations: ${prediction.recommendations.join(', ')}
`).join('\n')}

**Trend Analysis:**
${this.analyzePredictionTrends(predictions)}

**Risk Assessment:**
${this.assessHealthRisks(predictions)}
    `.trim();

    return {
      title: 'Predictive Analytics',
      content,
      data: { predictions }
    };
  }

  /**
   * Generate goal progress
   */
  private async generateGoalProgress(userId: number, startDate: Date, endDate: Date) {
    const goals = await this.getActiveGoals(userId);
    
    if (goals.length === 0) {
      return {
        title: 'Goal Progress',
        content: 'No active goals found for the selected period.',
        data: {}
      };
    }

    const content = `
Goal progress for ${this.getReportPeriodName(startDate, endDate)}:

**Active Goals:**
${goals.map(goal => `
- **${goal.goalTitle}**: ${goal.progressPercentage}% complete
  - Target: ${goal.targetValue} ${goal.unit}
  - Target date: ${new Date(goal.targetDate).toLocaleDateString()}
  - Achievement probability: ${goal.achievementProbability}%
  - Priority: ${goal.priority}
`).join('\n')}

**Progress Analysis:**
${this.analyzeGoalProgress(goals)}

**Goal Recommendations:**
${this.generateGoalRecommendations(goals)}
    `.trim();

    return {
      title: 'Goal Progress',
      content,
      data: { goals }
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(userId: number, startDate: Date, endDate: Date) {
    const [healthScoresData, nutritionData, fitnessData, sleepData] = await Promise.all([
      this.getHealthScoresForPeriod(userId, startDate, endDate),
      this.getNutritionDataForPeriod(userId, startDate, endDate),
      this.getFitnessDataForPeriod(userId, startDate, endDate),
      this.getSleepDataForPeriod(userId, startDate, endDate)
    ]);

    const recommendations: string[] = [];

    // Nutrition recommendations
    if (nutritionData.length > 0) {
      const avgCalories = nutritionData.reduce((sum, meal) => sum + (meal.calories || 0), 0) / nutritionData.length;
      if (avgCalories < 1500) {
        recommendations.push('Consider increasing calorie intake to meet your energy needs.');
      } else if (avgCalories > 2500) {
        recommendations.push('Consider moderating calorie intake to support your health goals.');
      }
    }

    // Fitness recommendations
    if (fitnessData.length > 0) {
      const avgDuration = fitnessData.reduce((sum, workout) => sum + (workout.duration || 0), 0) / fitnessData.length;
      if (avgDuration < 30) {
        recommendations.push('Aim for at least 30 minutes of moderate exercise most days of the week.');
      }
    }

    // Sleep recommendations
    if (sleepData.length > 0) {
      const avgDuration = sleepData.reduce((sum, sleep) => sum + (sleep.duration || 0), 0) / sleepData.length;
      if (avgDuration < 7) {
        recommendations.push('Prioritize 7-9 hours of quality sleep for optimal recovery.');
      }
    }

    // General health recommendations
    const overallScore = healthScoresData.filter(s => s.scoreType === 'overall').reduce((sum, s) => sum + s.scoreValue, 0) / healthScoresData.filter(s => s.scoreType === 'overall').length || 0;
    if (overallScore < 70) {
      recommendations.push('Focus on improving consistency across all health metrics.');
    }

    const content = `
Personalized recommendations for ${this.getReportPeriodName(startDate, endDate)}:

${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

**Implementation Strategy:**
- Start with 1-2 recommendations and focus on consistency
- Track your progress and adjust as needed
- Consider consulting with healthcare professionals for personalized guidance
    `.trim();

    return {
      title: 'Recommendations',
      content,
      data: { recommendations }
    };
  }

  /**
   * Generate report summary
   */
  private async generateReportSummary(sections: ReportSection[]) {
    const allContent = sections.map(s => s.content).join(' ');
    const keyFindings = this.extractKeyFindings(sections);
    const recommendations = sections.find(s => s.title === 'Recommendations')?.data?.recommendations || [];

    const summary = `
This comprehensive health report covers ${sections.length} key areas of your wellness journey. 
Key findings indicate ${keyFindings.join(', ')}. 
The report provides ${recommendations.length} actionable recommendations to help you achieve your health goals.
    `.trim();

    return { summary, keyFindings, recommendations };
  }

  /**
   * Get health scores for a period
   */
  private async getHealthScoresForPeriod(userId: number, startDate: Date, endDate: Date) {
    return await db
      .select()
      .from(healthScores)
      .where(and(
        eq(healthScores.userId, userId),
        gte(healthScores.calculationDate, startDate),
        lte(healthScores.calculationDate, endDate)
      ))
      .orderBy(healthScores.calculationDate);
  }

  /**
   * Get metrics for a period
   */
  private async getMetricsForPeriod(userId: number, startDate: Date, endDate: Date) {
    return await db
      .select()
      .from(realTimeMonitoring)
      .where(and(
        eq(realTimeMonitoring.userId, userId),
        gte(realTimeMonitoring.timestamp, startDate),
        lte(realTimeMonitoring.timestamp, endDate)
      ))
      .orderBy(realTimeMonitoring.timestamp);
  }

  /**
   * Get active goals
   */
  private async getActiveGoals(userId: number) {
    return await db
      .select()
      .from(healthGoals)
      .where(and(
        eq(healthGoals.userId, userId),
        eq(healthGoals.status, 'active')
      ))
      .orderBy(healthGoals.createdAt);
  }

  /**
   * Get nutrition data for a period
   */
  private async getNutritionDataForPeriod(userId: number, startDate: Date, endDate: Date) {
    // This would need to be implemented based on your meals table structure
    return [];
  }

  /**
   * Get fitness data for a period
   */
  private async getFitnessDataForPeriod(userId: number, startDate: Date, endDate: Date) {
    // This would need to be implemented based on your workouts table structure
    return [];
  }

  /**
   * Get sleep data for a period
   */
  private async getSleepDataForPeriod(userId: number, startDate: Date, endDate: Date) {
    // This would need to be implemented based on your sleep_data table structure
    return [];
  }

  /**
   * Get recent predictions
   */
  private async getRecentPredictions(userId: number) {
    return await db
      .select()
      .from(healthPredictions)
      .where(and(
        eq(healthPredictions.userId, userId),
        eq(healthPredictions.isActive, true)
      ))
      .orderBy(healthPredictions.createdAt);
  }

  /**
   * Helper methods
   */
  private getReportPeriodName(startDate: Date, endDate: Date): string {
    const days = this.getDaysInPeriod(startDate, endDate);
    if (days <= 7) return 'weekly';
    if (days <= 30) return 'monthly';
    if (days <= 90) return 'quarterly';
    return 'annual';
  }

  private getDaysInPeriod(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  private evaluateNutritionQuality(avgCalories: number, protein: number, carbs: number, fat: number): string {
    let quality = 'Good';
    
    if (avgCalories < 1500 || avgCalories > 2500) quality = 'Needs improvement';
    if (protein < 50) quality = 'Increase protein intake';
    if (carbs < 100 || carbs > 300) quality = 'Adjust carbohydrate balance';
    if (fat < 30 || fat > 100) quality = 'Monitor fat intake';
    
    return `Overall nutrition quality: ${quality}`;
  }

  private calculateNutritionScore(avgCalories: number, protein: number, carbs: number, fat: number): number {
    let score = 50;
    
    // Calorie score (0-25 points)
    if (avgCalories >= 1800 && avgCalories <= 2200) score += 25;
    else if (avgCalories >= 1600 && avgCalories <= 2400) score += 15;
    
    // Protein score (0-25 points)
    if (protein >= 60) score += 25;
    else if (protein >= 40) score += 15;
    
    // Carb score (0-25 points)
    if (carbs >= 120 && carbs <= 250) score += 25;
    else if (carbs >= 100 && carbs <= 300) score += 15;
    
    // Fat score (0-25 points)
    if (fat >= 40 && fat <= 80) score += 25;
    else if (fat >= 30 && carbs <= 100) score += 15;
    
    return Math.min(100, score);
  }

  private evaluateActivityTrends(fitnessData: any[], startDate: Date, endDate: Date): string {
    const weeks = this.getDaysInPeriod(startDate, endDate) / 7;
    const avgWeeklyWorkouts = fitnessData.length / weeks;
    
    if (avgWeeklyWorkouts >= 4) return 'Excellent consistency with regular workouts';
    if (avgWeeklyWorkouts >= 2) return 'Good activity level with room for improvement';
    return 'Consider increasing workout frequency for better results';
  }

  private generateFitnessRecommendations(avgDuration: number, highIntensityRatio: number, totalCaloriesBurned: number): string {
    const recommendations = [];
    
    if (avgDuration < 30) recommendations.push('Increase workout duration to at least 30 minutes');
    if (highIntensityRatio < 20) recommendations.push('Include more high-intensity workouts');
    if (totalCaloriesBurned < 1500) recommendations.push('Focus on burning more calories through increased activity');
    
    return recommendations.length > 0 ? recommendations.join('. ') : 'Maintain current fitness routine';
  }

  private calculateFitnessScore(avgDuration: number, highIntensityRatio: number, totalCaloriesBurned: number): number {
    let score = 0;
    
    // Duration score (0-40 points)
    if (avgDuration >= 60) score += 40;
    else if (avgDuration >= 30) score += 25;
    else if (avgDuration >= 15) score += 10;
    
    // Intensity score (0-30 points)
    if (highIntensityRatio >= 40) score += 30;
    else if (highIntensityRatio >= 20) score += 20;
    else if (highIntensityRatio >= 10) score += 10;
    
    // Calories score (0-30 points)
    if (totalCaloriesBurned >= 2000) score += 30;
    else if (totalCaloriesBurned >= 1000) score += 20;
    else if (totalCaloriesBurned >= 500) score += 10;
    
    return Math.min(100, score);
  }

  private evaluateSleepPatterns(sleepData: any[], startDate: Date, endDate: Date): string {
    const avgDuration = sleepData.reduce((sum, sleep) => sum + (sleep.duration || 0), 0) / sleepData.length;
    const consistency = this.calculateConsistency(sleepData.map(s => s.duration));
    
    if (avgDuration >= 7 && consistency > 80) return 'Excellent sleep patterns with good consistency';
    if (avgDuration >= 6 && consistency > 60) return 'Good sleep with room for improvement';
    return 'Sleep needs attention - focus on duration and consistency';
  }

  private evaluateRecovery(avgDuration: number, avgQuality: number, avgDeepSleepRatio: number): string {
    let recovery = 'Good';
    
    if (avgDuration < 6) recovery = 'Poor - insufficient sleep duration';
    else if (avgQuality < 60) recovery = 'Fair - sleep quality needs improvement';
    else if (avgDeepSleepRatio < 15) recovery = 'Fair - deep sleep ratio could be better';
    
    return `Recovery assessment: ${recovery}`;
  }

  private generateSleepRecommendations(avgDuration: number, avgQuality: number, avgDeepSleepRatio: number): string {
    const recommendations = [];
    
    if (avgDuration < 7) recommendations.push('Aim for 7-9 hours of sleep per night');
    if (avgQuality < 70) recommendations.push('Improve sleep environment and bedtime routine');
    if (avgDeepSleepRatio < 15) recommendations.push('Focus on stress management and sleep quality');
    
    return recommendations.length > 0 ? recommendations.join('. ') : 'Maintain current sleep routine';
  }

  private calculateRecoveryScore(avgDuration: number, avgQuality: number, avgDeepSleepRatio: number): number {
    let score = 0;
    
    // Duration score (0-40 points)
    if (avgDuration >= 8) score += 40;
    else if (avgDuration >= 7) score += 30;
    else if (avgDuration >= 6) score += 20;
    else if (avgDuration >= 5) score += 10;
    
    // Quality score (0-30 points)
    if (avgQuality >= 80) score += 30;
    else if (avgQuality >= 60) score += 20;
    else if (avgQuality >= 40) score += 10;
    
    // Deep sleep score (0-30 points)
    if (avgDeepSleepRatio >= 20) score += 30;
    else if (avgDeepSleepRatio >= 15) score += 20;
    else if (avgDeepSleepRatio >= 10) score += 10;
    
    return Math.min(100, score);
  }

  private calculateConsistency(values: number[]): number {
    if (values.length === 0) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert standard deviation to consistency percentage (inverse relationship)
    return Math.max(0, 100 - (stdDev / avg) * 100);
  }

  private extractKeyFindings(sections: ReportSection[]): string[] {
    const findings = [];
    
    sections.forEach(section => {
      if (section.data && typeof section.data === 'object') {
        Object.entries(section.data).forEach(([key, value]) => {
          if (typeof value === 'number' && value < 60) {
            findings.push(`${section.title} ${key} needs improvement`);
          }
        });
      }
    });
    
    return findings.length > 0 ? findings : ['Overall health status is stable'];
  }

  private analyzePredictionTrends(predictions: any[]): string {
    const highConfidence = predictions.filter(p => p.confidenceScore >= 80).length;
    const lowConfidence = predictions.filter(p => p.confidenceScore < 60).length;
    
    if (highConfidence > lowConfidence) return 'High confidence in predictions with reliable forecasts';
    if (lowConfidence > highConfidence) return 'Some predictions have low confidence - more data needed';
    return 'Mixed confidence levels - monitor trends over time';
  }

  private assessHealthRisks(predictions: any[]): string {
    const riskPredictions = predictions.filter(p => p.predictionType === 'health_risk' && p.predictionValue > 70);
    
    if (riskPredictions.length > 0) {
      return `Elevated health risk detected: ${riskPredictions.map(p => p.predictionDetails?.riskType || 'general').join(', ')}`;
    }
    
    return 'No significant health risks detected in current predictions';
  }

  private analyzeGoalProgress(goals: any[]): string {
    const onTrack = goals.filter(g => g.progressPercentage >= 70).length;
    const behind = goals.filter(g => g.progressPercentage < 50).length;
    
    if (onTrack === goals.length) return 'All goals are on track for successful completion';
    if (behind > goals.length / 2) return 'Multiple goals need attention and adjustment';
    return 'Mixed progress - some goals on track while others need focus';
  }

  private generateGoalRecommendations(goals: any[]): string {
    const recommendations = [];
    
    goals.forEach(goal => {
      if (goal.progressPercentage < 50) {
        recommendations.push(`Increase focus on ${goal.goalTitle} - consider breaking into smaller milestones`);
      }
      if (goal.achievementProbability < 50) {
        recommendations.push(`Reassess timeline or approach for ${goal.goalTitle}`);
      }
    });
    
    return recommendations.length > 0 ? recommendations.join('. ') : 'Continue current approach for goal achievement';
  }

  /**
   * Get user reports
   */
  async getUserReports(userId: number, limit: number = 50) {
    try {
      const reports = await db
        .select()
        .from(healthReports)
        .where(eq(healthReports.userId, userId))
        .orderBy(desc(healthReports.generatedAt))
        .limit(limit);

      return reports;
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw new Error(`Failed to get user reports: ${error.message}`);
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: number, userId: number) {
    try {
      const report = await db
        .select()
        .from(healthReports)
        .where(and(
          eq(healthReports.id, reportId),
          eq(healthReports.userId, userId)
        ))
        .limit(1);

      return report[0] || null;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw new Error(`Failed to get report by ID: ${error.message}`);
    }
  }

  /**
   * Share report with professional
   */
  async shareReport(reportId: number, professionalId: string, professionalName: string) {
    try {
      const report = await db
        .update(healthReports)
        .set({
          professionalId,
          professionalName,
          sharedAt: new Date(),
          status: 'shared',
          metadata: {
            ...healthReports.metadata,
            sharedWith: professionalId,
            sharedAt: new Date().toISOString()
          }
        })
        .where(eq(healthReports.id, reportId))
        .returning();

      return report[0];
    } catch (error) {
      console.error('Error sharing report:', error);
      throw new Error(`Failed to share report: ${error.message}`);
    }
  }

  /**
   * Export report in different formats
   */
  async exportReport(reportId: number, format: 'pdf' | 'html' | 'json') {
    try {
      const report = await this.getReportById(reportId, 1); // In real app, get from context
      
      if (!report) {
        throw new Error('Report not found');
      }

      switch (format) {
        case 'json':
          return JSON.stringify(report, null, 2);
        
        case 'html':
          return this.generateHTMLReport(report);
        
        case 'pdf':
          // In a real implementation, you would use a PDF library like puppeteer or jsPDF
          return this.generateHTMLReport(report); // Return HTML for now
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error(`Failed to export report: ${error.message}`);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: any): string {
    const sections = report.sections || [];
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Report - ${new Date(report.generatedAt).toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .section-title { color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .section-content { color: #374151; }
        .data { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .recommendations { background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .key-findings { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Health Report</h1>
        <p>Generated: ${new Date(report.generatedAt).toLocaleDateString()}</p>
        <p>Period: ${new Date(report.reportPeriodStart).toLocaleDateString()} - ${new Date(report.reportPeriodEnd).toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="section-content">${report.summary}</div>
    </div>
    
    <div class="key-findings">
        <h3>Key Findings</h3>
        <ul>
            ${report.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
        </ul>
    </div>
    
    ${sections.map((section: any) => `
    <div class="section">
        <div class="section-title">${section.title}</div>
        <div class="section-content">${section.content}</div>
        ${section.data ? `<div class="data"><pre>${JSON.stringify(section.data, null, 2)}</pre></div>` : ''}
    </div>
    `).join('')}
    
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
    `;
    
    return html;
  }
}