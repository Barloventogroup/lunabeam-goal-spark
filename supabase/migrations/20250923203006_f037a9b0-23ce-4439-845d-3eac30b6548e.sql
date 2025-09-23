-- Fix search_path issues in existing functions
CREATE OR REPLACE FUNCTION public.calculate_step_points(step_title text, step_notes text DEFAULT ''::text, goal_domain text DEFAULT ''::text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  pts integer := 5; -- safe default
  category text;
  combined_text text;
BEGIN
  -- Never let this function fail - always return a valid point value
  BEGIN
    IF step_title IS NULL OR step_title = '' THEN
      RETURN 5;
    END IF;

    -- Map domain to category
    category := CASE lower(goal_domain)
      WHEN 'independent-living' THEN 'independent_living'
      WHEN 'education' THEN 'education'
      WHEN 'postsecondary' THEN 'postsecondary'
      WHEN 'recreation' THEN 'recreation_fun'
      WHEN 'social' THEN 'social_skills'
      WHEN 'employment' THEN 'employment'
      WHEN 'self-advocacy' THEN 'self_advocacy'
      WHEN 'health' THEN 'health'
      ELSE 'general'
    END;

    -- Combine title and notes for analysis
    combined_text := lower(step_title || ' ' || COALESCE(step_notes, ''));

    -- Calculate points based on category and keywords
    CASE category
      WHEN 'independent_living' THEN
        IF combined_text ~* '(daily|chore|hygiene|clean|brush|shower|bath|wash)' THEN
          pts := 5;
        ELSIF combined_text ~* '(safety|cook|money|budget|finance|bank|shop|grocery)' THEN
          pts := 10;
        ELSIF combined_text ~* '(travel|alone|independent|weekly.budget|milestone|major)' THEN
          pts := 20;
        ELSE
          pts := 5;
        END IF;

      WHEN 'education' THEN
        IF combined_text ~* '(homework|study|class|participation|complete|assignment)' THEN
          pts := 5;
        ELSIF combined_text ~* '(project|test.prep|group.work|finish|research)' THEN
          pts := 10;
        ELSIF combined_text ~* '(exam|pass|term|present|milestone|graduate)' THEN
          pts := 20;
        ELSE
          pts := 5;
        END IF;

      WHEN 'postsecondary' THEN
        IF combined_text ~* '(study|homework|practice|quiz|session)' THEN
          pts := 5;
        ELSIF combined_text ~* '(campus|visit|group.project|test.prep)' THEN
          pts := 15;
        ELSIF combined_text ~* '(application|submit|certificate|earn)' THEN
          pts := 25;
        ELSE
          pts := 5;
        END IF;

      WHEN 'recreation_fun' THEN
        IF combined_text ~* '(solo|hobby|art|game|draw|paint|music)' THEN
          pts := 5;
        ELSIF combined_text ~* '(group|friend|invite|social|recreation)' THEN
          pts := 10;
        ELSIF combined_text ~* '(lead|leading|organize|4.week|streak|event)' THEN
          pts := 20;
        ELSE
          pts := 5;
        END IF;

      WHEN 'social_skills' THEN
        IF combined_text ~* '(greet|introduction|role.play|hello|short)' THEN
          pts := 5;
        ELSIF combined_text ~* '(group.conversation|join|activity|participate)' THEN
          pts := 15;
        ELSIF combined_text ~* '(lead|leading|presentation|present|10.*interaction)' THEN
          pts := 25;
        ELSE
          pts := 5;
        END IF;

      WHEN 'employment' THEN
        IF combined_text ~* '(career|interest|assessment|resume|draft)' THEN
          pts := 5;
        ELSIF combined_text ~* '(job.shadow|mock.interview|volunteer)' THEN
          pts := 15;
        ELSIF combined_text ~* '(job.application|interview|workday|first.day)' THEN
          pts := 30;
        ELSE
          pts := 5;
        END IF;

      WHEN 'self_advocacy' THEN
        IF combined_text ~* '(ask|help|choice|decide|making.choice)' THEN
          pts := 5;
        ELSIF combined_text ~* '(meeting|planning|participate|disclosure|practice)' THEN
          pts := 15;
        ELSIF combined_text ~* '(lead.meeting|advocacy|independent|community)' THEN
          pts := 30;
        ELSE
          pts := 5;
        END IF;

      WHEN 'health' THEN
        IF combined_text ~* '(log|exercise|meal|sleep|mindfulness|track)' THEN
          pts := 5;
        ELSIF combined_text ~* '(therapy|wellness|group|counseling|attend)' THEN
          pts := 10;
        ELSIF combined_text ~* '(30.day|streak|medical.plan|maintain)' THEN
          pts := 20;
        ELSE
          pts := 5;
        END IF;

      ELSE
        pts := 5;
    END CASE;

    RETURN pts;
  EXCEPTION WHEN others THEN
    -- If anything goes wrong, return default
    RETURN 5;
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_invite_by_token(_token text)
 RETURNS TABLE(id uuid, role user_role, permission_level permission_level, invitee_name text, message text, status invite_status, expires_at timestamp with time zone, inviter_name text, masked_email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    i.id,
    i.role,
    i.permission_level,
    i.invitee_name,
    i.message,
    i.status,
    i.expires_at,
    COALESCE(p.first_name, 'Someone') as inviter_name,
    CASE 
      WHEN LENGTH(i.invitee_email) > 0 THEN 
        SUBSTRING(i.invitee_email, 1, 1) || '***@' || SPLIT_PART(i.invitee_email, '@', 2)
      ELSE NULL
    END as masked_email
  FROM public.supporter_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.inviter_id
  WHERE i.invite_token = _token 
    AND i.status = 'pending'
    AND i.expires_at > now();
$function$;