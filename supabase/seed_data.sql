-- Seed data for testing the community page

-- First, we need to create users that our seed data will reference
-- Note: In a real environment, you would use Supabase Auth to create users
-- This is just for local development and testing purposes

-- Create test users (this will only work if you have permission to insert into auth.users)
-- If this fails, you'll need to create users through the Supabase Auth UI or API first
DO $$
BEGIN
  -- Only run this if the users don't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    -- This is a workaround for testing. In production, users should be created through Auth UI/API
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'test1@example.com', NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000002', 'test2@example.com', NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000003', 'test3@example.com', NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000004', 'test4@example.com', NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000005', 'test5@example.com', NOW(), NOW());
  END IF;
EXCEPTION
  -- If we don't have permission to insert into auth.users, we'll just continue
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No permission to insert into auth.users. Please create users manually.';
END;
$$;

-- Create profiles for our test users
INSERT INTO profiles (id, username, full_name, avatar_url, role, bio)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'sarahjohnson', 'Sarah Johnson', 'https://i.pravatar.cc/150?img=1', 'Public Speaking Coach', 'Helping people overcome speaking anxiety for over 10 years'),
  ('00000000-0000-0000-0000-000000000002', 'michaelchen', 'Michael Chen', 'https://i.pravatar.cc/150?img=2', 'Communication Expert', 'Specializing in business communication and presentation skills'),
  ('00000000-0000-0000-0000-000000000003', 'jessicaw', 'Jessica Williams', 'https://i.pravatar.cc/150?img=3', 'Speech Therapist', 'Working with professionals to improve speech clarity and delivery'),
  ('00000000-0000-0000-0000-000000000004', 'davidr', 'David Rodriguez', 'https://i.pravatar.cc/150?img=4', 'Presentation Coach', 'Former TED speaker now helping others shine on stage'),
  ('00000000-0000-0000-0000-000000000005', 'emmat', 'Emma Thompson', 'https://i.pravatar.cc/150?img=5', 'Interview Specialist', 'Preparing candidates for high-stakes interviews')
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    bio = EXCLUDED.bio;

-- Insert sample events
INSERT INTO events (id, title, description, date, participants, type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Public Speaking Workshop', 'Learn essential techniques to improve your public speaking skills', '2025-04-05', 12, 'workshop'),
  ('22222222-2222-2222-2222-222222222222', 'Interview Practice Session', 'Practice answering common interview questions with peers', '2025-04-12', 8, 'practice'),
  ('33333333-3333-3333-3333-333333333333', 'Presentation Skills Webinar', 'Expert tips on creating and delivering impactful presentations', '2025-04-20', 20, 'webinar'),
  ('44444444-4444-4444-4444-444444444444', 'Speech Anxiety Workshop', 'Techniques to overcome nervousness when speaking in public', '2025-04-28', 15, 'workshop'),
  ('55555555-5555-5555-5555-555555555555', 'Executive Presence Training', 'Develop the confidence and communication skills of a leader', '2025-05-05', 10, 'practice'),
  ('66666666-6666-6666-6666-666666666666', 'Virtual Reality Speech Practice', 'Practice speaking in simulated environments using VR technology', '2025-05-12', 6, 'workshop'),
  ('77777777-7777-7777-7777-777777777777', 'Impromptu Speaking Challenge', 'Improve your ability to think and speak on your feet with fun challenges', '2025-05-18', 14, 'practice'),
  ('88888888-8888-8888-8888-888888888888', 'Voice Modulation Masterclass', 'Learn to use your voice effectively for maximum impact', '2025-05-25', 18, 'webinar'),
  ('99999999-9999-9999-9999-999999999999', 'Storytelling for Business', 'Craft compelling stories to engage your audience and convey your message', '2025-05-31', 12, 'webinar');

-- Insert sample top users
-- This will only work if the users exist in auth.users
INSERT INTO top_users (id, user_id, name, role, score, avatar)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'Public Speaking Coach', 980, 'https://i.pravatar.cc/150?img=1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', 'Michael Chen', 'Communication Expert', 850, 'https://i.pravatar.cc/150?img=2'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000003', 'Jessica Williams', 'Speech Therapist', 720, 'https://i.pravatar.cc/150?img=3'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000004', 'David Rodriguez', 'Presentation Coach', 690, 'https://i.pravatar.cc/150?img=4'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000005', 'Emma Thompson', 'Interview Specialist', 650, 'https://i.pravatar.cc/150?img=5');

-- Note: Posts, comments, likes, and user_events will be created by actual users
-- through the application interface. This seed data provides the initial
-- events and top users to make the community page functional from the start.

-- If you need to test with sample posts, you can uncomment and modify the following:
/*
-- Insert sample posts (requires existing user IDs)
INSERT INTO posts (id, user_id, content, media_url, media_type, likes, comments, shares, type)
VALUES 
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000001', 'Just completed my first presentation using the techniques I learned here. Feeling confident!', 'https://example.com/image1.jpg', 'image', 15, 3, 2, 'achievement'),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000002', 'Pro tip: Practice your speech in front of a mirror to improve your facial expressions and body language.', NULL, NULL, 10, 2, 5, 'tip'),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000003', 'Reached 50 practice sessions this month! My speaking anxiety is almost gone.', NULL, NULL, 20, 5, 3, 'milestone');

-- Insert sample comments
INSERT INTO comments (id, post_id, user_id, content)
VALUES 
  ('12345678-1234-1234-1234-123456789012', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000002', 'Congratulations! Keep up the good work!'),
  ('23456789-2345-2345-2345-234567890123', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000003', 'That''s amazing progress!'),
  ('34567890-3456-3456-3456-345678901234', '88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'Great tip! I''d also recommend recording yourself to hear your voice.'),
  ('45678901-4567-4567-4567-456789012345', '77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000004', 'That''s impressive dedication!');

-- Insert sample user_likes
INSERT INTO user_likes (id, user_id, post_id)
VALUES 
  ('abcdef12-abcd-abcd-abcd-abcdef123456', '00000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999'),
  ('bcdef123-bcde-bcde-bcde-bcdef1234567', '00000000-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999'),
  ('cdef1234-cdef-cdef-cdef-cdef12345678', '00000000-0000-0000-0000-000000000004', '99999999-9999-9999-9999-999999999999'),
  ('def12345-def1-def1-def1-def123456789', '00000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888'),
  ('ef123456-ef12-ef12-ef12-ef1234567890', '00000000-0000-0000-0000-000000000003', '88888888-8888-8888-8888-888888888888');

-- Insert sample user_events
INSERT INTO user_events (id, user_id, event_id)
VALUES 
  ('11111aaa-1111-1111-1111-11111aaaaaaa', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('22222bbb-2222-2222-2222-22222bbbbbbb', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  ('33333ccc-3333-3333-3333-33333ccccccc', '00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222'),
  ('44444ddd-4444-4444-4444-44444ddddddd', '00000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333');
*/
