import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';

interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular: boolean;
  recommended: boolean;
}

interface Subscription {
  id: string;
  tier: string;
  status: 'active' | 'inactive' | 'cancelled';
  expiresAt: string;
  autoRenew: boolean;
}

export default function PremiumScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [autoRenew, setAutoRenew] = useState(true);

  // Mock premium features data
  const mockPremiumFeatures: PremiumFeature[] = [
    {
      id: '1',
      title: 'AI Food Recognition',
      description: 'Advanced AI-powered food identification with 95% accuracy',
      icon: 'camera-outline',
      color: '#6366F1',
      included: true
    },
    {
      id: '2',
      title: 'Personalized Nutrition Coach',
      description: '24/7 AI nutritionist with personalized meal recommendations',
      icon: 'person-outline',
      color: '#10B981',
      included: true
    },
    {
      id: '3',
      title: 'Wearable Integration',
      description: 'Sync data from Apple Watch, Fitbit, and other devices',
      icon: 'watch-outline',
      color: '#F59E0B',
      included: true
    },
    {
      id: '4',
      title: 'Advanced Analytics',
      description: 'Detailed health insights and trend analysis',
      icon: 'bar-chart-outline',
      color: '#EF4444',
      included: true
    },
    {
      id: '5',
      title: 'Meal Planning',
      description: 'AI-generated meal plans based on your goals',
      icon: 'calendar-outline',
      color: '#8B5CF6',
      included: true
    },
    {
      id: '6',
      title: 'Health Reports',
      description: 'Comprehensive monthly health reports',
      icon: 'document-text-outline',
      color: '#06B6D4',
      included: true
    }
  ];

  // Mock pricing tiers data
  const mockPricingTiers: PricingTier[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 9.99,
      period: 'month',
      features: [
        'AI Food Recognition',
        'Basic Nutrition Coach',
        'Meal History Tracking',
        'Basic Analytics'
      ],
      popular: false,
      recommended: false
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 79.99,
      period: 'year',
      features: [
        'All Premium Features',
        'Advanced Nutrition Coach',
        'Wearable Integration',
        'Advanced Analytics',
        'Meal Planning',
        'Health Reports',
        'Priority Support'
      ],
      popular: true,
      recommended: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 299.99,
      period: 'lifetime',
      features: [
        'All Premium Features',
        'Lifetime Access',
        'No Renewals',
        'Exclusive Features',
        'VIP Support'
      ],
      popular: false,
      recommended: false
    }
  ];

  // Mock subscription data
  const mockSubscription: Subscription = {
    id: '1',
    tier: 'annual',
    status: 'active',
    expiresAt: '2025-01-15T00:00:00Z',
    autoRenew: true
  };

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to get subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, this would come from API
      setSubscription(mockSubscription);
      
    } catch (error) {
      console.error('Error fetching subscription:', error);
      Alert.alert('Error', 'Failed to load subscription');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpgrade = (tierId: string) => {
    setSelectedTier(tierId);
    setShowPaymentModal(true);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Subscription Cancelled',
              'Your subscription has been cancelled. You will continue to have access until the end of your current billing period.',
              [{ text: 'OK', style: 'default' }]
            );
            setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
            setShowPaymentModal(false);
          }
        }
      ]
    );
  };

  const handleRenewSubscription = () => {
    Alert.alert(
      'Renew Subscription',
      'Your subscription will be renewed automatically. You will be charged on the same date each billing period.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Renew', 
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Subscription Renewed',
              'Your subscription has been renewed successfully.',
              [{ text: 'OK', style: 'default' }]
            );
            setSubscription(prev => prev ? { ...prev, autoRenew: true } : null);
          }
        }
      ]
    );
  };

  const handlePayment = () => {
    // Simulate payment process
    Alert.alert(
      'Processing Payment',
      'Please wait while we process your payment...',
      [{ text: 'OK', style: 'default' }]
    );
    
    setTimeout(() => {
      Alert.alert(
        'Payment Successful',
        'Your subscription has been activated successfully!',
        [{ text: 'OK', style: 'default' }]
      );
      setSubscription({
        id: '2',
        tier: selectedTier,
        status: 'active',
        expiresAt: selectedTier === 'monthly' ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() :
          selectedTier === 'annual' ?
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() :
          'lifetime',
        autoRenew: selectedTier !== 'lifetime'
      });
      setShowPaymentModal(false);
    }, 2000);
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscription();
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading premium features...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Premium Features
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Subscription Status */}
        {subscription && subscription.status === 'active' && (
          <View style={[styles.subscriptionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionStatus}>
                <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  Active
                </Text>
              </View>
              <Text style={[styles.subscriptionTier, { color: colors.text }]}>
                {subscription.tier === 'monthly' ? 'Monthly Plan' : 
                 subscription.tier === 'annual' ? 'Annual Plan' : 'Lifetime Plan'}
              </Text>
            </View>
            
            <Text style={[styles.subscriptionExpiry, { color: colors.text }]}>
              Expires: {formatExpiryDate(subscription.expiresAt)}
            </Text>
            
            <View style={styles.subscriptionActions}>
              {subscription.autoRenew && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRenewSubscription}
                >
                  <Ionicons name="refresh-outline" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Manage Renewal</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
                onPress={handleCancelSubscription}
              >
                <Ionicons name="close-outline" size={16} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Premium Features */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Premium Features
          </Text>
          
          <FlatList
            data={mockPremiumFeatures}
            renderItem={({ item }) => (
              <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.gray }]}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.featureStatus}>
                  {item.included ? (
                    <View style={[styles.includedBadge, { backgroundColor: '#10B98120' }]}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                      <Text style={[styles.includedText, { color: '#10B981' }]}>
                        Included
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.excludedBadge, { backgroundColor: '#EF444420' }]}>
                      <Ionicons name="lock-closed-outline" size={16} color="#EF4444" />
                      <Text style={[styles.excludedText, { color: '#EF4444' }]}>
                        Premium
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Your Plan
          </Text>
          
          <FlatList
            data={mockPricingTiers}
            renderItem={({ item }) => (
              <View style={[
                styles.pricingCard, 
                { backgroundColor: colors.card, borderColor: colors.border },
                item.popular && styles.popularCard,
                item.recommended && styles.recommendedCard
              ]}>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                
                {item.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recommended</Text>
                  </View>
                )}
                
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View style={styles.pricingPrice}>
                    <Text style={[styles.pricingCurrency, { color: colors.text }]}>
                      $
                    </Text>
                    <Text style={[styles.pricingAmount, { color: colors.text }]}>
                      {item.price}
                    </Text>
                    <Text style={[styles.pricingPeriod, { color: colors.gray }]}>
                      /{item.period}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.pricingFeatures}>
                  {item.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                      <Text style={[styles.featureItemText, { color: colors.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.pricingButton,
                    item.popular ? [styles.pricingButtonPopular, { backgroundColor: colors.primary }] : 
                    subscription?.status === 'active' && subscription.tier === item.id ? 
                    [styles.pricingButtonActive, { backgroundColor: colors.primary }] : 
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleUpgrade(item.id)}
                  disabled={subscription?.status === 'active' && subscription.tier === item.id}
                >
                  {subscription?.status === 'active' && subscription.tier === item.id ? (
                    <Text style={[styles.pricingButtonText, { color: 'white' }]}>
                      Current Plan
                    </Text>
                  ) : (
                    <>
                      <Ionicons name="arrow-up-outline" size={16} color="white" />
                      <Text style={[styles.pricingButtonText, { color: 'white' }]}>
                        Upgrade
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.paymentModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.paymentModalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.paymentModalTitle, { color: colors.text }]}>
                Complete Your Upgrade
              </Text>
              <View style={styles.paymentModalHeaderSpacer} />
            </View>

            <View style={styles.paymentModalContent}>
              {selectedTier && (
                <>
                  <View style={[styles.selectedTier, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.selectedTierText, { color: colors.text }]}>
                      Selected Plan: {mockPricingTiers.find(t => t.id === selectedTier)?.name}
                    </Text>
                    <Text style={[styles.selectedTierPrice, { color: colors.primary }]}>
                      ${mockPricingTiers.find(t => t.id === selectedTier)?.price}
                    </Text>
                  </View>

                  <View style={styles.paymentMethodSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Payment Method
                    </Text>
                    
                    <View style={styles.paymentMethods}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethod,
                          paymentMethod === 'credit_card' && [styles.paymentMethodActive, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => setPaymentMethod('credit_card')}
                      >
                        <Ionicons name="card-outline" size={20} color={paymentMethod === 'credit_card' ? 'white' : colors.text} />
                        <Text style={[styles.paymentMethodText, { color: paymentMethod === 'credit_card' ? 'white' : colors.text }]}>
                          Credit Card
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.paymentMethod,
                          paymentMethod === 'paypal' && [styles.paymentMethodActive, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => setPaymentMethod('paypal')}
                      >
                        <Ionicons name="wallet-outline" size={20} color={paymentMethod === 'paypal' ? 'white' : colors.text} />
                        <Text style={[styles.paymentMethodText, { color: paymentMethod === 'paypal' ? 'white' : colors.text }]}>
                          PayPal
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {selectedTier !== 'lifetime' && (
                    <View style={styles.autoRenewSection}>
                      <View style={styles.autoRenewOption}>
                        <Switch
                          value={autoRenew}
                          onValueChange={setAutoRenew}
                          trackColor={{ false: '#767577', true: colors.primary }}
                          thumbColor={autoRenew ? '#f4f3f4' : '#f4f3f4'}
                        />
                        <Text style={[styles.autoRenewText, { color: colors.text }]}>
                          Auto-renew subscription
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.primary }]}
                    onPress={handlePayment}
                  >
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text style={styles.paymentButtonText}>
                      Complete Payment
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  subscriptionContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionTier: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionExpiry: {
    fontSize: 14,
    marginBottom: 16,
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  featuresContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureContent: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureStatus: {
    alignItems: 'flex-end',
  },
  includedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  includedText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  excludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  excludedText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  pricingContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  pricingPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricingCurrency: {
    fontSize: 16,
    fontWeight: '600',
  },
  pricingAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  pricingPeriod: {
    fontSize: 16,
    fontWeight: '400',
  },
  pricingFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureItemText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  pricingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  pricingButtonPopular: {
    backgroundColor: '#F59E0B',
  },
  pricingButtonActive: {
    backgroundColor: '#10B981',
  },
  pricingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentModalContainer: {
    flex: 1,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  paymentModalHeaderSpacer: {
    width: 40,
  },
  paymentModalContent: {
    flex: 1,
    padding: 16,
  },
  selectedTier: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  selectedTierText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedTierPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethods: {
    marginTop: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentMethodActive: {
    backgroundColor: '#6366F1',
    borderWidth: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  autoRenewSection: {
    marginBottom: 24,
  },
  autoRenewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  autoRenewText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});