import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation';
import calendarService, { Meal, DailyStats } from '../services/calendarService';

type MealCalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MealCalendarScreen() {
  const navigation = useNavigation<MealCalendarScreenNavigationProp>();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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

  // Get meal type icon
  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'nutrition-outline';
    }
  };

  // Get current month
  const currentMonth = selectedDate.substring(0, 7); // Format: 'YYYY-MM'

  // Fetch calendar data
  const { data: calendarData, isLoading: isCalendarLoading } = useQuery({
    queryKey: ['calendarData', currentMonth],
    queryFn: async () => {
      return await calendarService.getCalendarData(currentMonth);
    },
  });

  // Fetch daily stats
  const { data: dailyStats, isLoading: isDailyStatsLoading } = useQuery({
    queryKey: ['dailyStats', selectedDate],
    queryFn: async () => {
      return await calendarService.getDailyStats(selectedDate);
    },
  });

  // Calculate calorie progress
  const calculateCalorieProgress = () => {
    if (!dailyStats) return 0;
    const percentage = (dailyStats.totalCalories / dailyStats.calorieGoal) * 100;
    return Math.min(percentage, 100);
  };

  // Render meal item
  const renderMealItem = ({ item }: { item: Meal }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('MealDetails', { mealId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.mealTypeTag, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={getMealTypeIcon(item.mealType)} size={14} color={colors.primary} />
        <Text style={[styles.mealTypeText, { color: colors.primary }]}>
          {i18n.t(`mealHistory.${item.mealType}`)}
        </Text>
      </View>
      
      <View style={styles.mealContent}>
        <View style={styles.mealInfo}>
          <Text style={[styles.mealName, { color: colors.text }]}>
            {item.foodName}
          </Text>
          <Text style={[styles.mealTime, { color: colors.gray }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        <View style={styles.mealNutrition}>
          <Text style={[styles.mealCalories, { color: colors.primary }]}>
            {item.calories} cal
          </Text>
          <View style={styles.mealMacros}>
            <Text style={[styles.mealMacro, { color: colors.gray }]}>
              P: {item.protein}g
            </Text>
            <Text style={[styles.mealMacro, { color: colors.gray }]}>
              C: {item.carbs}g
            </Text>
            <Text style={[styles.mealMacro, { color: colors.gray }]}>
              F: {item.fat}g
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('mealCalendar.title')}
        </Text>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              { 
                backgroundColor: viewMode === 'weekly' ? colors.primary : colors.card,
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              },
            ]}
            onPress={() => setViewMode('weekly')}
          >
            <Text 
              style={[
                styles.viewToggleText, 
                { color: viewMode === 'weekly' ? 'white' : colors.text },
              ]}
            >
              {i18n.t('mealCalendar.weeklyView')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              { 
                backgroundColor: viewMode === 'monthly' ? colors.primary : colors.card,
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              },
            ]}
            onPress={() => setViewMode('monthly')}
          >
            <Text 
              style={[
                styles.viewToggleText, 
                { color: viewMode === 'monthly' ? 'white' : colors.text },
              ]}
            >
              {i18n.t('mealCalendar.monthlyView')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...calendarData?.markedDates,
          [selectedDate]: {
            selected: true,
            selectedColor: colors.primary,
            marked: calendarData?.markedDates?.[selectedDate]?.marked,
            dotColor: 'white',
          },
        }}
        hideExtraDays={viewMode === 'weekly'}
        showWeekNumbers={false}
        firstDay={1}
        hideDayNames={false}
        showSixWeeks={viewMode === 'monthly'}
        enableSwipeMonths={true}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.gray,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: 'white',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.gray + '50',
          dotColor: colors.primary,
          selectedDotColor: 'white',
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontFamily: 'Inter-Regular',
          textMonthFontFamily: 'Inter-SemiBold',
          textDayHeaderFontFamily: 'Inter-Medium',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />

      <View style={styles.content}>
        <Text style={[styles.selectedDate, { color: colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        
        {isDailyStatsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : dailyStats ? (
          <>
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.calorieContainer}>
                <View style={styles.calorieInfo}>
                  <Text style={[styles.calorieTitle, { color: colors.text }]}>
                    {i18n.t('mealCalendar.totalCalories')}
                  </Text>
                  <Text style={[styles.calorieValue, { color: colors.primary }]}>
                    {dailyStats.totalCalories} / {dailyStats.calorieGoal}
                  </Text>
                </View>
                
                <View style={[styles.progressBarContainer, { backgroundColor: colors.lightGray }]}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        backgroundColor: colors.primary,
                        width: `${calculateCalorieProgress()}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              
              <Text style={[styles.nutritionTitle, { color: colors.text }]}>
                {i18n.t('mealCalendar.dailyNutrition')}
              </Text>
              
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#4ADE80' }]}>
                    {dailyStats.totalProtein}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.gray }]}>
                    {i18n.t('home.protein')}
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#60A5FA' }]}>
                    {dailyStats.totalCarbs}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.gray }]}>
                    {i18n.t('home.carbs')}
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#F59E0B' }]}>
                    {dailyStats.totalFat}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.gray }]}>
                    {i18n.t('home.fat')}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.mealsHeader}>
              <Text style={[styles.mealsTitle, { color: colors.text }]}>
                Meals
              </Text>
              
              <TouchableOpacity
                style={[styles.addMealButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Camera')}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addMealButtonText}>
                  {i18n.t('mealCalendar.addMeal')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {dailyStats.meals.length > 0 ? (
              <FlatList
                data={dailyStats.meals}
                renderItem={renderMealItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.mealsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.gray }]}>
                  {i18n.t('mealCalendar.noMeals')}
                </Text>
                
                <TouchableOpacity
                  style={[styles.scanButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Camera')}
                >
                  <Ionicons name="camera-outline" size={16} color="white" />
                  <Text style={styles.scanButtonText}>
                    {i18n.t('home.scanMeal')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              {i18n.t('mealCalendar.noMeals')}
            </Text>
            
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Camera')}
            >
              <Ionicons name="camera-outline" size={16} color="white" />
              <Text style={styles.scanButtonText}>
                {i18n.t('home.scanMeal')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  calendar: {
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  calorieContainer: {
    marginBottom: 16,
  },
  calorieInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMealButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealsList: {
    paddingBottom: 20,
  },
  mealItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mealTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealContent: {
    padding: 12,
  },
  mealInfo: {
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  mealTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  mealMacros: {
    flexDirection: 'row',
  },
  mealMacro: {
    fontSize: 12,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
  },
});