-- Fix search path security warnings for new functions
CREATE OR REPLACE FUNCTION public.calculate_step_points(
  _category TEXT,
  _step_title TEXT,
  _step_notes TEXT DEFAULT ''
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _points INTEGER := 5; -- Default points
  _title_lower TEXT := LOWER(_step_title);
  _notes_lower TEXT := LOWER(COALESCE(_step_notes, ''));
  _combined_text TEXT := _title_lower || ' ' || _notes_lower;
BEGIN
  CASE _category
    WHEN 'independent_living' THEN
      -- +5 → Daily self-check (chores, hygiene)
      IF _combined_text ~ '(daily|chore|hygiene|clean|brush|shower|bath|wash)' THEN
        _points := 5;
      -- +10 → Safety practice, cooking, money handling
      ELSIF _combined_text ~ '(safety|cook|money|budget|finance|bank|shop|grocery)' THEN
        _points := 10;
      -- +20 → Major milestones (travel alone, manage weekly budget)
      ELSIF _combined_text ~ '(travel|alone|independent|weekly budget|milestone|major)' THEN
        _points := 20;
      END IF;
      
    WHEN 'postsecondary_learning' THEN
      -- +5 → Study session, homework, practice quiz
      IF _combined_text ~ '(study|homework|practice|quiz|read|review)' THEN
        _points := 5;
      -- +15 → Campus visit, group project, test prep
      ELSIF _combined_text ~ '(campus|visit|group project|test prep|project|research)' THEN
        _points := 15;
      -- +25 → Application submitted, certificate earned
      ELSIF _combined_text ~ '(application|submit|certificate|earn|graduate|degree|diploma)' THEN
        _points := 25;
      END IF;
      
    WHEN 'recreation_fun' THEN
      -- +5 → Solo activity (hobby, art, game)
      IF _combined_text ~ '(solo|hobby|art|game|draw|paint|music|read)' THEN
        _points := 5;
      -- +10 → Group recreation, inviting a friend
      ELSIF _combined_text ~ '(group|friend|invite|social|party|event)' THEN
        _points := 10;
      -- +20 → Leading event or maintaining a 4-week streak
      ELSIF _combined_text ~ '(lead|leading|organize|4-week|streak|maintain)' THEN
        _points := 20;
      END IF;
      
    WHEN 'social_skills' THEN
      -- +5 → Greetings, introductions, short role-play
      IF _combined_text ~ '(greet|introduction|role-play|hello|meet|conversation)' THEN
        _points := 5;
      -- +15 → Group conversation, joining activity
      ELSIF _combined_text ~ '(group conversation|join|activity|participate|team)' THEN
        _points := 15;
      -- +25 → Leading group activity, presentation, or 10+ interactions
      ELSIF _combined_text ~ '(lead|leading|presentation|present|10|interactions|speech)' THEN
        _points := 25;
      END IF;
      
    WHEN 'employment' THEN
      -- +5 → Career interest assessment, resume draft
      IF _combined_text ~ '(career|interest|assessment|resume|draft|cv)' THEN
        _points := 5;
      -- +15 → Job shadow, mock interview, volunteer activity
      ELSIF _combined_text ~ '(job shadow|mock interview|volunteer|practice|network)' THEN
        _points := 15;
      -- +30 → Job application, interview, or first workday
      ELSIF _combined_text ~ '(job application|interview|workday|first day|hired|start work)' THEN
        _points := 30;
      END IF;
      
    WHEN 'self_advocacy_life_skills' THEN
      -- +5 → Asking for help, making a choice
      IF _combined_text ~ '(ask|help|choice|decide|request|support)' THEN
        _points := 5;
      -- +15 → Participating in a planning meeting, practicing disclosure
      ELSIF _combined_text ~ '(meeting|planning|participate|disclosure|practice|plan)' THEN
        _points := 15;
      -- +30 → Leading a meeting, independent advocacy in community/work
      ELSIF _combined_text ~ '(lead meeting|advocacy|independent|community|advocate)' THEN
        _points := 30;
      END IF;
      
    WHEN 'health_wellbeing' THEN
      -- +5 → Logging exercise, meals, sleep, or mindfulness
      IF _combined_text ~ '(log|exercise|meal|sleep|mindfulness|track|journal)' THEN
        _points := 5;
      -- +10 → Attending therapy, group wellness activity
      ELSIF _combined_text ~ '(therapy|wellness|group|counseling|support group)' THEN
        _points := 10;
      -- +20 → 30-day streak or maintaining a medical plan
      ELSIF _combined_text ~ '(30-day|streak|medical plan|maintain|health plan)' THEN
        _points := 20;
      END IF;
  END CASE;
  
  RETURN _points;
END;
$$;

-- Function to award points when step is completed
CREATE OR REPLACE FUNCTION public.award_step_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _goal_record RECORD;
  _points INTEGER;
  _category TEXT;
BEGIN
  -- Only award points when step status changes to 'done'
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    -- Get goal information
    SELECT title, domain, owner_id INTO _goal_record
    FROM goals 
    WHERE id = NEW.goal_id;
    
    -- Map goal domain to category
    _category := CASE _goal_record.domain
      WHEN 'independent-living' THEN 'independent_living'
      WHEN 'postsecondary' THEN 'postsecondary_learning'
      WHEN 'recreation' THEN 'recreation_fun'
      WHEN 'social' THEN 'social_skills'
      WHEN 'employment' THEN 'employment'
      WHEN 'self-advocacy' THEN 'self_advocacy_life_skills'
      WHEN 'health' THEN 'health_wellbeing'
      ELSE 'general'
    END;
    
    -- Calculate points based on category and step details
    _points := calculate_step_points(_category, NEW.title, NEW.notes);
    
    -- Use manual points override if provided
    IF NEW.points IS NOT NULL THEN
      _points := NEW.points;
    END IF;
    
    -- Upsert points for this category
    INSERT INTO user_points (user_id, category, total_points)
    VALUES (_goal_record.owner_id, _category, _points)
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
      total_points = user_points.total_points + _points,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;