// Social Types for Social Service

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  stats: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
    achievements: number;
  };
  preferences: {
    privacy: 'public' | 'friends' | 'private';
    notifications: {
      likes: boolean;
      comments: boolean;
      follows: boolean;
      groups: boolean;
      challenges: boolean;
      achievements: boolean;
    };
    sharing: {
      facebook: boolean;
      twitter: boolean;
      instagram: boolean;
      whatsapp: boolean;
    };
  };
  badges: string[];
  level: number;
  points: number;
  joinedAt: Date;
  lastActiveAt: Date;
  isVerified: boolean;
  isPremium: boolean;
}

export interface SocialPost {
  id: string;
  userId: string;
  user: User;
  content: string;
  images?: string[];
  videos?: string[];
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  meal?: {
    id: string;
    name: string;
    nutrition: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
    };
    imageUrl?: string;
  };
  workout?: {
    id: string;
    name: string;
    duration: number;
    calories: number;
    type: string;
    imageUrl?: string;
  };
  privacy: 'public' | 'friends' | 'private';
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  hashtags: string[];
  mentions: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
  };
  analytics: {
    views: number;
    clickThroughRate: number;
    engagementRate: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  postId: string;
  content: string;
  images?: string[];
  parentCommentId?: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies: Comment[];
  mentions: string[];
  hashtags: string[];
}

export interface Like {
  id: string;
  userId: string;
  user: User;
  postId?: string;
  commentId?: string;
  createdAt: Date;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

export interface Follow {
  id: string;
  followerId: string;
  follower: User;
  followingId: string;
  following: User;
  createdAt: Date;
  mutual: boolean;
  status: 'active' | 'pending' | 'blocked';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxMembers: number;
  currentMembers: number;
  tags: string[];
  rules: string[];
  adminIds: string[];
  memberIds: string[];
  settings: {
    allowPosts: boolean;
    allowComments: boolean;
    allowLikes: boolean;
    allowInvites: boolean;
    requireApproval: boolean;
    allowMedia: boolean;
    allowChallenges: boolean;
  };
  coverImage?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  stats: {
    posts: number;
    comments: number;
    likes: number;
    challenges: number;
  };
  userStatus: 'admin' | 'member' | 'pending' | 'banned';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'nutrition' | 'fitness' | 'wellness' | 'lifestyle';
  duration: number; // days
  goals: Array<{
    type: 'calories' | 'steps' | 'workouts' | 'water' | 'sleep' | 'weight';
    target: number;
    unit: string;
  }>;
  rules: string[];
  rewards: Array<{
    type: 'badge' | 'title' | 'privilege' | 'custom';
    value: string;
    description: string;
    icon?: string;
  }>;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean;
  entryFee?: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  adminId: string;
  admin: User;
  participants: Array<{
    userId: string;
    user: User;
    progress: Array<{
      type: string;
      current: number;
      target: number;
      progress: number;
    }>;
    joinedAt: Date;
    lastActivity: Date;
    rank: number;
    points: number;
  }>;
  stats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    averageCompletion: number;
  };
  userStatus: 'joined' | 'not_joined' | 'completed' | 'failed';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'nutrition' | 'fitness' | 'wellness' | 'social' | 'milestone';
  category: string;
  icon: string;
  color: string;
  points: number;
  level: number;
  requirements: Array<{
    type: string;
    target: number;
    unit: string;
    description: string;
  }>;
  rewards: Array<{
    type: 'badge' | 'title' | 'privilege' | 'custom';
    value: string;
    description: string;
  }>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  stats: {
    totalUnlocks: number;
    averageTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  shareable: boolean;
  featured: boolean;
  tags: string[];
}

export interface SocialActivity {
  id: string;
  userId: string;
  user: User;
  type: 'post' | 'like' | 'comment' | 'follow' | 'join' | 'complete' | 'achievement';
  targetId: string;
  target?: {
    type: string;
    data: any;
  };
  content?: string;
  createdAt: Date;
  visibility: 'public' | 'friends' | 'private';
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  metadata?: {
    device: string;
    platform: string;
    version: string;
  };
}

export interface SocialNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'group' | 'challenge' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: {
    postId?: string;
    commentId?: string;
    userId?: string;
    groupId?: string;
    challengeId?: string;
    achievementId?: string;
  };
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high';
  action?: {
    type: 'navigate' | 'deep_link' | 'web_url';
    url?: string;
    screen?: string;
    params?: any;
  };
  metadata?: {
    image?: string;
    video?: string;
    audio?: string;
    document?: string;
  };
}

export interface SocialMessage {
  id: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  content: string;
  images?: string[];
  videos?: string[];
  documents?: string[];
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: 'text' | 'image' | 'video' | 'document' | 'voice';
  metadata?: {
    duration?: number;
    size?: number;
    format?: string;
  };
}

export interface SocialConversation {
  id: string;
  participants: Array<{
    userId: string;
    user: User;
    lastReadAt: Date;
  }>;
  messages: SocialMessage[];
  lastMessage: SocialMessage;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    notifications: boolean;
    readReceipts: boolean;
    mediaSharing: boolean;
    messageRetention: number; // days
  };
}

