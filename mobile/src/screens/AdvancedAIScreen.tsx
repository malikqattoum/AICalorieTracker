import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import { API_URL } from '../config';
import { safeFetchJson } from '../utils/fetchWrapper';

interface AIResponse {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  category: string;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  premium: boolean;
  enabled: boolean;
}

export default function AdvancedAIScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('chat');
  const [premiumStatus, setPremiumStatus] = useState(false);

  const aiFeatures: AIFeature[] = [
    {
      id: 'chat',
      name: 'AI Chat Assistant',
      description: 'Get personalized nutrition and health advice',
      icon: 'chatbubble-ellipses-outline',
      color: '#3B82F6',
      premium: false,
      enabled: true,
    },
    {
      id: 'meal-planner',
      name: 'AI Meal Planner',
      description: 'Generate personalized meal plans based on your goals',
      icon: 'restaurant-outline',
      color: '#10B981',
      premium: true,
      enabled: premiumStatus,
    },
    {
      id: 'workout-generator',
      name: 'AI Workout Generator',
      description: 'Create custom workout routines for your fitness level',
      icon: 'fitness-outline',
      color: '#EF4444',
      premium: true,
      enabled: premiumStatus,
    },
    {
      id: 'nutrition-analyzer',
      name: 'AI Nutrition Analyzer',
      description: 'Deep analysis of your nutritional patterns',
      icon: 'analytics-outline',
      color: '#8B5CF6',
      premium: true,
      enabled: premiumStatus,
    },
    {
      id: 'health-predictor',
      name: 'Health Predictor',
      description: 'AI-powered health risk assessment and predictions',
      icon: 'pulse-outline',
      color: '#F59E0B',
      premium: true,
      enabled: premiumStatus,
    },
    {
      id: 'voice-assistant',
      name: 'Voice Assistant',
      description: 'Control the app with your voice',
      icon: 'mic-outline',
      color: '#06B6D4',
      premium: true,
      enabled: premiumStatus,
    },
  ];

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage: AIResponse = {
      id: `user-${Date.now()}`,
      question: inputText,
      answer: '',
      timestamp: new Date(),
      category: 'user',
    };

    setResponses(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Simulate AI response - in real app, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse: AIResponse = {
        id: `ai-${Date.now()}`,
        question: inputText,
        answer: generateAIResponse(inputText),
        timestamp: new Date(),
        category: 'ai',
      };

      setResponses(prev => [...prev, aiResponse]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('calorie') || lowerQuestion.includes('weight')) {
      return 'Based on your profile, I recommend a daily calorie intake of 2,000-2,200 calories for your current goals. To lose weight gradually, aim for a 500-calorie deficit per day. Would you like me to create a personalized meal plan?';
    }
    
    if (lowerQuestion.includes('protein')) {
      return 'For your activity level, I recommend consuming 1.6-2.2g of protein per kg of body weight. Good sources include chicken breast, fish, eggs, legumes, and Greek yogurt. Would you like specific protein-rich meal suggestions?';
    }
    
    if (lowerQuestion.includes('exercise') || lowerQuestion.includes('workout')) {
      return 'I recommend 150 minutes of moderate exercise or 75 minutes of vigorous exercise per week. For best results, combine cardio with strength training 2-3 times per week. Would you like me to create a personalized workout plan?';
    }
    
    if (lowerQuestion.includes('sleep')) {
      return 'Aim for 7-9 hours of quality sleep per night. Poor sleep can affect your metabolism, appetite hormones, and recovery. Try to maintain a consistent sleep schedule and create a relaxing bedtime routine.';
    }
    
    if (lowerQuestion.includes('water')) {
      return 'Stay hydrated by drinking at least 2.5-3.5 liters of water daily. Your needs may vary based on activity level, climate, and individual factors. Try to drink water consistently throughout the day rather than all at once.';
    }
    
    return 'I understand your question about nutrition and health. Based on your profile and goals, I can provide personalized advice. Could you be more specific about what you\'d like to know? I can help with meal planning, workout routines, nutritional analysis, and more.';
  };

  const handleFeaturePress = (featureId: string) => {
    const feature = aiFeatures.find(f => f.id === featureId);
    
    if (feature && feature.premium && !premiumStatus) {
      Alert.alert(
        'Premium Feature',
        'This feature requires premium subscription. Upgrade now to unlock all premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Redirecting to premium upgrade...') }
        ]
      );
      return;
    }
    
    if (feature && feature.enabled) {
      setSelectedFeature(featureId);
      setResponses([]);
    }
  };

  const renderMessageItem = ({ item }: { item: AIResponse }) => (
    <View 
      style={[
        styles.messageContainer,
        item.category === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.category === 'user' 
            ? [styles.userMessageBubble, { backgroundColor: colors.primary }]
            : [styles.aiMessageBubble, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text 
          style={[
            styles.messageText, 
            { color: item.category === 'user' ? 'white' : colors.text },
          ]}
        >
          {item.category === 'user' ? item.question : item.answer}
        </Text>
      </View>
    </View>
  );

  const renderFeatureContent = () => {
    switch (selectedFeature) {
      case 'chat':
        return (
          <View style={styles.chatContainer}>
            <ScrollView
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                // Scroll to bottom when content changes
              }}
            >
              {responses.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.primary} />
                  <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                    AI Assistant Ready
                  </Text>
                  <Text style={[styles.welcomeText, { color: colors.gray }]}>
                    Ask me anything about nutrition, fitness, health, or wellness. I'm here to help you achieve your goals!
                  </Text>
                  <View style={styles.suggestions}>
                    <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                      Try asking:
                    </Text>
                    <View style={styles.suggestionButtons}>
                      <TouchableOpacity
                        style={[styles.suggestionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setInputText('How many calories should I eat daily?')}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                          Calorie recommendations
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.suggestionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setInputText('Best protein sources for muscle gain?')}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                          Protein sources
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.suggestionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setInputText('Create a workout plan for beginners')}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                          Workout plan
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <FlatList
                  data={responses}
                  renderItem={renderMessageItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.messagesList}
                />
              )}
            </ScrollView>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.gray}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() ? colors.primary : colors.gray },
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.content}>
            <View style={styles.centerContent}>
              <Ionicons name="lock-closed-outline" size={48} color={colors.gray} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Feature Coming Soon
              </Text>
              <Text style={[styles.featureDescription, { color: colors.gray }]}>
                This AI feature is currently in development and will be available soon.
              </Text>
            </View>
          </View>
        );
    }
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
            Advanced AI
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Feature Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.featureScroll}
        contentContainerStyle={styles.featureScrollContent}
      >
        {aiFeatures.map(feature => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              { 
                backgroundColor: feature.enabled ? colors.card : '#F3F4F6',
                borderColor: feature.enabled ? colors.border : '#E5E7EB',
                opacity: feature.enabled ? 1 : 0.6
              }
            ]}
            onPress={() => handleFeaturePress(feature.id)}
            disabled={!feature.enabled}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon as any} size={24} color={feature.color} />
            </View>
            <Text style={[styles.featureName, { color: colors.text }]}>
              {feature.name}
            </Text>
            <Text style={[styles.featureDescription, { color: colors.gray }]}>
              {feature.description}
            </Text>
            {feature.premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>
                  Premium
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {renderFeatureContent()}
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
  featureScroll: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  featureDescriptionText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  suggestions: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  suggestionButtons: {
    gap: 8,
  },
  suggestionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});