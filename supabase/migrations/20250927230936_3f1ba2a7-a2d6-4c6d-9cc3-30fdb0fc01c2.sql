-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create granular policies for notifications table

-- SELECT: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Allow notification creation with proper permissions
CREATE POLICY "Allow notification creation with proper permissions" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Users can create notifications for themselves
  user_id = auth.uid() 
  OR 
  -- Supporters can create notifications for their individuals
  EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE supporter_id = auth.uid() 
    AND individual_id = notifications.user_id
  )
  OR
  -- Individuals can create notifications for their supporters/admins
  EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = auth.uid() 
    AND supporter_id = notifications.user_id
  )
);

-- UPDATE: Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());