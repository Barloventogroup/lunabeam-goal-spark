-- ===== COACH DASHBOARD DEMO DATA SEED =====
-- Run this SQL in your Supabase SQL Editor to populate demo data
--
-- IMPORTANT: Replace the following placeholder IDs with real values:
-- :COACH_CARLOS → Your current supporter user ID (Carlos)
-- :COACH_JESS → Another supporter user ID (Jess) - optional for "All Coaches" filter testing
--
-- This seed creates 6 demo students across 2 cohorts demonstrating all 4 statuses:
-- - Natalia (On track) - Cohort A
-- - Oliver (At risk) - Cohort A  
-- - Maya (Stuck) - Cohort A
-- - Leo (On track) - Cohort B
-- - Ava (No data) - Cohort B
-- - Ethan (At risk) - Cohort B

-- ===== 1) COHORTS & MEMBERS =====
INSERT INTO cohorts (id, name, program, school_id) VALUES
  ('00000000-0000-0000-0000-000000000001','Helix – Fall Cohort A','Transition','11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000002','Helix – Fall Cohort B','Transition','11111111-1111-1111-1111-111111111111');

-- Six demo students (you'll need to create these auth users first if they don't exist)
-- user_id doubles as "individual_id"
INSERT INTO profiles (user_id, first_name, avatar_url, grade, updated_at) VALUES
  ('20000000-0000-0000-0000-000000000001','Natalia','https://i.pravatar.cc/100?img=1','9', now()),
  ('20000000-0000-0000-0000-000000000002','Oliver','https://i.pravatar.cc/100?img=2','8', now()),
  ('20000000-0000-0000-0000-000000000003','Maya','https://i.pravatar.cc/100?img=3','11', now()),
  ('20000000-0000-0000-0000-000000000004','Leo','https://i.pravatar.cc/100?img=4','10', now()),
  ('20000000-0000-0000-0000-000000000005','Ava','https://i.pravatar.cc/100?img=5','12', now()),
  ('20000000-0000-0000-0000-000000000006','Ethan','https://i.pravatar.cc/100?img=6','9', now())
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  avatar_url = EXCLUDED.avatar_url,
  grade = EXCLUDED.grade;

-- Map students to cohorts
INSERT INTO cohort_members (id, cohort_id, individual_id, added_by)
VALUES
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001', :COACH_CARLOS),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002', :COACH_CARLOS),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003', :COACH_CARLOS),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004', :COACH_CARLOS),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000005', :COACH_CARLOS),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000006', :COACH_CARLOS)
ON CONFLICT (cohort_id, individual_id) DO NOTHING;

-- ===== 2) SUPPORTER RELATIONSHIPS (reuse existing "supporters" table) =====
-- Carlos is coach of all six; Jess is coach of Cohort B only (for Supporter scope Me/All)
INSERT INTO supporters (supporter_id, individual_id, role, permission_level) VALUES
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000001','coach', 'viewer'),
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000002','coach', 'viewer'),
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000003','coach', 'viewer'),
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000004','coach', 'viewer'),
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000005','coach', 'viewer'),
  (:COACH_CARLOS,'20000000-0000-0000-0000-000000000006','coach', 'viewer')
ON CONFLICT (supporter_id, individual_id) DO NOTHING;

-- Optional: Add Jess as coach for Cohort B students (for "All Coaches" filter testing)
-- INSERT INTO supporters (supporter_id, individual_id, role, permission_level) VALUES
--   (:COACH_JESS,'20000000-0000-0000-0000-000000000004','coach', 'viewer'),
--   (:COACH_JESS,'20000000-0000-0000-0000-000000000005','coach', 'viewer'),
--   (:COACH_JESS,'20000000-0000-0000-0000-000000000006','coach', 'viewer')
-- ON CONFLICT (supporter_id, individual_id) DO NOTHING;

-- ===== 3) GOALS (mix Habit / Skill / Level-up) =====
INSERT INTO goals (id, owner_id, title, goal_type, status, start_date, created_by)
VALUES
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Morning routine', 'habit', 'active', now() - interval '21 days', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Math practice', 'skill', 'active', now() - interval '14 days', '20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Prepare club presentation', 'levelup', 'active', now() - interval '10 days', '20000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','Planner check', 'habit', 'active', now() - interval '14 days', '20000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005','Scholarship essays', 'skill', 'active', now() - interval '7 days', '20000000-0000-0000-0000-000000000005'),
  ('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000006','Science project', 'skill', 'active', now() - interval '7 days', '20000000-0000-0000-0000-000000000006')
ON CONFLICT (id) DO NOTHING;

