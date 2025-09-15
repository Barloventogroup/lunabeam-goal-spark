-- Create a function to normalize substep titles for semantic comparison
CREATE OR REPLACE FUNCTION normalize_substep_title(title TEXT) 
RETURNS TEXT AS $$
BEGIN
  IF title IS NULL THEN 
    RETURN '';
  END IF;
  
  -- Convert to lowercase and normalize whitespace
  title := lower(regexp_replace(title, '\s+', ' ', 'g'));
  
  -- Replace common punctuation and separators
  title := regexp_replace(title, '[—–-]', ' ', 'g');
  title := regexp_replace(title, '&', ' and ', 'g');
  title := regexp_replace(title, '[^a-z0-9\s]', ' ', 'g');
  
  -- Semantic normalization for common cooking step variations
  title := regexp_replace(title, '\bfollow the recipe step by step\b', 'follow recipe step', 'g');
  title := regexp_replace(title, '\bfollow the steps?\b', 'follow recipe step', 'g');
  title := regexp_replace(title, '\bgather ingredients\s*(and|\&)\s*tools\b', 'gather ingredients tools', 'g');
  title := regexp_replace(title, '\bplate(\s*(and|\&)\s*|\s*)clean up\b', 'plate clean', 'g');
  title := regexp_replace(title, '\bchoose\b', 'pick', 'g');
  title := regexp_replace(title, '\bselect\b', 'pick', 'g');
  title := regexp_replace(title, '\bsimple recipe\b', 'recipe', 'g');
  
  -- Clean up extra whitespace
  title := trim(regexp_replace(title, '\s+', ' ', 'g'));
  
  RETURN title;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Merge semantically duplicate substeps
DO $$
DECLARE
  duplicate_groups RECORD;
  keeper_substep RECORD;
  duplicate_substep RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Find groups of substeps with the same normalized title within each step
  FOR duplicate_groups IN
    SELECT 
      step_id,
      normalize_substep_title(title) as normalized_title,
      array_agg(id ORDER BY 
        CASE WHEN completed_at IS NOT NULL THEN 0 ELSE 1 END,  -- Completed first
        created_at ASC  -- Then earliest created
      ) as substep_ids
    FROM substeps
    WHERE normalize_substep_title(title) != ''
    GROUP BY step_id, normalize_substep_title(title)
    HAVING count(*) > 1
  LOOP
    -- Keep the first substep (completed and/or earliest)
    SELECT * INTO keeper_substep 
    FROM substeps 
    WHERE id = duplicate_groups.substep_ids[1];
    
    -- Delete the duplicates
    FOR i IN 2..array_length(duplicate_groups.substep_ids, 1) LOOP
      SELECT * INTO duplicate_substep
      FROM substeps
      WHERE id = duplicate_groups.substep_ids[i];
      
      -- If the duplicate is completed but keeper isn't, update keeper
      IF duplicate_substep.completed_at IS NOT NULL AND keeper_substep.completed_at IS NULL THEN
        UPDATE substeps 
        SET 
          completed_at = duplicate_substep.completed_at,
          points_awarded = duplicate_substep.points_awarded
        WHERE id = keeper_substep.id;
      END IF;
      
      -- Delete the duplicate
      DELETE FROM substeps WHERE id = duplicate_substep.id;
      deleted_count := deleted_count + 1;
      
      RAISE NOTICE 'Merged duplicate substep: "%" -> "%"', duplicate_substep.title, keeper_substep.title;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Auto-merge complete: Removed % duplicate substeps', deleted_count;
END;
$$;

-- Clean up the helper function
DROP FUNCTION normalize_substep_title(TEXT);