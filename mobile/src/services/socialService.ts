import { 
  User, 
  SocialPost, 
  Comment, 
  Like, 
  Follow, 
  Group, 
  Challenge,
  Achievement,
  SocialActivity,
  SocialNotification
} from '../types/social';

// Social Service Types
export type SocialFeature = 'feed' | 'groups' | 'challenges' | 'achievements' | 'notifications' | 'messaging';

export type SocialRequest = {
  feature: SocialFeature;
  userId: string;
  data: any;
  context?: any;
};

export type SocialResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    version: string;
  };
};

export type CreatePostRequest = {
  userId: string;
  content: string;
  images?: string[];
  videos?: string[];
  tags?: string[];
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
  };
  workout?: {
    id: string;
    name: string;
    duration: number;
    calories: number;
    type: string;
  };
  privacy: 'public' | 'friends' | 'private';
  scheduledAt?: Date;
};

export type CreatePostResponse = {
  post: SocialPost;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  reach: number;
  timeline: Date;
};

export type FeedRequest = {
  userId: string;
  feedType: 'timeline' | 'discover' | 'trending' | 'following';
  limit: number;
  offset: number;
  filters?: {
    tags?: string[];
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    timeRange?: {
      start: Date;
      end: Date;
    };
    contentType?: 'meal' | 'workout' | 'achievement' | 'general';
  };
  sortBy?: 'latest' | 'popular' | 'engaging' | 'relevant';
};

export type FeedResponse = {
  posts: SocialPost[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  trending: {
    tags: Array<{
      tag: string;
      count: number;
      trend: 'rising' | 'stable' | 'falling';
    }>;
    users: Array<{
      user: User;
      engagement: number;
    }>;
  };
};

export type CreateGroupRequest = {
  name: string;
  description: string;
  isPrivate: boolean;
  maxMembers: number;
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
  };
};

export type CreateGroupResponse = {
  group: Group;
  members: User[];
  admin: User;
  settings: Group['settings'];
};

export type JoinGroupRequest = {
  userId: string;
  groupId: string;
  message?: string;
};

export type JoinGroupResponse = {
  success: boolean;
  group: Group;
  status: 'approved' | 'pending' | 'rejected';
  message?: string;
};

export type CreateChallengeRequest = {
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
  }>;
  maxParticipants: number;
  isPrivate: boolean;
  entryFee?: number;
  startDate: Date;
  endDate: Date;
};

export type CreateChallengeResponse = {
  challenge: Challenge;
  participants: User[];
  rewards: Challenge['rewards'];
  status: 'active' | 'upcoming' | 'completed';
};

export type JoinChallengeRequest = {
  userId: string;
  challengeId: string;
  goals?: Array<{
    type: string;
    target: number;
    unit: string;
  }>;
};

export type JoinChallengeResponse = {
  success: boolean;
  challenge: Challenge;
  userProgress: Array<{
    type: string;
    current: number;
    target: number;
    progress: number;
  }>;
  estimatedCompletion: Date;
};

export type CreateCommentRequest = {
  userId: string;
  postId: string;
  content: string;
  parentCommentId?: string;
  images?: string[];
};

export type CreateCommentResponse = {
  comment: Comment;
  post: SocialPost;
  engagement: {
    likes: number;
    comments: number;
  };
};

export type LikePostRequest = {
  userId: string;
  postId: string;
  type: 'like' | 'unlike';
};

export type LikePostResponse = {
  success: boolean;
  post: SocialPost;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  userAction: 'liked' | 'unliked';
};

export type FollowUserRequest = {
  userId: string;
  targetUserId: string;
  action: 'follow' | 'unfollow';
};

export type FollowUserResponse = {
  success: boolean;
  follower: User;
  following: User;
  status: 'following' | 'unfollowing';
  mutual: boolean;
};

export type GetNotificationsRequest = {
  userId: string;
  limit: number;
  offset: number;
  types?: Array<'like' | 'comment' | 'follow' | 'group' | 'challenge' | 'achievement' | 'system'>;
  unreadOnly?: boolean;
};