export interface SocialStats {
  userId: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalFollowing: number;
  totalGroups: number;
  totalChallenges: number;
  totalAchievements: number;
  totalPoints: number;
  level: number;
  rank: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  topContent: Array<{
    type: 'post' | 'comment';
    id: string;
    engagement: number;
    reach: number;
  }>;
  trendingTopics: Array<{
    topic: string;
    mentions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  weeklyActivity: Array<{
    day: string;
    posts: number;
    likes: number;
    comments: number;
    follows: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    followers: number;
    posts: number;
    engagement: number;
  }>;
}

export interface SocialInsight {
  id: string;
  userId: string;
  type: 'engagement' | 'content' | 'audience' | 'performance' | 'trends';
  title: string;
  description: string;
  data: any;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  timeframe: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface SocialTrend {
  id: string;
  topic: string;
  type: 'hashtag' | 'challenge' | 'user' | 'content';
  mentions: number;
  growth: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: number;
  reach: number;
  participants: number;
  timeframe: string;
  topUsers: Array<{
    user: User;
    engagement: number;
  }>;
  relatedTopics: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface SocialEvent {
  id: string;
  title: string;
  description: string;
  type: 'live' | 'scheduled' | 'completed';
  startTime: Date;
  endTime: Date;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  isVirtual: boolean;
  virtualUrl?: string;
  maxParticipants?: number;
  currentParticipants: number;
  tags: string[];
  coverImage?: string;
  organizer: User;
  participants: Array<{
    userId: string;
    user: User;
    joinedAt: Date;
    status: 'going' | 'interested' | 'not_going';
  }>;
  settings: {
    isPublic: boolean;
    requiresApproval: boolean;
    allowsInvites: boolean;
    allowsComments: boolean;
    allowsMedia: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  userStatus: 'going' | 'interested' | 'not_going' | 'organizer';
}

export interface SocialStory {
  id: string;
  userId: string;
  user: User;
  content: {
    type: 'image' | 'video';
    url: string;
    duration?: number;
    text?: string;
    stickers?: Array<{
      type: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
    }>;
    mentions?: string[];
    hashtags?: string[];
    location?: {
      latitude: number;
      longitude: number;
      name: string;
    };
  };
  views: number;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  privacy: 'public' | 'friends' | 'private';
}

export interface SocialAnalytics {
  userId: string;
  timeframe: string;
  overview: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers: number;
    totalFollowing: number;
    engagementRate: number;
    reach: number;
    impressions: number;
  };
  content: {
    topPosts: Array<{
      id: string;
      content: string;
      likes: number;
      comments: number;
      shares: number;
      reach: number;
      engagementRate: number;
    }>;
    bestPerforming: Array<{
      type: string;
      performance: number;
      count: number;
    }>;
    worstPerforming: Array<{
      type: string;
      performance: number;
      count: number;
    }>;
  };
  audience: {
    demographics: {
      age: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
      gender: Array<{
        type: string;
        count: number;
        percentage: number;
      }>;
      location: Array<{
        country: string;
        count: number;
        percentage: number;
      }>;
    };
    interests: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    activity: Array<{
      day: string;
      posts: number;
      likes: number;
      comments: number;
      follows: number;
    }>;
  };
  engagement: {
    likes: Array<{
      date: string;
      count: number;
    }>;
    comments: Array<{
      date: string;
      count: number;
    }>;
    shares: Array<{
      date: string;
      count: number;
    }>;
    follows: Array<{
      date: string;
      count: number;
    }>;
  };
  growth: {
    followers: Array<{
      date: string;
      count: number;
    }>;
    posts: Array<{
      date: string;
      count: number;
    }>;
    engagement: Array<{
      date: string;
      rate: number;
    }>;
  };
}

export interface SocialReport {
  id: string;
  userId: string;
  type: 'post' | 'user' | 'comment' | 'group' | 'challenge';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    evidence?: string[];
    severity: 'low' | 'medium' | 'high';
    category: string;
  };
}

export interface SocialModeration {
  id: string;
  action: 'warning' | 'suspension' | 'ban' | 'content_removal' | 'restriction';
  userId: string;
  user: User;
  reason: string;
  description: string;
  duration?: number; // hours for suspension
  moderatorId: string;
  moderator: User;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: {
    violationType: string;
    severity: 'low' | 'medium' | 'high';
    previousViolations: number;
    evidence?: string[];
  };
}

export interface SocialSettings {
  userId: string;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    postVisibility: 'public' | 'friends' | 'private';
    activityVisibility: 'public' | 'friends' | 'private';
    locationVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    readReceipts: boolean;
  };
  notifications: {
    email: {
      likes: boolean;
      comments: boolean;
      follows: boolean;
      mentions: boolean;
      messages: boolean;
      groups: boolean;
      challenges: boolean;
      achievements: boolean;
      system: boolean;
    };
    push: {
      likes: boolean;
      comments: boolean;
      follows: boolean;
      mentions: boolean;
      messages: boolean;
      groups: boolean;
      challenges: boolean;
      achievements: boolean;
      system: boolean;
    };
    sms: {
      alerts: boolean;
      reminders: boolean;
      updates: boolean;
    };
  };
  content: {
    autoSave: boolean;
    backup: boolean;
    quality: 'low' | 'medium' | 'high';
    format: 'jpg' | 'png' | 'mp4' | 'mov';
    retention: number; // days
  };
  sharing: {
    autoShare: boolean;
    platforms: {
      facebook: boolean;
      twitter: boolean;
      instagram: boolean;
      whatsapp: boolean;
      linkedin: boolean;
      tiktok: boolean;
    };
    defaultPrivacy: 'public' | 'friends' | 'private';
  };
  security: {
    twoFactor: boolean;
    loginAlerts: boolean;
    suspiciousActivity: boolean;
    dataRetention: number; // days
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    animations: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
  };
}