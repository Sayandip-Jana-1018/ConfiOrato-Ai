-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('tip', 'achievement', 'milestone')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_likes table to track which users liked which posts
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  participants INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('workshop', 'practice', 'webinar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_events table to track which users joined which events
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create top_users table
CREATE TABLE IF NOT EXISTS top_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are viewable by everyone."
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own posts."
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts."
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts."
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public comments are viewable by everyone."
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments."
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments."
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments."
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for user_likes
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public likes are viewable by everyone."
  ON user_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes."
  ON user_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes."
  ON user_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone."
  ON events FOR SELECT
  USING (true);

-- Create RLS policies for user_events
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public event participants are viewable by everyone."
  ON user_events FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own event participation."
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event participation."
  ON user_events FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for top_users
ALTER TABLE top_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public top users are viewable by everyone."
  ON top_users FOR SELECT
  USING (true);

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'Media Files', true);

-- Set up storage policy for media bucket
CREATE POLICY "Media files are accessible to everyone."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media files."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own media files."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid() = owner);

-- Create function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes = likes - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating post likes count
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Create function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments = comments + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments = comments - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating post comments count
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Create function to update event participants count
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET participants = participants + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET participants = participants - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating event participants count
CREATE TRIGGER update_event_participants_count_trigger
AFTER INSERT OR DELETE ON user_events
FOR EACH ROW
EXECUTE FUNCTION update_event_participants_count();
