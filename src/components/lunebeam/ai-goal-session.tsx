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
      content: `Hey 👋 Want to set a new goal today?

I'm Lune, and I'm here to help you figure out something fun for ${categoryNames[category as keyof typeof categoryNames]}.

What feels most helpful right now?`,
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
        question: `You are Lune, a casual buddy helping teens and young adults set goals. Follow these rules:

CONVERSATION STYLE:
- Keep messages SHORT (1-2 lines max)
- Ask ONE question per step
- Always provide 2-4 choice buttons with emoji
- Include "Not sure" option every time
- Sound like a supportive friend, not a coach
- Use everyday language
- Respect their autonomy

GOAL SETTING FLOW for ${categoryNames[category as keyof typeof categoryNames]}:
1. First ask: "What feels most helpful right now?" 
   Options: 🌱 Build confidence | 🧠 Learn something new | 🤝 Connect with others | 🎨 Make/create something | ❓ Not sure

2. Then ask: "What's one small thing you want to try?"
   Give 3-4 specific options for their area

3. Ask: "How big do you want this goal to be?"
   Options: 🌱 Small (10-15 min) | 🌿 Medium (20-30 min) | 🌳 Big (45+ min) | ❓ Not sure

4. When ready, create goal with: "GOAL_READY:" + JSON

Current conversation: ${conversationHistory}

If you have enough info (specific activity, size preference), respond with "GOAL_READY:" + this JSON:
{
  "selected_goal": {
    "title": "goal title",
    "week_plan": {
      "steps": ["day 1-3 action", "day 4-5 action", "day 6-7 action"],
      "time_per_day": "based on their size choice",
      "success_criteria": ["what success looks like"],
      "too_hard_try": ["easier backup plan"]
    }
  }
}

Otherwise, ask your next question with 2-4 choice buttons. Keep it friendly and short!`,
        userSnapshot: profile,
        currentGoals: goals,
        context: `goal_setting_${category}`
      });

      let responseContent = response?.guidance || response || 'Hmm, not sure I got that. Want to try again?';

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
              content: `Cool! Here's your goal:

**${goalData.selected_goal?.title || goalData.candidate_ideas?.[0]?.title}**

Your week: ${goalData.selected_goal?.week_plan?.steps?.join(' → ') || 'Steps that work for you'}

Time: ${goalData.selected_goal?.week_plan?.time_per_day || '15-30 min/day'}

Sound good?`,
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
                placeholder="Chat with Lune..."
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