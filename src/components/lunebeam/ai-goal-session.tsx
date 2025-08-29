import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  ArrowLeft,
  Target,
  Clock,
  Calendar
} from 'lucide-react';
import { AIService } from '@/services/aiService';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'lune';
  timestamp: Date;
}

interface ExtractedGoal {
  title: string;
  description: string;
  category: string;
  steps: string[];
  timeEstimate: string;
}

interface AIGoalSessionProps {
  category: string;
  onBack: () => void;
  onGoalCreated: (goal: ExtractedGoal) => void;
}

export const AIGoalSession: React.FC<AIGoalSessionProps> = ({ 
  category, 
  onBack, 
  onGoalCreated 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'probing' | 'summarizing' | 'complete'>('probing');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile, goals } = useStore();
  const { toast } = useToast();

  const categoryNames = {
    education: 'Education',
    employment: 'Employment', 
    independent_living: 'Independent Living',
    health: 'Health',
    social_skills: 'Social Skills'
  };

  useEffect(() => {
    // Initialize conversation with Lune following structured approach
    const welcomeMessage: Message = {
      id: '1',
      content: `Hey there! I'm Lune, and I'm here to help you figure out a goal that actually matters to you in ${categoryNames[category as keyof typeof categoryNames]}. 

What part of ${categoryNames[category as keyof typeof categoryNames].toLowerCase()} catches your interest? Here are some directions we could go:

• Picking up new skills or knowledge
• Getting more comfortable in this area  
• Meeting people who are into the same stuff
• Making or creating something
• Not sure yet - want to explore what's out there?

What sounds good to you?`,
      sender: 'lune',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [category]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context for the AI based on conversation history
      const conversationHistory = [...messages, userMessage]
        .map(m => `${m.sender}: ${m.content}`)
        .join('\n');

      const response = await AIService.getCoachingGuidance({
        question: `GLOBAL SYSTEM PROMPT:
You are Lune, a supportive buddy for teens and young adults. You're here to help them figure out goals that actually work for them.

Communication & tone:
- Casual, friendly, and real. Talk like a supportive friend would.
- Use everyday language. Ask "Want to try this?" instead of "Please select your preferred option."
- Give 2-4 choices when it helps. Break things into small steps.
- Remember their preferences once they tell you: how they like to be described, how fast they want to go, how much detail they want.

Boundaries:
- You're here for goal planning, not medical, legal, or crisis stuff.
- They decide what to share. Always ask before diving into personal topics.
- If someone mentions harm or crisis: stay calm, acknowledge what they said, suggest calling 911 or a crisis line. Be clear that you're not trained for emergencies.

Your approach:
- When someone faces a challenge, always suggest at least one way to make it easier.
- If you're not sure what they mean, just ask a simple question or give them a few options.
- Celebrate when they try stuff, not just when they succeed. If they seem overwhelmed, suggest taking a break.

MODE: GOAL-SETTING
You're helping them figure out a goal in ${categoryNames[category as keyof typeof categoryNames]}. 

Your job: Chat with them to understand what they want, then suggest 2-3 goals that could work (include at least one that's different but still fits them).
When you have enough info, create a simple 7-day goal with 3 steps max, 30 minutes a day or less.
Always give them ways to make it easier if it's too hard. Keep it real and judgment-free.

How to do this:
1. Ask ONE thing at a time so they don't get overwhelmed
2. Find out: what they're interested in, what they already know/can do, what they want to happen, how much time they actually have
3. When you know enough, respond with "GOAL_READY:" + JSON

Current conversation: ${conversationHistory}

If you have enough information (specific goal area, current skill level, desired outcome, and realistic timeframe), respond with "GOAL_READY:" followed by this JSON schema:
{
  "type": "goal_plan",
  "candidate_ideas": [
    {
      "title": "specific goal title",
      "why_it_fits": "connects to their interests/strengths",
      "first_tiny_step": "10-minute actionable step",
      "time_energy_estimate": "10-20 min, low energy",
      "supports": ["timers","checklists","buddy","quiet_space","shorter_steps"],
      "sensory_notes": "relevant sensory considerations",
      "done_when": "clear completion criteria"
    }
  ],
  "selected_goal": {
    "title": "chosen goal title",
    "week_plan": {
      "steps": ["day 1-3 step", "day 4-5 step", "day 6-7 step"],
      "time_per_day": "≤30 min",
      "success_criteria": ["measurable outcome 1", "measurable outcome 2"],
      "too_hard_try": ["easier version", "change environment", "buddy option"]
    },
    "check_ins": {"frequency": "once_midweek", "method": "in_app", "encourager": "self"},
    "rewards": ["user-chosen small reward"],
    "data_to_track": ["count_of_attempts","minutes_spent","confidence_1_5"]
  }
}

Otherwise, ask ONE simple question to get the info you need, in this order:
1. What part of ${categoryNames[category as keyof typeof categoryNames].toLowerCase()} interests you most?
2. What's your current experience with this stuff?
3. What do you want to happen/achieve?
4. How much time do you realistically have each day (10-30 minutes)?

Keep it simple, give them 2-4 options when it helps, and always include "Not sure yet" as a choice.`,
        userSnapshot: profile,
        currentGoals: goals,
        context: `goal_setting_${category}`
      });

      let responseContent = response?.guidance || response || 'I had trouble processing that. Could you tell me more?';

      // Check if AI is ready to create a goal
      if (responseContent.includes('GOAL_READY:')) {
        const jsonStart = responseContent.indexOf('{');
        const jsonEnd = responseContent.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          try {
            const goalData = JSON.parse(responseContent.substring(jsonStart, jsonEnd));
            
            // Show summary to user first
            const summaryMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Cool! I think I've got what you're looking for. Here's what I put together:

**Goal: ${goalData.selected_goal?.title || goalData.candidate_ideas?.[0]?.title}**

${goalData.selected_goal?.week_plan || goalData.candidate_ideas?.[0]?.why_it_fits}

**Your 7-day plan:**
${goalData.selected_goal?.week_plan?.steps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'Steps that work for you'}

**Time needed:** ${goalData.selected_goal?.week_plan?.time_per_day || goalData.candidate_ideas?.[0]?.time_energy_estimate}

**If it gets tough:** ${goalData.selected_goal?.week_plan?.too_hard_try?.join(', ') || 'Ways to make it easier'}

How does this look? Want me to set this up as your goal for the week?`,
              sender: 'lune',
              timestamp: new Date()
            };

            setMessages(prev => [...prev, summaryMessage]);
            setSessionPhase('summarizing');
            
            // Store the goal data for creation - convert to expected format
            const convertedGoal = {
              title: goalData.selected_goal?.title || goalData.candidate_ideas?.[0]?.title || 'Untitled Goal',
              description: goalData.selected_goal?.week_plan?.success_criteria?.join(' ') || goalData.candidate_ideas?.[0]?.why_it_fits || 'Goal description',
              category: category,
              steps: goalData.selected_goal?.week_plan?.steps || ['Step 1', 'Step 2', 'Step 3'],
              timeEstimate: goalData.selected_goal?.week_plan?.time_per_day || '30 minutes per day'
            };
            (window as any).pendingGoal = convertedGoal;
            return;
          } catch (e) {
            console.error('Failed to parse goal JSON:', e);
          }
        }
      }

      // Regular conversation response
      const luneMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'lune',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, luneMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "I'm having trouble right now. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stripMarkup = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/__(.*?)__/g, '$1') // Remove underline markdown
      .replace(/_(.*?)_/g, '$1') // Remove underscore italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/#+\s*(.*)/g, '$1') // Remove headers
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list markers to bullets
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
      .trim();
  };

  const confirmGoal = () => {
    const pendingGoal = (window as any).pendingGoal;
    if (pendingGoal) {
      onGoalCreated(pendingGoal);
      delete (window as any).pendingGoal;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-card/80 backdrop-blur">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Goal Creation Session</h1>
            <p className="text-sm text-muted-foreground">
              {categoryNames[category as keyof typeof categoryNames]}
            </p>
          </div>
          <Bot className="h-6 w-6 text-primary" />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'lune' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.sender === 'lune' ? stripMarkup(message.content) : message.content}
                </div>
                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm">
                  Lune is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input/Actions */}
        <div className="p-4 border-t bg-card/80 backdrop-blur">
          {sessionPhase === 'summarizing' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSessionPhase('probing')}
                className="flex-1"
              >
                Let me refine this
              </Button>
              <Button 
                onClick={confirmGoal}
                className="flex-1"
              >
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell Lune about your interests and goals..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};