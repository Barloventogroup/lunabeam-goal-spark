import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIChat } from './ai-chat';
import { useStore } from '@/store/useStore';

interface OnboardingConversationProps {
  roleData: { role: 'parent' | 'individual'; individualEmail?: string };
  onComplete: () => void;
}

export function OnboardingConversation({ roleData, onComplete }: OnboardingConversationProps) {
  const [canComplete, setCanComplete] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const { completeOnboarding } = useStore();

  // Allow completion after user has interacted for a bit
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanComplete(true);
    }, 30000); // Allow completion after 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = async () => {
    setShowCompletionMessage(true);
    
    // Complete onboarding in the store
    await completeOnboarding();
    
    // Short delay to show completion message
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const conversationContext = `
You are Lune, a friendly AI assistant helping with onboarding for Lunebeam, a goal-setting and achievement app.

IMPORTANT CONTEXT:
- User role: ${roleData.role}
${roleData.individualEmail ? `- Individual's email: ${roleData.individualEmail}` : ''}

YOUR TASK:
Ask about and collect information about the user's:
1. Basic information (name, age range if appropriate)
2. Strengths (what they're good at)
3. Challenges (what they find difficult)
4. Interests (what they enjoy or want to learn)

CONVERSATION STYLE:
- Be warm, encouraging, and conversational
- Ask one question at a time to avoid overwhelming them
- Acknowledge their responses positively
- Use natural follow-up questions
- Keep responses concise but friendly
- Remember this is for goal-setting, so focus on understanding their motivations and areas of interest

IMPORTANT:
- Don't ask for sensitive personal information
- Keep the conversation focused on understanding their strengths, challenges, and interests
- Be supportive and non-judgmental
- If they seem hesitant, reassure them that they can always add more details later

Start by introducing yourself and asking for their first name, then naturally progress through collecting their information.
  `;

  if (showCompletionMessage) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <Card className="p-8 shadow-card border-0 text-center max-w-md">
          <CardContent className="p-0">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Lunebeam!</h2>
            <p className="text-foreground-soft">
              Your profile is set up. Let's start building your goals and achieving great things together!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-foreground-soft">Step 2 of 2</span>
            <span className="text-sm text-foreground-soft">Building your profile...</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="space-y-4">
          <Card className="p-4 shadow-card border-0">
            <CardContent className="p-0">
              <h2 className="text-lg font-semibold mb-2">Let's get to know you!</h2>
              <p className="text-sm text-foreground-soft mb-4">
                I'll ask you a few questions to understand your strengths, interests, and goals. 
                You can stop anytime and continue building your profile later.
              </p>
            </CardContent>
          </Card>

          <AIChat context="onboarding" />

          {canComplete && (
            <Card className="p-4 shadow-card border-0 bg-muted/30">
              <CardContent className="p-0">
                <div className="text-center space-y-3">
                  <p className="text-sm text-foreground-soft">
                    Feel free to continue chatting, or you can move on to start setting your first goal.
                  </p>
                  <Button 
                    onClick={handleComplete}
                    className="w-full"
                  >
                    Start My Journey
                  </Button>
                  <p className="text-xs text-foreground-soft">
                    Don't worry - you can always come back and add more details to your profile anytime!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}