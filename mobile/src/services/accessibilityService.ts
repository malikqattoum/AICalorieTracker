import { AccessibilityInfo, Platform } from 'react-native';

interface AccessibilityConfig {
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  announcements: string[];
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  highContrast: boolean;
  colorBlindMode: boolean;
}

export class AccessibilityService {
  private config: AccessibilityConfig;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = {
      reduceMotion: false,
      screenReaderEnabled: false,
      announcements: [],
      fontSize: 'medium',
      highContrast: false,
      colorBlindMode: false
    };

    this.initialize();
  }

  private async initialize() {
    try {
      // Get initial accessibility settings
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

      this.config.reduceMotion = reduceMotion;
      this.config.screenReaderEnabled = screenReaderEnabled;

      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);

    } catch (error) {
      console.error('Error initializing accessibility service:', error);
    }
  }

  private handleReduceMotionChange = (reduceMotion: boolean) => {
    this.config.reduceMotion = reduceMotion;
    this.notifyListeners();
  };

  private handleScreenReaderChange = (screenReaderEnabled: boolean) => {
    this.config.screenReaderEnabled = screenReaderEnabled;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Add listener for accessibility changes
  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Remove listener
  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  // Get current accessibility configuration
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Update font size
  setFontSize(size: 'small' | 'medium' | 'large' | 'extra_large') {
    this.config.fontSize = size;
    this.notifyListeners();
  }

  // Toggle high contrast mode
  toggleHighContrast() {
    this.config.highContrast = !this.config.highContrast;
    this.notifyListeners();
  }

  // Toggle color blind mode
  toggleColorBlindMode() {
    this.config.colorBlindMode = !this.config.colorBlindMode;
    this.notifyListeners();
  }

  // Add announcement for screen readers
  announce(message: string) {
    if (this.config.screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
    this.config.announcements.push(message);
    
    // Keep only last 10 announcements
    if (this.config.announcements.length > 10) {
      this.config.announcements = this.config.announcements.slice(-10);
    }
  }

  // Get announcements
  getAnnouncements(): string[] {
    return [...this.config.announcements];
  }

  // Clear announcements
  clearAnnouncements() {
    this.config.announcements = [];
  }

  // Get font size scale factor
  getFontSizeScale(): number {
    switch (this.config.fontSize) {
      case 'small':
        return 0.8;
      case 'medium':
        return 1.0;
      case 'large':
        return 1.2;
      case 'extra_large':
        return 1.5;
      default:
        return 1.0;
    }
  }

  // Get accessibility styles
  getAccessibilityStyles() {
    const baseStyles = {
      fontSize: 16 * this.getFontSizeScale(),
      lineHeight: 24 * this.getFontSizeScale(),
    };

    if (this.config.highContrast) {
      return {
        ...baseStyles,
        color: '#000000',
        backgroundColor: '#FFFFFF',
        borderColor: '#000000',
      };
    }

    if (this.config.colorBlindMode) {
      return {
        ...baseStyles,
        // Use color blind friendly palette
        color: '#333333',
        backgroundColor: '#F5F5F5',
        borderColor: '#CCCCCC',
      };
    }

    return baseStyles;
  }

  // Check if animations should be reduced
  shouldReduceMotion(): boolean {
    return this.config.reduceMotion;
  }

  // Check if screen reader is enabled
  isScreenReaderEnabled(): boolean {
    return this.config.screenReaderEnabled;
  }

  // Get accessibility labels for components
  getAccessibilityLabels() {
    return {
      // Common labels
      loading: 'Loading, please wait',
      error: 'Error occurred',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      share: 'Share',
      download: 'Download',
      refresh: 'Refresh',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      next: 'Next',
      previous: 'Previous',
      back: 'Back',
      home: 'Home',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      
      // Health related labels
      heartRate: 'Heart rate',
      bloodPressure: 'Blood pressure',
      bloodOxygen: 'Blood oxygen',
      sleepQuality: 'Sleep quality',
      stressLevel: 'Stress level',
      activityLevel: 'Activity level',
      nutrition: 'Nutrition',
      fitness: 'Fitness',
      weight: 'Weight',
      calories: 'Calories',
      
      // Premium features
      premiumDashboard: 'Premium dashboard',
      realTimeMonitoring: 'Real-time monitoring',
      predictiveAnalytics: 'Predictive analytics',
      healthcareIntegration: 'Healthcare integration',
      professionalReports: 'Professional reports',
      dataVisualization: 'Data visualization',
      
      // Actions
      startMonitoring: 'Start monitoring',
      stopMonitoring: 'Stop monitoring',
      connectDevice: 'Connect device',
      disconnectDevice: 'Disconnect device',
      generateReport: 'Generate report',
      viewReport: 'View report',
      shareData: 'Share data',
      revokeAccess: 'Revoke access',
      grantAccess: 'Grant access',
      
      // Status
      online: 'Online',
      offline: 'Offline',
      connected: 'Connected',
      disconnected: 'Disconnected',
      active: 'Active',
      inactive: 'Inactive',
      available: 'Available',
      unavailable: 'Unavailable',
      normal: 'Normal',
      warning: 'Warning',
      critical: 'Critical',
    };
  }

  // Get accessibility hints
  getAccessibilityHints() {
    return {
      // Common hints
      doubleTapToActivate: 'Double tap to activate',
      swipeToRefresh: 'Swipe down to refresh',
      pullToRefresh: 'Pull down to refresh',
      pinchToZoom: 'Pinch to zoom',
      doubleTapToZoom: 'Double tap to zoom',
      longPressToOpenMenu: 'Long press to open menu',
      
      // Health related hints
      tapToViewDetails: 'Tap to view details',
      swipeToNavigate: 'Swipe to navigate between sections',
      pinchToZoomChart: 'Pinch to zoom chart',
      doubleTapToReset: 'Double tap to reset view',
      
      // Premium features
      tapToViewAnalytics: 'Tap to view analytics',
      swipeToChangeTimeRange: 'Swipe to change time range',
      pinchToZoomVisualization: 'Pinch to zoom visualization',
      doubleTapToExpand: 'Double tap to expand',
      
      // Device related
      tapToConnect: 'Tap to connect device',
      swipeToDisconnect: 'Swipe to disconnect device',
      longPressToSettings: 'Long press to open device settings',
    };
  }

  // Get accessibility roles
  getAccessibilityRoles() {
    return {
      button: 'button',
      link: 'link',
      search: 'search',
      image: 'image',
      keyboardKey: 'keyboardkey',
      text: 'text',
      adjustable: 'adjustable',
      header: 'header',
      summary: 'summary',
      alert: 'alert',
      status: 'status',
      timer: 'timer',
    };
  }

  // Generate accessibility props for components
  generateAccessibilityProps(
    label?: string,
    hint?: string,
    role?: string,
    accessibilityState?: any
  ) {
    const labels = this.getAccessibilityLabels();
    const hints = this.getAccessibilityHints();
    const roles = this.getAccessibilityRoles();

    return {
      accessible: true,
      accessibilityLabel: label || '',
      accessibilityHint: hint || '',
      accessibilityRole: role || '',
      accessibilityState: accessibilityState || {},
      accessibilityLiveRegion: this.config.screenReaderEnabled ? 'polite' : 'none',
    };
  }

  // Generate accessibility props for interactive elements
  generateInteractiveAccessibilityProps(
    label: string,
    hint?: string,
    state?: any
  ) {
    return this.generateAccessibilityProps(
      label,
      hint,
      'button',
      state
    );
  }

  // Generate accessibility props for text elements
  generateTextAccessibilityProps(
    label?: string,
    hint?: string
  ) {
    return this.generateAccessibilityProps(
      label,
      hint,
      'text'
    );
  }

  // Generate accessibility props for images
  generateImageAccessibilityProps(
    label?: string,
    hint?: string
  ) {
    return this.generateAccessibilityProps(
      label,
      hint,
      'image'
    );
  }

  // Clean up
  destroy() {
    // Note: React Native's AccessibilityInfo doesn't have removeEventListener in all versions
    // We'll keep the listeners for cleanup but won't attempt to remove them
    this.listeners.clear();
  }
}

// Singleton instance
const accessibilityService = new AccessibilityService();

export default accessibilityService;