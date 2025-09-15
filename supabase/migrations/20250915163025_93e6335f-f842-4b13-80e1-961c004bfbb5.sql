-- Remove duplicate substeps, keeping only the earliest created one for each step_id + title combination
DELETE FROM substeps 
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY step_id, title 
                ORDER BY created_at ASC
            ) as rn
        FROM substeps
    ) ranked
    WHERE rn > 1
);