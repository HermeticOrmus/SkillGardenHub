-- SkillGarden Database Schema
-- Run this in Supabase SQL Editor (supabase.com > project > SQL Editor)
-- Creates all tables, indexes, RLS policies, and seed data for Yavuz's demo

-- ============================================
-- TABLES
-- ============================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  level INT DEFAULT 1,
  tier TEXT DEFAULT 'Novice',
  total_xp BIGINT DEFAULT 0,
  claims_validated INT DEFAULT 0,
  debates_completed INT DEFAULT 0,
  last_assessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skills (master catalog of learnable skills)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'ai', 'finance', 'ethics', 'product', 'ai_finance'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Skills (what a user is learning + their progress)
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,
  tier TEXT DEFAULT 'Novice',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- User Skill Nodes (sub-skills / knowledge nodes within a main skill)
CREATE TABLE user_skill_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_skill_id UUID REFERENCES user_skills(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assessments (quiz, voice, debate, open response)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'quiz', 'voice', 'debate', 'open_response'
  bloom_level INT, -- 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create
  question TEXT,
  response TEXT,
  score FLOAT,
  feedback JSONB,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Claims (fact-checked statements from panel captures)
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id),
  text TEXT NOT NULL,
  source TEXT,
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- 'verified', 'unverified', 'disputed', 'false'
  confidence FLOAT,
  provider TEXT, -- 'white_circle', 'claude_fallback'
  sources_count INT DEFAULT 0,
  nuance TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Debates (steelman challenges and debate clusters)
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  perspective TEXT NOT NULL, -- which side they argued
  level INT DEFAULT 1,
  can_explain BOOLEAN DEFAULT false,
  can_defend BOOLEAN DEFAULT false,
  can_steelman BOOLEAN DEFAULT false,
  challenges_passed INT DEFAULT 0,
  challenges_total INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_user_skill_nodes_us ON user_skill_nodes(user_skill_id);
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_skill ON assessments(skill_id);
CREATE INDEX idx_claims_user ON claims(user_id);
CREATE INDEX idx_claims_verified ON claims(verified);
CREATE INDEX idx_debates_user ON debates(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- For hackathon demo: permissive policies (read/write all)
-- In production: restrict to auth.uid()
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon key (hackathon demo)
CREATE POLICY "Allow all reads" ON users FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow all reads" ON skills FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON skills FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON user_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON user_skills FOR UPDATE USING (true);

CREATE POLICY "Allow all reads" ON user_skill_nodes FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON user_skill_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON user_skill_nodes FOR UPDATE USING (true);

CREATE POLICY "Allow all reads" ON assessments FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON assessments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads" ON claims FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON claims FOR UPDATE USING (true);

CREATE POLICY "Allow all reads" ON debates FOR SELECT USING (true);
CREATE POLICY "Allow all writes" ON debates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON debates FOR UPDATE USING (true);
