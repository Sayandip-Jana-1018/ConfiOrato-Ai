import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Post {
  photoUrl: any;
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  likes: number;
  comments: number;
  shares: number;
  type: 'tip' | 'achievement' | 'milestone';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  user_role?: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  participants: number;
  type: 'workshop' | 'practice' | 'webinar';
  created_at: string;
  updated_at: string;
  isJoined?: boolean;
}

export interface TopUser {
  id: string;
  user_id: string;
  name: string;
  role: string;
  score: number;
  avatar: string;
  created_at?: string;
  updated_at?: string;
}

// Posts
export const fetchPosts = async (userId: string): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if the current user has liked each post
    const postsWithLikeStatus = await Promise.all(
      data.map(async (post) => {
        const { data: likeData } = await supabase
          .from('user_likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .single();

        // Get user info for the post
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', post.user_id)
          .single();
          
        if (userError) {
          console.error('Error fetching user data:', userError);
        }

        // Get profile photo URL if it exists
        let avatarUrl = '';
        try {
          const { data: photoData } = await supabase.storage
            .from('avatars')
            .getPublicUrl(`${post.user_id}/profile.jpg`);
            
          if (photoData?.publicUrl) {
            avatarUrl = photoData.publicUrl;
          }
        } catch (photoError) {
          console.error("Error fetching profile photo:", photoError);
        }

        return {
          ...post,
          isLiked: !!likeData,
          user_name: userData?.full_name || 'Anonymous',
          user_avatar: avatarUrl,
          user_role: userData?.role || 'Member'
        };
      })
    );

    return postsWithLikeStatus;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

export const createPost = async (
  userId: string,
  content: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video' | 'audio',
  type: 'tip' | 'achievement' | 'milestone' = 'tip'
): Promise<Post | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          id: uuidv4(),
          user_id: userId,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          type,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

export const uploadMedia = async (
  file: File,
  userId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
};

// Likes
export const likePost = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_likes')
      .insert([{ user_id: userId, post_id: postId }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

export const unlikePost = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

// Comments
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user info for each comment
    const commentsWithUserInfo = await Promise.all(
      data.map(async (comment) => {
        const { data: userData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          user_name: userData?.username || 'Anonymous',
          user_avatar: userData?.avatar_url || '',
        };
      })
    );

    return commentsWithUserInfo;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const addComment = async (
  userId: string,
  postId: string,
  content: string
): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          id: uuidv4(),
          user_id: userId,
          post_id: postId,
          content,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Events
export const fetchEvents = async (userId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    // Check if the current user has joined each event
    const eventsWithJoinStatus = await Promise.all(
      data.map(async (event) => {
        const { data: joinData } = await supabase
          .from('user_events')
          .select('*')
          .eq('event_id', event.id)
          .eq('user_id', userId)
          .single();

        return {
          ...event,
          isJoined: !!joinData,
        };
      })
    );

    return eventsWithJoinStatus;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const joinEvent = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_events')
      .insert([{ user_id: userId, event_id: eventId }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error joining event:', error);
    return false;
  }
};

export const leaveEvent = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error leaving event:', error);
    return false;
  }
};

// Top Users
export const fetchTopUsers = async (): Promise<TopUser[]> => {
  try {
    const { data, error } = await supabase
      .from('top_users')
      .select('*')
      .order('score', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching top users:', error);
    return [];
  }
};

// Share Post
export const sharePost = async (postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ shares: supabase.rpc('increment', { x: 1 }) })
      .eq('id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sharing post:', error);
    return false;
  }
};

/**
 * Fetches the top contributors based on post count
 * @param limit The number of top contributors to fetch
 * @returns Array of top users
 */
export const fetchTopContributors = async (limit: number = 4): Promise<TopUser[]> => {
  try {
    // Fetch directly from the top_users table
    const { data: topUsers, error } = await supabase
      .from('top_users')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top users:', error);
      return [];
    }

    if (!topUsers || topUsers.length === 0) {
      // Fallback to hardcoded top users if no data exists yet
      return fetchTopUsers();
    }

    // Map the data to our TopUser interface
    return topUsers.map(user => ({
      id: user.id,
      user_id: user.user_id,
      name: user.name || 'Anonymous',
      role: user.role || 'Member',
      score: user.score || 0,
      avatar: user.avatar || '',
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
  } catch (error) {
    console.error('Error in fetchTopContributors:', error);
    // Fallback to regular top users if there's an error
    return fetchTopUsers();
  }
};