-- ===== 4) STEPS (this week + recent past to create statuses) =====
-- Natalia (On track): 6 planned, 5 completed, 0 overdue
INSERT INTO steps (id, goal_id, title, due_date, status, updated_at)
VALUES
  ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Lay clothes', (current_date - interval '2 days')::date, 'done', now() - interval '2 days'),
  ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Brush teeth', (current_date - interval '1 days')::date, 'done', now() - interval '1 days'),
  ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','Pack backpack', (current_date - interval '1 days')::date, 'done', now() - interval '20 hours'),
  ('40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001','Set timer', (current_date)::date, 'done', now() - interval '11 hours'),
  ('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','Breakfast', (current_date)::date, 'done', now() - interval '5 hours'),
  ('40000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000001','Out the door', (current_date + interval '1 days')::date, 'not_started', now())
ON CONFLICT (id) DO NOTHING;

-- Oliver (At risk): 8 planned, 4 done, 2 overdue (one >24h), difficulty rising
INSERT INTO steps (id, goal_id, title, due_date, status, updated_at) VALUES
  ('40000000-0000-0000-0000-000000000101','30000000-0000-0000-0000-000000000002','Prepare problems', (current_date - interval '3 days')::date, 'done', now() - interval '2 days'),
  ('40000000-0000-0000-0000-000000000102','30000000-0000-0000-0000-000000000002','Start practice', (current_date - interval '2 days')::date, 'done', now() - interval '1 days'),
  ('40000000-0000-0000-0000-000000000103','30000000-0000-0000-0000-000000000002','Focus set 1', (current_date - interval '1 days')::date, 'not_started', now()), -- OVERDUE >24h
  ('40000000-0000-0000-0000-000000000104','30000000-0000-0000-0000-000000000002','Review mistakes', (current_date)::date, 'done', now() - interval '10 hours'),
  ('40000000-0000-0000-0000-000000000105','30000000-0000-0000-0000-000000000002','Set 2', (current_date)::date, 'done', now() - interval '4 hours'),
  ('40000000-0000-0000-0000-000000000106','30000000-0000-0000-0000-000000000002','Set 3', (current_date)::date, 'not_started', now()), -- OVERDUE
  ('40000000-0000-0000-0000-000000000107','30000000-0000-0000-0000-000000000002','Timed quiz', (current_date + interval '1 days')::date, 'not_started', now()),
  ('40000000-0000-0000-0000-000000000108','30000000-0000-0000-0000-000000000002','Final reflection', (current_date + interval '2 days')::date, 'not_started', now())
ON CONFLICT (id) DO NOTHING;

-- Maya (Stuck): 6 planned, 1 done, 4 overdue with one >72h
INSERT INTO steps (id, goal_id, title, due_date, status, updated_at) VALUES
  ('40000000-0000-0000-0000-000000000201','30000000-0000-0000-0000-000000000003','Outline slides', (current_date - interval '5 days')::date, 'not_started', now()), -- OVERDUE >72h
  ('40000000-0000-0000-0000-000000000202','30000000-0000-0000-0000-000000000003','Draft content', (current_date - interval '3 days')::date, 'not_started', now()), -- OVERDUE
  ('40000000-0000-0000-0000-000000000203','30000000-0000-0000-0000-000000000003','Collect images', (current_date - interval '2 days')::date, 'not_started', now()), -- OVERDUE
  ('40000000-0000-0000-0000-000000000204','30000000-0000-0000-0000-000000000003','Practice run', (current_date - interval '1 days')::date, 'not_started', now()), -- OVERDUE
  ('40000000-0000-0000-0000-000000000205','30000000-0000-0000-0000-000000000003','Feedback', (current_date + interval '1 days')::date, 'not_started', now()),
  ('40000000-0000-0000-0000-000000000206','30000000-0000-0000-0000-000000000003','Final polish', (current_date + interval '2 days')::date, 'done', now() - interval '1 hours')
ON CONFLICT (id) DO NOTHING;

-- Leo (On track, different cohort): 5 planned, 4 done
INSERT INTO steps (id, goal_id, title, due_date, status, updated_at) VALUES
  ('40000000-0000-0000-0000-000000000301','30000000-0000-0000-0000-000000000004','Open planner', (current_date - interval '3 days')::date, 'done', now() - interval '3 days'),
  ('40000000-0000-0000-0000-000000000302','30000000-0000-0000-0000-000000000004','List top 3', (current_date - interval '2 days')::date, 'done', now() - interval '2 days'),
  ('40000000-0000-0000-0000-000000000303','30000000-0000-0000-0000-000000000004','Check off done', (current_date - interval '1 days')::date, 'done', now() - interval '1 days'),
  ('40000000-0000-0000-0000-000000000304','30000000-0000-0000-0000-000000000004','Prep tomorrow', (current_date)::date, 'done', now() - interval '5 hours'),
  ('40000000-0000-0000-0000-000000000305','30000000-0000-0000-0000-000000000004','Weekly review', (current_date + interval '1 days')::date, 'not_started', now())
ON CONFLICT (id) DO NOTHING;

