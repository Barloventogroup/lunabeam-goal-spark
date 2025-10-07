-- Create safety violations log table
CREATE TABLE public.safety_violations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Violation context
  violation_layer TEXT NOT NULL CHECK (violation_layer IN ('layer_1_keywords', 'layer_2_generation', 'layer_3_judge')),
  goal_title TEXT NOT NULL,
  goal_category TEXT,
  motivation TEXT,
  barriers TEXT,
  
  -- Detection details
  triggered_keywords TEXT[], -- For Layer 1
  ai_response TEXT, -- Raw AI response if applicable
  violation_reason TEXT, -- Human-readable reason
  
  -- User context
  user_email TEXT,
  is_self_registered BOOLEAN,
  
  -- Compliance tracking
  compliance_notified BOOLEAN DEFAULT false,
  supporter_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.safety_violations_log ENABLE ROW LEVEL SECURITY;

-- Only admins/compliance can view violations
CREATE POLICY "Compliance team can view all violations"
  ON public.safety_violations_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- System can insert violations
CREATE POLICY "System can insert violations"
  ON public.safety_violations_log FOR INSERT
  WITH CHECK (true);

-- System can update notifications
CREATE POLICY "System can update notifications"
  ON public.safety_violations_log FOR UPDATE
  USING (true);

-- Create indexes for compliance queries
CREATE INDEX idx_safety_violations_created ON public.safety_violations_log(created_at DESC);
CREATE INDEX idx_safety_violations_user ON public.safety_violations_log(user_id);
CREATE INDEX idx_safety_violations_layer ON public.safety_violations_log(violation_layer);