import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import nutritionCoachService from '../services/nutritionCoachService';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function NutritionCoachScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: '0',
        content: i18n.t('nutritionCoach.welcomeMessage'),
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Use the nutrition coach service
      const response = await nutritionCoachService.askQuestion(message);
      
      // Convert the response format to match our component's expected format
      return {
        response: response.content
      };
    },
    onMutate: (message) => {
      // Optimistically add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Add thinking message
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}`,
        content: i18n.t('nutritionCoach.thinking'),
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, thinkingMessage]);
    },
    onSuccess: (data, variables, context) => {
      // Remove thinking message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.id.startsWith('thinking-'));
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: data.response,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        return [...filtered, aiMessage];
      });
    },
    onError: (error) => {
      // Remove thinking message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.id.startsWith('thinking-'));
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: i18n.t('nutritionCoach.errorMessage'),
          sender: 'ai',
          timestamp: new Date(),
        };
        
        return [...filtered, errorMessage];
      });
    },
  });

  // Handle send message
  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    sendMessageMutation.mutate(inputText.trim());
  };

  // Handle suggestion press
  const handleSuggestionPress = (suggestion: string) => {
    sendMessageMutation.mutate(suggestion);
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => (
    <View 
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user' 
            ? [styles.userMessageBubble, { backgroundColor: colors.primary }]
            : [styles.aiMessageBubble, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        {item.id.startsWith('thinking-') ? (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text 
              style={[
                styles.messageText, 
                { color: colors.text },
              ]}
            >
              {item.content}
            </Text>
          </View>
        ) : (
          <Text 
            style={[
              styles.messageText, 
              { color: item.sender === 'user' ? 'white' : colors.text },
            ]}
          >
            {item.content}
          </Text>
        )}
      </View>
    </View>
  );

  // Render suggestions
  const renderSuggestions = () => {
    if (messages.length > 1) return null;
    
    const suggestions = i18n.t('nutritionCoach.suggestions') as string[];
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
          Try asking:
        </Text>
        
        <View style={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.suggestionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderSuggestions}
      />
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder={i18n.t('nutritionCoach.askQuestion')}
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
          disabled={!inputText.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 16,
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
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingTop: 10,
    paddingBottom: 10,
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
  suggestionsContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});