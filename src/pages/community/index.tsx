import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/layout/AppLayout';
import GlassCard from '../../components/ui/GlassCard';
import { HiUserGroup, HiChat, HiTrendingUp, HiHeart, HiShare, HiThumbUp, HiLightBulb, HiAcademicCap, HiClock, HiPhotograph, HiVideoCamera, HiMicrophone, HiCheck } from 'react-icons/hi';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import ThemeSelector from '@/components/ThemeSelector';
import { 
  Post, 
  Comment, 
  Event, 
  TopUser, 
  fetchPosts, 
  createPost, 
  uploadMedia, 
  likePost, 
  unlikePost, 
  fetchComments, 
  addComment, 
  fetchEvents, 
  joinEvent, 
  leaveEvent, 
  fetchTopContributors, 
  sharePost 
} from '@/lib/communityService';

export default function Community() {
  const { themeColor } = useTheme();
  const [activeTab, setActiveTab] = useState('trending');
  const [posts, setPosts] = useState<Post[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    role: string;
    photoUrl?: string;
  }>({
    full_name: 'Anonymous',
    role: 'Member'
  });

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  // Get user profile photo URL
  const getUserProfilePhotoUrl = async (userId: string) => {
    try {
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/profile.jpg`);
        
      return data?.publicUrl || undefined;
    } catch (error) {
      console.error("Error getting profile photo URL:", error);
      return undefined;
    }
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error("No user logged in");
          return;
        }
        
        setUserId(user.id);
        
        // Get user profile
        const profileData = await fetchUserProfile(user.id);
        const photoUrl = await getUserProfilePhotoUrl(user.id);
        
        if (profileData) {
          setUserProfile({
            full_name: profileData.full_name || 'Anonymous',
            role: profileData.role || 'Member',
            photoUrl
          });
        }
        
        // Fetch posts, top users, and events
        const postsData = await fetchPosts(user.id);
        const topContributorsData = await fetchTopContributors(4);
        const eventsData = await fetchEvents(user.id);
        
        setPosts(postsData as Post[]);
        setTopUsers(topContributorsData);
        setEvents(eventsData as Event[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle media selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      setMediaType(type);
      
      // Create preview for images
      if (type === 'image') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    }
  };

  // Create a new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;
    if (!userId) return;
    
    setIsPosting(true);
    
    try {
      let mediaUrl: string | undefined;
      
      // Upload media if selected
      if (selectedMedia && mediaType) {
        const uploadedUrl = await uploadMedia(selectedMedia, userId);
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
        }
      }
      
      // Create post
      const postType: 'tip' | 'achievement' | 'milestone' = 'tip';
      const newPost = await createPost(userId, newPostContent, mediaUrl, mediaType || undefined, postType);
      
      if (newPost) {
        // Add new post to state
        setPosts(prevPosts => [newPost, ...prevPosts] as Post[]);
        
        // Clear form
        setNewPostContent('');
        setSelectedMedia(null);
        setMediaType(null);
        setMediaPreview(null);
      }
    } catch (error) {
      console.error("Error in handleCreatePost:", error);
    } finally {
      setIsPosting(false);
    }
  };

  // Like a post
  const handleLikePost = async (postId: string) => {
    if (!userId) return;
    
    try {
      // Find the post
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex === -1) return;
      
      const post = posts[postIndex];
      const isCurrentlyLiked = post.isLiked || false;
      
      // Update post in state first for immediate feedback
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1,
              isLiked: !isCurrentlyLiked
            } as Post;
          }
          return p;
        })
      );
      
      // Update like in database
      if (isCurrentlyLiked) {
        await unlikePost(userId, postId);
      } else {
        await likePost(userId, postId);
      }
    } catch (error) {
      console.error("Error in handleLikePost:", error);
    }
  };

  // Share a post
  const handleSharePost = async (postId: string) => {
    try {
      // Update shares count in state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, shares: post.shares + 1 } as Post;
          }
          return post;
        })
      );
      
      // Update shares in Supabase
      await sharePost(postId);
    } catch (error) {
      console.error("Error in handleSharePost:", error);
    }
  };

  // Toggle comments visibility
  const toggleComments = async (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      
      // Fetch comments for this post
      try {
        const commentsData = await fetchComments(postId);
        setComments(commentsData as Comment[]);
      } catch (error) {
        console.error("Error in toggleComments:", error);
      }
    }
  };

  // Add a comment
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !userId) return;
    
    setIsSubmittingComment(true);
    
    try {
      // Add comment
      const comment = await addComment(userId, postId, newComment);
      
      if (comment) {
        // Get user info for the comment
        const { data: userData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userId)
          .single();
        
        const commentWithUser: Comment = {
          ...comment,
          user_name: userData?.username || 'Anonymous',
          user_avatar: userData?.avatar_url || '',
        };
        
        // Add comment to state
        setComments(prevComments => [...prevComments, commentWithUser] as Comment[]);
        
        // Update comment count on post
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return { ...post, comments: post.comments + 1 } as Post;
            }
            return post;
          })
        );
        
        // Clear comment input
        setNewComment('');
      }
    } catch (error) {
      console.error("Error in handleAddComment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Join an event
  const handleJoinEvent = async (eventId: string) => {
    if (!userId) return;
    
    try {
      // Find the event
      const eventIndex = events.findIndex(event => event.id === eventId);
      if (eventIndex === -1) return;
      
      const event = events[eventIndex];
      const isCurrentlyJoined = event.isJoined || false;
      
      // Update event in state
      setEvents(prevEvents => 
        prevEvents.map(e => {
          if (e.id === eventId) {
            return { 
              ...e, 
              isJoined: !isCurrentlyJoined,
              participants: isCurrentlyJoined ? e.participants - 1 : e.participants + 1 
            } as Event;
          }
          return e;
        })
      );
      
      // Update in database
      if (isCurrentlyJoined) {
        await leaveEvent(userId, eventId);
      } else {
        await joinEvent(userId, eventId);
      }
    } catch (error) {
      console.error("Error in handleJoinEvent:", error);
    }
  };

  return (
    <AppLayout title="Community">
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Create Post */}
          <GlassCard className="p-6 mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl overflow-hidden">
                {userId && userProfile.photoUrl ? (
                  <img 
                    src={userProfile.photoUrl}
                    alt="Your profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.textContent = '👤';
                      }
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <span className="text-white font-medium">{userProfile.full_name}</span>
                  <span className="text-white/60 text-sm ml-2">{userProfile.role}</span>
                </div>
                <textarea
                  placeholder="Share your thoughts, achievements, or ask for advice..."
                  className="w-full h-24 bg-white/5 rounded-lg p-3 text-white resize-none border border-white/10 focus:outline-none transition-colors"
                  style={{ borderColor: themeColor }}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                
                {mediaPreview && (
                  <div className="mt-2 relative">
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="h-32 rounded-lg object-cover" 
                    />
                    <button 
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                      onClick={() => {
                        setSelectedMedia(null);
                        setMediaPreview(null);
                        setMediaType(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex space-x-2">
                    <label className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors cursor-pointer">
                      <HiPhotograph className="w-5 h-5" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleMediaSelect(e, 'image')}
                      />
                    </label>
                    <label className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors cursor-pointer">
                      <HiVideoCamera className="w-5 h-5" />
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => handleMediaSelect(e, 'video')}
                      />
                    </label>
                    <label className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors cursor-pointer">
                      <HiMicrophone className="w-5 h-5" />
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => handleMediaSelect(e, 'audio')}
                      />
                    </label>
                  </div>
                  <button 
                    className="px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: themeColor }}
                    onClick={handleCreatePost}
                    disabled={isPosting || (!newPostContent.trim() && !selectedMedia)}
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <GlassCard key={post.id} className="p-6">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl overflow-hidden">
                    {post.user_avatar ? (
                      <img 
                        src={post.user_avatar}
                        alt={`${post.user_name}'s avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.textContent = '👤';
                          }
                        }}
                      />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {post.user_avatar ? (
                          <img 
                            src={post.user_avatar}
                            alt={`${post.user_name}'s avatar`}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.textContent = '👤';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                            👤
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-medium">{post.user_name || 'Anonymous'}</h3>
                          <p className="text-white/60 text-sm">{post.user_role || 'Member'}</p>
                        </div>
                      </div>
                      <span className="text-white/40 text-sm">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white/80 mt-3 text-left">{post.content}</p>
                    
                    {post.media_url && post.media_type === 'image' && (
                      <div className="mt-3">
                        <img 
                          src={post.media_url} 
                          alt="Post media" 
                          className="rounded-lg max-h-96 object-cover" 
                        />
                      </div>
                    )}
                    
                    {post.media_url && post.media_type === 'video' && (
                      <div className="mt-3">
                        <video 
                          src={post.media_url} 
                          controls 
                          className="rounded-lg max-h-96 w-full" 
                        />
                      </div>
                    )}
                    
                    {post.media_url && post.media_type === 'audio' && (
                      <div className="mt-3">
                        <audio 
                          src={post.media_url} 
                          controls 
                          className="w-full" 
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-6 mt-4">
                      <button 
                        className={`flex items-center space-x-2 ${post.isLiked ? 'text-blue-400' : 'text-white/60 hover:text-white'}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <HiThumbUp className="w-5 h-5" />
                        <span>{post.likes}</span>
                      </button>
                      <button 
                        className="flex items-center space-x-2 text-white/60 hover:text-white"
                        onClick={() => toggleComments(post.id)}
                      >
                        <HiChat className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      <button 
                        className="flex items-center space-x-2 text-white/60 hover:text-white"
                        onClick={() => handleSharePost(post.id)}
                      >
                        <HiShare className="w-5 h-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                    
                    {/* Comments Section */}
                    {showComments === post.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-white font-medium mb-3">Comments</h4>
                        
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {comments.filter(comment => comment.post_id === post.id).length > 0 ? (
                            comments
                              .filter(comment => comment.post_id === post.id)
                              .map(comment => (
                                <div key={comment.id} className="flex space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                    {comment.user_avatar || '👤'}
                                  </div>
                                  <div className="flex-1 bg-white/5 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                      <h5 className="text-white text-sm font-medium">{comment.user_name || 'Anonymous'}</h5>
                                      <span className="text-white/40 text-xs">{new Date(comment.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-white/80 text-sm">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-white/60 text-sm">No comments yet. Be the first to comment!</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:outline-none"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isSubmittingComment) {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <button
                            className="px-3 py-2 rounded-lg text-white text-sm"
                            style={{ backgroundColor: themeColor }}
                            onClick={() => handleAddComment(post.id)}
                            disabled={isSubmittingComment || !newComment.trim()}
                          >
                            {isSubmittingComment ? '...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Users */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Top Contributors</h2>
            <div className="space-y-4">
              {topUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl overflow-hidden">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={`${user.name}'s avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.textContent = '👤';
                            }
                          }}
                        />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <p className="text-white/60 text-sm">{user.role}</p>
                    </div>
                  </div>
                  <div className="text-lg font-semibold" style={{ color: themeColor }}>
                    {user.score}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Upcoming Events */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Upcoming Events</h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="p-4 rounded-lg bg-white/5">
                  <h3 className="text-white font-medium">{event.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 text-white/60">
                      <HiClock className="w-4 h-4" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/60">
                      <HiUserGroup className="w-4 h-4" />
                      <span className="text-sm">{event.participants}</span>
                    </div>
                  </div>
                  <button
                    className={`w-full mt-3 px-4 py-2 rounded-lg text-white ${event.isJoined ? 'bg-green-500' : ''}`}
                    style={{ background: event.isJoined ? undefined : `${themeColor}44` }}
                    onClick={() => handleJoinEvent(event.id)}
                  >
                    {event.isJoined ? 'Joined' : 'Join Event'}
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Tips */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Community Tips</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <HiLightBulb className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-white/80 text-sm">Practice with community members to improve faster!</p>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <HiAcademicCap className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-white/80 text-sm">Share your progress to inspire others!</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
      <ThemeSelector/>
    </AppLayout>
  );
}