-- Ava (No data): goal started, but no steps yet
-- Ethan (At risk to Stuck path): mix of late steps
INSERT INTO steps (id, goal_id, title, due_date, status, updated_at) VALUES
  ('40000000-0000-0000-0000-000000000401','30000000-0000-0000-0000-000000000006','Research topic', (current_date - interval '2 days')::date, 'done', now() - interval '1 days'),
  ('40000000-0000-0000-0000-000000000402','30000000-0000-0000-0000-000000000006','Build outline', (current_date)::date, 'not_started', now()), -- OVERDUE
  ('40000000-0000-0000-0000-000000000403','30000000-0000-0000-0000-000000000006','Draft section A', (current_date + interval '1 days')::date, 'not_started', now())
ON CONFLICT (id) DO NOTHING;

-- ===== 5) CHECK-INS (controls difficulty trend and latency) =====
-- difficulty: 1=😊 easy, 2=😐 okay, 3=😣 hard
-- mood: 1=good, 2=okay, 3=bad

-- Natalia: easy → On track
INSERT INTO check_ins (id, user_id, goal_id, created_at, difficulty, mood, blocker_tags) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001', now() - interval '2 days', 1, 1, ARRAY['none']),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001', now() - interval '1 days', 2, 1, ARRAY['none']),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001', now() - interval '6 hours', 1, 1, ARRAY['none'])
ON CONFLICT (id) DO NOTHING;

-- Oliver: trending hard → At risk
INSERT INTO check_ins (id, user_id, goal_id, created_at, difficulty, mood, blocker_tags) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002', now() - interval '2 days', 2, 2, ARRAY['timing']),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002', now() - interval '22 hours', 3, 2, ARRAY['confusing_instructions']),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002', now() - interval '5 hours', 3, 2, ARRAY['noise'])
ON CONFLICT (id) DO NOTHING;

-- Maya: very hard + latency >48h → Stuck
INSERT INTO check_ins (id, user_id, goal_id, created_at, difficulty, mood, blocker_tags) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003', now() - interval '4 days', 3, 2, ARRAY['avoidance'])
ON CONFLICT (id) DO NOTHING;

-- Leo: fine
INSERT INTO check_ins (id, user_id, goal_id, created_at, difficulty, mood, blocker_tags) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000004', now() - interval '1 days', 2, 1, ARRAY['none'])
ON CONFLICT (id) DO NOTHING;

-- Ava: none (No data status)

-- Ethan: mixed; recent check-in mild
INSERT INTO check_ins (id, user_id, goal_id, created_at, difficulty, mood, blocker_tags) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000006', now() - interval '20 hours', 2, 2, ARRAY['timing'])
ON CONFLICT (id) DO NOTHING;

-- ===== 6) SUPPORT ACTIONS (for KPI "interventions last 7d" and drawer/audit) =====
INSERT INTO support_actions (id, student_id, coach_id, type, at_ts, payload, visible_to_student) VALUES
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000002', :COACH_CARLOS, 'nudge', now() - interval '1 days', '{"template":"friendly_reminder"}'::jsonb, true),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000002', :COACH_CARLOS, 'adjust', now() - interval '20 hours', '{"step_id":"40000000-0000-0000-0000-000000000105","new_time_of_day":"evening"}'::jsonb, false),
  (gen_random_uuid(),'20000000-0000-0000-0000-000000000003', :COACH_CARLOS, 'split', now() - interval '3 days', '{"original_step":"40000000-0000-0000-0000-000000000201","children":3}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- Optional: Add Jess's action for "All Coaches" filter testing
-- INSERT INTO support_actions (id, student_id, coach_id, type, at_ts, payload, visible_to_student) VALUES
--   (gen_random_uuid(),'20000000-0000-0000-0000-000000000004', :COACH_JESS, 'note', now() - interval '6 hours', '{"text":"Great streak—keep planner near backpack."}'::jsonb, true)
-- ON CONFLICT (id) DO NOTHING;

-- ===== VERIFICATION QUERIES =====
-- Run these to verify the seed worked correctly:

-- Should show 6 students across 2 cohorts
-- SELECT 
--   p.first_name, 
--   p.grade,
--   c.name as cohort_name,
--   g.title as goal_title,
--   COUNT(DISTINCT s.id) as steps_count,
--   COUNT(DISTINCT CASE WHEN s.status = 'done' THEN s.id END) as completed_count
-- FROM profiles p
-- JOIN cohort_members cm ON p.user_id = cm.individual_id
-- JOIN cohorts c ON cm.cohort_id = c.id
-- JOIN goals g ON p.user_id = g.owner_id
-- LEFT JOIN steps s ON g.id = s.goal_id
-- WHERE p.user_id IN (
--   '20000000-0000-0000-0000-000000000001',
--   '20000000-0000-0000-0000-000000000002',
--   '20000000-0000-0000-0000-000000000003',
--   '20000000-0000-0000-0000-000000000004',
--   '20000000-0000-0000-0000-000000000005',
--   '20000000-0000-0000-0000-000000000006'
-- )
-- GROUP BY p.first_name, p.grade, c.name, g.title
-- ORDER BY c.name, p.first_name;
