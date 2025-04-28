-- Create the necessary tables for the analytics page

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for practice sessions
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER NOT NULL, -- in minutes
    environment VARCHAR(50) NOT NULL,
    metrics JSONB NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    date_achieved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points INTEGER NOT NULL DEFAULT 10,
    is_collected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for speech analysis metrics
CREATE TABLE IF NOT EXISTS public.speech_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    practice_session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for security
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access their own data
CREATE POLICY "Users can view their own practice sessions"
    ON public.practice_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions"
    ON public.practice_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions"
    ON public.practice_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements"
    ON public.achievements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON public.achievements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
    ON public.achievements
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own speech analysis"
    ON public.speech_analysis
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speech analysis"
    ON public.speech_analysis
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS practice_sessions_user_id_idx ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS practice_sessions_session_date_idx ON public.practice_sessions(session_date);
CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS speech_analysis_user_id_idx ON public.speech_analysis(user_id);
CREATE INDEX IF NOT EXISTS speech_analysis_practice_session_id_idx ON public.speech_analysis(practice_session_id);

-- Create function to save practice session with speech analysis
CREATE OR REPLACE FUNCTION public.save_practice_session(
    p_user_id UUID,
    p_duration INTEGER,
    p_environment VARCHAR,
    p_metrics JSONB,
    p_feedback TEXT,
    p_speech_metrics JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Insert practice session
    INSERT INTO public.practice_sessions (
        user_id,
        duration,
        environment,
        metrics,
        feedback
    ) VALUES (
        p_user_id,
        p_duration,
        p_environment,
        p_metrics,
        p_feedback
    )
    RETURNING id INTO v_session_id;
    
    -- Insert speech analysis
    INSERT INTO public.speech_analysis (
        user_id,
        practice_session_id,
        metrics
    ) VALUES (
        p_user_id,
        v_session_id,
        p_speech_metrics
    );
    
    -- Check for achievements
    -- 1. First practice achievement
    IF NOT EXISTS (
        SELECT 1 FROM public.achievements 
        WHERE user_id = p_user_id AND name = 'First Practice'
    ) THEN
        INSERT INTO public.achievements (
            user_id,
            name,
            description,
            icon,
            points
        ) VALUES (
            p_user_id,
            'First Practice',
            'Completed your first practice session',
            'HiSparkles',
            10
        );
    END IF;
    
    -- 2. Check for practice streak achievements
    -- This is a simplified version - in a real app, you'd have more complex logic
    IF (
        SELECT COUNT(*) FROM public.practice_sessions 
        WHERE user_id = p_user_id
    ) >= 7 
    AND NOT EXISTS (
        SELECT 1 FROM public.achievements 
        WHERE user_id = p_user_id AND name = 'Consistency Champion'
    ) THEN
        INSERT INTO public.achievements (
            user_id,
            name,
            description,
            icon,
            points
        ) VALUES (
            p_user_id,
            'Consistency Champion',
            'Completed 7 days practice streak',
            'HiClock',
            25
        );
    END IF;
    
    -- 3. Check for environment-specific achievements
    IF (
        SELECT COUNT(*) FROM public.practice_sessions 
        WHERE user_id = p_user_id AND environment = p_environment
    ) >= 10 
    AND NOT EXISTS (
        SELECT 1 FROM public.achievements 
        WHERE user_id = p_user_id AND name = p_environment || ' Master'
    ) THEN
        INSERT INTO public.achievements (
            user_id,
            name,
            description,
            icon,
            points
        ) VALUES (
            p_user_id,
            p_environment || ' Master',
            'Completed 10 ' || p_environment || ' practices',
            'HiChartBar',
            30
        );
    END IF;
    
    -- 4. Check for voice control achievement
    IF (p_metrics->>'pace')::numeric >= 80 
    AND (p_metrics->>'clarity')::numeric >= 80
    AND p_duration >= 15
    AND NOT EXISTS (
        SELECT 1 FROM public.achievements 
        WHERE user_id = p_user_id AND name = 'Voice Control'
    ) THEN
        INSERT INTO public.achievements (
            user_id,
            name,
            description,
            icon,
            points
        ) VALUES (
            p_user_id,
            'Voice Control',
            'Maintained optimal pace for 15 minutes',
            'HiMicrophone',
            20
        );
    END IF;
    
    RETURN v_session_id;
END;
$$;

-- Create function to collect achievement rewards
CREATE OR REPLACE FUNCTION public.collect_achievement_reward(
    p_achievement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.achievements
    SET is_collected = TRUE
    WHERE id = p_achievement_id
    AND user_id = auth.uid()
    AND is_collected = FALSE;
    
    RETURN FOUND;
END;
$$;
