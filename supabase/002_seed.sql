-- SkillGarden Seed Data
-- Yavuz's demo profile matching the dashboard mockup exactly
-- Run AFTER 001_schema.sql

-- ============================================
-- DEMO USER: Yavuz
-- ============================================

INSERT INTO users (id, name, email, level, tier, total_xp, claims_validated, debates_completed, last_assessed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Yavuz',
  'yavuz@skillgarden.demo',
  76,
  'Expert',
  1336443,
  1284,
  37,
  now() - INTERVAL '2 days'
);

-- ============================================
-- SKILL CATALOG
-- ============================================

INSERT INTO skills (id, name, description, category) VALUES
  ('00000001-0001-0001-0001-000000000001', 'AI Boom in Finance', 'AI investment thesis, market dynamics, valuation, and bubble analysis in the finance sector', 'ai_finance'),
  ('00000002-0002-0002-0002-000000000002', 'Machine Learning Foundations', 'Core ML concepts: supervised learning, neural networks, feature engineering', 'ai'),
  ('00000003-0003-0003-0003-000000000003', 'AI Ethics & Governance', 'Bias, fairness, governance frameworks, and responsible AI practices', 'ethics'),
  ('00000004-0004-0004-0004-000000000004', 'AI Product Strategy', 'Market sizing, go-to-market, and competitive analysis for AI products', 'product');

-- ============================================
-- YAVUZ'S SKILL PROGRESS
-- ============================================

-- AI Boom in Finance (Primary, Lv 76 Expert)
INSERT INTO user_skills (id, user_id, skill_id, level, xp, tier)
VALUES (
  '10000001-0001-0001-0001-000000000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000001-0001-0001-0001-000000000001',
  76, 1336443, 'Expert'
);

-- ML Foundations (Lv 58 Adept)
INSERT INTO user_skills (id, user_id, skill_id, level, xp, tier)
VALUES (
  '10000002-0002-0002-0002-000000000002',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000002-0002-0002-0002-000000000002',
  58, 224466, 'Adept'
);

-- AI Ethics (Lv 41 Journeyman)
INSERT INTO user_skills (id, user_id, skill_id, level, xp, tier)
VALUES (
  '10000003-0003-0003-0003-000000000003',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000003-0003-0003-0003-000000000003',
  41, 41171, 'Journeyman'
);

-- AI Product Strategy (Lv 33 Journeyman)
INSERT INTO user_skills (id, user_id, skill_id, level, xp, tier)
VALUES (
  '10000004-0004-0004-0004-000000000004',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000004-0004-0004-0004-000000000004',
  33, 18247, 'Journeyman'
);

-- ============================================
-- SUB-NODES (Knowledge nodes within each skill)
-- ============================================

-- AI Boom in Finance sub-nodes
INSERT INTO user_skill_nodes (user_skill_id, name, level, xp) VALUES
  ('10000001-0001-0001-0001-000000000001', 'AI Market Dynamics', 82, 1475581),
  ('10000001-0001-0001-0001-000000000001', 'Valuation Models', 73, 1096278),
  ('10000001-0001-0001-0001-000000000001', 'Bubble vs Value Analysis', 70, 814445),
  ('10000001-0001-0001-0001-000000000001', 'Regulatory Risk Analysis', 68, 695128);

-- ML Foundations sub-nodes
INSERT INTO user_skill_nodes (user_skill_id, name, level, xp) VALUES
  ('10000002-0002-0002-0002-000000000002', 'Supervised Learning', 65, 547953),
  ('10000002-0002-0002-0002-000000000002', 'Neural Networks', 52, 150872),
  ('10000002-0002-0002-0002-000000000002', 'Feature Engineering', 48, 111945);

-- AI Ethics sub-nodes
INSERT INTO user_skill_nodes (user_skill_id, name, level, xp) VALUES
  ('10000003-0003-0003-0003-000000000003', 'Bias & Fairness', 47, 101333),
  ('10000003-0003-0003-0003-000000000003', 'Governance Frameworks', 38, 37224),
  ('10000003-0003-0003-0003-000000000003', 'Responsible AI Practices', 30, 13363);

-- AI Product Strategy sub-nodes
INSERT INTO user_skill_nodes (user_skill_id, name, level, xp) VALUES
  ('10000004-0004-0004-0004-000000000004', 'Market Sizing & TAM', 40, 40520),
  ('10000004-0004-0004-0004-000000000004', 'Go-to-Market Strategy', 28, 10952),
  ('10000004-0004-0004-0004-000000000004', 'Competitive Analysis', 25, 8740);

-- ============================================
-- DEMO CLAIMS (Panel Capture)
-- ============================================

INSERT INTO claims (user_id, skill_id, text, source, verified, status, confidence, provider, sources_count, nuance) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'NVIDIA controls 80%+ of the AI training GPU market',
    'AI Investment Thesis Panel -- Columbia Business School',
    true, 'verified', 0.95, 'white_circle', 4, null
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'AI will add $15.7 trillion to global GDP by 2030',
    'AI Investment Thesis Panel -- Columbia Business School',
    false, 'unverified', 0.45, 'white_circle', 1, 'PwC estimate -- methodology needs review'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'Enterprise AI adoption doubled year-over-year since 2024',
    'AI Investment Thesis Panel -- Columbia Business School',
    true, 'verified', 0.82, 'white_circle', 3, 'Varies by sector and company size'
  );

-- ============================================
-- DEMO DEBATES
-- ============================================

INSERT INTO debates (user_id, skill_id, topic, perspective, level, can_explain, can_defend, can_steelman, challenges_passed, challenges_total) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'Is AI Overvalued or Undervalued?',
    'Undervalued',
    72, true, true, true, 3, 3
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'Is AI Overvalued or Undervalued?',
    'Overvalued',
    58, true, true, false, 2, 3
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'Is AI Overvalued or Undervalued?',
    'Paradigm Shift',
    35, true, false, false, 1, 3
  );

-- ============================================
-- DEMO ASSESSMENTS (recent history)
-- ============================================

INSERT INTO assessments (user_id, skill_id, type, bloom_level, question, response, score, feedback, xp_earned, created_at) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'quiz', 1,
    'What distinguishes a high-risk AI system under the EU AI Act?',
    'It poses significant risk to health, safety, or fundamental rights',
    1.0,
    '{"correct": true, "explanation": "The EU AI Act classifies risk by impact on people, not by model size."}',
    25,
    now() - INTERVAL '2 days'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'voice', 5,
    'Explain why NVIDIA market cap is justified or unjustified',
    null,
    0.88,
    '{"accuracy": 0.91, "completeness": 0.78, "clarity": 0.94, "covered": ["GPU monopoly thesis", "Revenue growth vs P/E ratio", "CUDA ecosystem moat"], "gaps": ["Custom silicon competition not addressed"]}',
    150,
    now() - INTERVAL '3 days'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '00000001-0001-0001-0001-000000000001',
    'debate', 5,
    'Steelman: AI is undervalued because enterprise adoption is early innings',
    null,
    0.85,
    '{"position": "Undervalued", "strength": 0.85, "counterpoints_addressed": 3}',
    200,
    now() - INTERVAL '5 days'
  );
