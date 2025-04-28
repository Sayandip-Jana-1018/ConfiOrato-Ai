-- Drop existing triggers, functions, and policies if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user();
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;

-- Drop the profiles table if it exists
DROP TABLE IF EXISTS profiles;

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  role TEXT DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view all profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy that allows users to insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, bio, role)
  VALUES (new.id, '', new.email, '', '', 'Member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Create storage bucket for user profile photos if it doesn't exist
-- Note: This may need to be done in the Supabase dashboard if SQL doesn't support it
-- INSERT INTO storage.buckets (id, name)
-- VALUES ('user', 'user')
-- ON CONFLICT DO NOTHING;

-- Create storage policies for the user bucket
BEGIN;
-- Policy for users to read any file in the user bucket
DROP POLICY IF EXISTS "Users can view all user files" ON storage.objects;
CREATE POLICY "Users can view all user files"
ON storage.objects FOR SELECT
USING (bucket_id = 'user');

-- Policy for users to upload their own profile photo
DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to update their own profile photo
DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own profile photo
DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
COMMIT;
