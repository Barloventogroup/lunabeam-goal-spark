import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';

interface PersonalizedGreetingProps {
  onResumeGoal?: () => void;
  onNewGoal?: () => void;
  onTodaysSteps?: () => void;
}

export const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({
  onResumeGoal,
  onNewGoal,
  onTodaysSteps
}) => {
  const { profile } = useStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      const name = profile?.first_name || 'friend';

      if (hour < 12) {
        return `Good morning, ${name} 👋 Ready for a win?`;
      } else if (hour < 17) {
        return `Hey ${name} 🙂 Want to take a small step?`;
      } else {
        return `Welcome back, ${name} 🌙 One little goal before bed?`;
      }
    };

    setGreeting(getTimeBasedGreeting());
  }, [profile]);

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="space-y-4">
        <p className="text-foreground text-base">{greeting}</p>
        
        <div className="flex flex-wrap gap-2">
          {onResumeGoal && (
            <Button 
              variant="outline" 
              onClick={onResumeGoal}
              className="flex items-center gap-2"
            >
              ▶️ Resume
            </Button>
          )}
          
          {onNewGoal && (
            <Button 
              variant="outline" 
              onClick={onNewGoal}
              className="flex items-center gap-2"
            >
              ➕ New Goal
            </Button>
          )}
          
          {onTodaysSteps && (
            <Button 
              variant="outline" 
              onClick={onTodaysSteps}
              className="flex items-center gap-2"
            >
              📅 Today's Steps
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};