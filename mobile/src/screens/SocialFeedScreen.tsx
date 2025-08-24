import React, { useState, useEffect, useRef } from 'react';
import { Platform, Alert, Share } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
  Animated,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import socialService, {
  SocialFeature,
  CreatePostRequest,
  FeedRequest,
  FeedResponse,
  CreateCommentRequest,
  LikePostRequest,
  FollowUserRequest,
  GetNotificationsRequest,
  GetNotificationsResponse,
  SocialPost,
  SocialNotification,
  User,
} from '../types/social';
import i18n from '../i18n';

type PostCardProps = {
  post: SocialPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
  onProfile: (userId: string) => void;
};

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onFollow, onProfile }) => {
  const { colors } = useTheme();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const handleLike = async () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      const request: LikePostRequest = {
        userId: post.userId,
        postId: post.id,
        type: newLikedState ? 'like' : 'unlike',
      };
      
      await socialService.likePost(request);
    } catch (error) {
      console.error('Like error:', error);
      setLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      const request: CreateCommentRequest = {
        userId: post.userId,
        postId: post.id,
        content: commentText.trim(),
      };
      
      await socialService.createComment(request);
      setCommentsCount(prev => prev + 1);
      setCommentText('');
      setShowComments(true);
    } catch (error) {
      console.error('Comment error:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.content,
        title: post.user.firstName + ' shared a post',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const request: FollowUserRequest = {
        userId: post.userId,
        targetUserId: post.user.id,
        action: 'follow',
      };
      
      await socialService.followUser(request);
      onFollow(post.user.id);
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;
    
    return (
      <View style={styles.imagesContainer}>
        {post.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={[
              styles.postImage,
              post.images?.length === 1 && styles.singleImage,
              post.images?.length === 2 && styles.doubleImage,
              (post.images?.length || 0) >= 3 && styles.multipleImage,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderMeal = () => {
    if (!post.meal) return null;
    
    return (
      <View style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.mealHeader}>
          <Image
            source={{ uri: post.meal.imageUrl || 'https://via.placeholder.com/60' }}
            style={styles.mealImage}
          />
          <View style={styles.mealInfo}>
            <Text style={[styles.mealName, { color: colors.text }]}>
              {post.meal.name}
            </Text>
            <Text style={[styles.mealStats, { color: colors.gray }]}>
              {post.meal.nutrition.calories} cal • P: {post.meal.nutrition.protein}g • C: {post.meal.nutrition.carbohydrates}g • F: {post.meal.nutrition.fat}g
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWorkout = () => {
    if (!post.workout) return null;
    
    return (
      <View style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.workoutHeader}>
          <View style={[styles.workoutIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="fitness" size={24} color="#10B981" />
          </View>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: colors.text }]}>
              {post.workout.name}
            </Text>
            <Text style={[styles.workoutStats, { color: colors.gray }]}>
              {post.workout.duration} min • {post.workout.calories} cal • {post.workout.type}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderComments = () => {
    if (!showComments) return null;
    
    return (
      <View style={styles.commentsContainer}>
        <View style={styles.commentsHeader}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            Comments ({commentsCount})
          </Text>
          <TouchableOpacity onPress={() => setShowComments(false)}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.commentInput}>
          <TextInput
            style={[styles.commentTextInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.commentButton, { backgroundColor: colors.primary }]}
            onPress={handleComment}
            disabled={isCommenting}
          >
            {isCommenting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.commentButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onProfile(post.user.id)}>
          <Image
            source={{ uri: post.user.avatar || 'https://via.placeholder.com/40' }}
            style={styles.userAvatar}
          />
        </TouchableOpacity>
        <View style={styles.postUserInfo}>
          <TouchableOpacity onPress={() => onProfile(post.user.id)}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {post.user.firstName} {post.user.lastName}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.postTime, { color: colors.gray }]}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={[styles.postContent, { color: colors.text }]}>
        {post.content}
      </Text>

      {/* Post Images */}
      {renderImages()}

      {/* Meal/Workout Cards */}
      {renderMeal()}
      {renderWorkout()}

      {/* Post Footer */}
      <View style={styles.postFooter}>
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, liked && styles.likedButton]}
            onPress={handleLike}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#EF4444' : colors.text}
            />
            <Text style={[styles.actionText, liked && styles.likedText]}>
              {likesCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>
              {commentsCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>
              {post.shares}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onFollow(post.user.id)}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>
              Follow
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.postStats}>
          <Text style={[styles.statText, { color: colors.text }]}>
            {post.engagement.likes} likes • {post.engagement.comments} comments
          </Text>
        </View>
      </View>

      {/* Comments Section */}
      {renderComments()}
    </View>
  );
};

export default function SocialFeedScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'timeline' | 'discover' | 'trending' | 'following'>('timeline');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFeed();
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check notifications every 30 seconds
    
    return () => clearInterval(interval);
  }, [feedType, user?.id]);

  useEffect(() => {
    if (posts.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [posts]);

  const loadFeed = async () => {
    if (!hasMore && !isRefreshing) return;
    
    setIsLoading(true);
    try {
      const request: FeedRequest = {
        userId: user?.id || '',
        feedType,
        limit,
        offset,
        sortBy: 'latest',
      };
      
      const response = await socialService.getFeed(request);
      
      if (response.success && response.data) {
        const newPosts = response.data.posts;
        setPosts(prev => offset === 0 ? newPosts : [...prev, ...newPosts]);
        setHasMore(response.data.pagination.hasMore);
        setOffset(response.data.pagination.nextOffset);
      }
    } catch (error) {
      console.error('Feed loading error:', error);
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const request: GetNotificationsRequest = {
        userId: user?.id || '',
        limit: 5,
        offset: 0,
        unreadOnly: true,
      };
      
      const response = await socialService.getNotifications(request);
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Notifications loading error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setOffset(0);
    setHasMore(true);
    await loadFeed();
  };

  const handleLoadMore = async () => {
    if (!isLoading && hasMore) {
      await loadFeed();
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Content Required', 'Please write something to post.');
      return;
    }

    setIsCreatingPost(true);
    try {
      const request: CreatePostRequest = {
        userId: user?.id || '',
        content: postContent.trim(),
        privacy: 'public',
      };
      
      const response = await socialService.createPost(request);
      
      if (response.success) {
        setPostContent('');
        setShowCreatePost(false);
        // Refresh feed to show new post
        setOffset(0);
        setHasMore(true);
        await loadFeed();
      } else {
        Alert.alert('Error', 'Failed to create post');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLike = (postId: string) => {
    // Update local state
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    // Navigate to post details or show comment modal
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    // Share functionality
    console.log('Share post:', postId);
  };

  const handleFollow = (userId: string) => {
    // Update local state
    setPosts(prev => prev.map(post => 
      post.user.id === userId 
        ? { ...post, user: { ...post.user, stats: { ...post.user.stats, followers: post.user.stats.followers + 1 } } }
        : post
    ));
  };

  const handleProfile = (userId: string) => {
    // Navigate to user profile
    console.log('Navigate to profile:', userId);
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onFollow={handleFollow}
      onProfile={handleProfile}
    />
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Social Feed
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.notificationButton, { position: 'relative' }]}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => setShowCreatePost(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.feedTabs}>
        {(['timeline', 'discover', 'trending', 'following'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.feedTab,
              feedType === type && { borderBottomWidth: 2, borderBottomColor: colors.primary }
            ]}
            onPress={() => setFeedType(type)}
          >
            <Text style={[
              styles.feedTabText,
              feedType === type && { color: colors.primary }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {renderHeader()}

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.notificationsContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.notificationsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.notificationsTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <View style={[styles.notificationItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, { color: colors.text }]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.gray }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {!item.isRead && (
                  <View style={styles.notificationUnread} />
                )}
              </View>
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No notifications
              </Text>
            }
          />
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.createPostContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.createPostHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.createPostTitle, { color: colors.text }]}>
              Create Post
            </Text>
            <View style={styles.createPostActions}>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <Text style={[styles.cancelButton, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postButton, { backgroundColor: colors.primary }]}
                onPress={handleCreatePost}
                disabled={isCreatingPost}
              >
                {isCreatingPost ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.createPostContent}>
            <View style={styles.createPostUser}>
              <Image
                source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
                style={styles.createPostAvatar}
              />
              <Text style={[styles.createPostUserName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            
            <TextInput
              style={[styles.createPostInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="What's on your mind?"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.createPostAction}>
                <Ionicons name="image-outline" size={20} color={colors.text} />
                <Text style={[styles.createPostActionText, { color: colors.text }]}>
                  Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.createPostAction}>
                <Ionicons name="restaurant-outline" size={20} color={colors.text} />
                <Text style={[styles.createPostActionText, { color: colors.text }]}>
                  Meal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.createPostAction}>
                <Ionicons name="fitness-outline" size={20} color={colors.text} />
                <Text style={[styles.createPostActionText, { color: colors.text }]}>
                  Workout
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.createPostAction}>
                <Ionicons name="location-outline" size={20} color={colors.text} />
                <Text style={[styles.createPostActionText, { color: colors.text }]}>
                  Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  feedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  feedTabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  postCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  singleImage: {
    width: '100%',
    height: 200,
  },
  doubleImage: {
    flex: 1,
  },
  multipleImage: {
    width: 100,
    height: 100,
  },
  mealCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  workoutCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  workoutStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  postFooter: {
    marginTop: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  likedButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  likedText: {
    color: '#EF4444',
  },
  postStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  commentsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentTextInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    minHeight: 40,
  },
  commentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  commentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  notificationsContainer: {
    flex: 1,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  notificationUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 12,
  },
  createPostContainer: {
    flex: 1,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  createPostTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createPostActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createPostContent: {
    flex: 1,
    padding: 16,
  },
  createPostUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  createPostUserName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  createPostInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 100,
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  createPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  createPostActionText: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontFamily: 'Inter-Regular',
  },
});