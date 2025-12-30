-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for debate status
CREATE TYPE public.debate_status AS ENUM ('waiting', 'active', 'completed', 'cancelled');

-- Create enum for fact check status
CREATE TYPE public.fact_check_status AS ENUM ('verified', 'unverified', 'incorrect', 'pending');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  debates_participated INTEGER DEFAULT 0,
  debates_won INTEGER DEFAULT 0,
  credibility_score INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create debates table
CREATE TABLE public.debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status debate_status DEFAULT 'waiting' NOT NULL,
  max_participants INTEGER DEFAULT 2,
  current_participants INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create debate_participants table
CREATE TABLE public.debate_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  side TEXT, -- 'for' or 'against'
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (debate_id, user_id)
);

-- Create debate_messages table
CREATE TABLE public.debate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_ai_response BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create fact_checks table
CREATE TABLE public.fact_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.debate_messages(id) ON DELETE CASCADE NOT NULL,
  claim TEXT NOT NULL,
  status fact_check_status DEFAULT 'pending' NOT NULL,
  explanation TEXT,
  sources TEXT[],
  confidence_score DECIMAL(3,2),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create logical_fallacies table
CREATE TABLE public.logical_fallacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.debate_messages(id) ON DELETE CASCADE NOT NULL,
  fallacy_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create debate_summaries table
CREATE TABLE public.debate_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  key_arguments JSONB,
  strengths_weaknesses JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logical_fallacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_summaries ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debates_updated_at
  BEFORE UPDATE ON public.debates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for debates
CREATE POLICY "Debates are viewable by everyone"
  ON public.debates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create debates"
  ON public.debates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Debate creators can update their debates"
  ON public.debates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Debate creators can delete their debates"
  ON public.debates FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for debate_participants
CREATE POLICY "Debate participants are viewable by everyone"
  ON public.debate_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join debates"
  ON public.debate_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave debates"
  ON public.debate_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for debate_messages
CREATE POLICY "Debate messages are viewable by everyone"
  ON public.debate_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.debate_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_ai_response = true);

-- RLS Policies for fact_checks
CREATE POLICY "Fact checks are viewable by everyone"
  ON public.fact_checks FOR SELECT
  USING (true);

CREATE POLICY "System can insert fact checks"
  ON public.fact_checks FOR INSERT
  WITH CHECK (true);

-- RLS Policies for logical_fallacies
CREATE POLICY "Logical fallacies are viewable by everyone"
  ON public.logical_fallacies FOR SELECT
  USING (true);

CREATE POLICY "System can insert logical fallacies"
  ON public.logical_fallacies FOR INSERT
  WITH CHECK (true);

-- RLS Policies for debate_summaries
CREATE POLICY "Debate summaries are viewable by everyone"
  ON public.debate_summaries FOR SELECT
  USING (true);

CREATE POLICY "System can insert debate summaries"
  ON public.debate_summaries FOR INSERT
  WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.debate_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fact_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logical_fallacies;