export type GetNotificationsResponse = {
  notifications: SocialNotification[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  unreadCount: number;
};

export type MarkNotificationReadRequest = {
  userId: string;
  notificationIds: string[];
};

export type MarkNotificationReadResponse = {
  success: boolean;
  readCount: number;
  unreadCount: number;
};

export type GetAchievementsRequest = {
  userId: string;
  type?: 'all' | 'nutrition' | 'fitness' | 'wellness' | 'social' | 'milestones';
  limit: number;
  offset: number;
};

export type GetAchievementsResponse = {
  achievements: Achievement[];
  userStats: {
    totalPoints: number;
    level: number;
    rank: number;
    nextLevelPoints: number;
  };
  recentMilestones: Array<{
    type: string;
    title: string;
    description: string;
    date: Date;
  }>;
};

export type ShareAchievementRequest = {
  userId: string;
  achievementId: string;
  message?: string;
  platforms?: Array<'facebook' | 'twitter' | 'instagram' | 'whatsapp'>;
};

export type ShareAchievementResponse = {
  success: boolean;
  achievement: Achievement;
  shares: Array<{
    platform: string;
    url: string;
    timestamp: Date;
  }>;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
};

export class SocialService {
  private isInitialized: boolean = false;
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Initialize the social service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      if (!this.apiEndpoint || !this.apiKey) {
        throw new Error('Social service configuration is incomplete');
      }

      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('Social service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize social service:', error);
      throw error;
    }
  }

  /**
   * Test connection to social service
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Social service health check failed: ${response.status}`);
      }

      const health = await response.json();
      console.log('Social service health:', health);
    } catch (error) {
      throw new Error(`Failed to connect to social service: ${error}`);
    }
  }

  /**
   * Create a social post
   */
  async createPost(request: CreatePostRequest): Promise<SocialResponse<CreatePostResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Post creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.post,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Post creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get social feed
   */
  async getFeed(request: FeedRequest): Promise<SocialResponse<FeedResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/feed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Feed retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.feed,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Feed retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Create a group
   */
  async createGroup(request: CreateGroupRequest): Promise<SocialResponse<CreateGroupResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Group creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.group,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Group creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Join a group
   */
  async joinGroup(request: JoinGroupRequest): Promise<SocialResponse<JoinGroupResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/groups/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Group join failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.group,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Group join error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Create a challenge
   */
  async createChallenge(request: CreateChallengeRequest): Promise<SocialResponse<CreateChallengeResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/challenges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Challenge creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.challenge,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Challenge creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(request: JoinChallengeRequest): Promise<SocialResponse<JoinChallengeResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/challenges/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Challenge join failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.challenge,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Challenge join error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Create a comment
   */
  async createComment(request: CreateCommentRequest): Promise<SocialResponse<CreateCommentResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Comment creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.comment,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Comment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Like/unlike a post
   */
  async likePost(request: LikePostRequest): Promise<SocialResponse<LikePostResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/posts/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Like action failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.post,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Like action error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Follow/unfollow a user
   */
  async followUser(request: FollowUserRequest): Promise<SocialResponse<FollowUserResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Follow action failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.user,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Follow action error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(request: GetNotificationsRequest): Promise<SocialResponse<GetNotificationsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Notifications retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.notifications,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Notifications retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(request: MarkNotificationReadRequest): Promise<SocialResponse<MarkNotificationReadResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Mark notifications read failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.notifications,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Mark notifications read error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get achievements
   */
  async getAchievements(request: GetAchievementsRequest): Promise<SocialResponse<GetAchievementsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/achievements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Achievements retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.achievements,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Achievements retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Share an achievement
   */
  async shareAchievement(request: ShareAchievementRequest): Promise<SocialResponse<ShareAchievementResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/social/achievements/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Achievement share failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.achievement,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Achievement share error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get social service status
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const status = await response.json();
      return {
        status: status.status,
        uptime: status.uptime,
        responseTime: status.responseTime,
        errorRate: status.errorRate,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get social feature availability
   */
  getFeatureAvailability(): Record<SocialFeature, boolean> {
    return {
      feed: true,
      groups: true,
      challenges: true,
      achievements: true,
      notifications: true,
      messaging: true,
    };
  }

  /**
   * Cleanup social service
   */
  async cleanup(): Promise<void> {
    try {
      // Clear any cached data
      this.isInitialized = false;
      console.log('Social service cleaned up');
    } catch (error) {
      console.error('Error cleaning up social service:', error);
    }
  }
}

// Export singleton instance
export const socialService = new SocialService(
  process.env.SOCIAL_API_ENDPOINT || 'https://api.social.example.com/v1',
  process.env.SOCIAL_API_KEY || ''
);
export default socialService;