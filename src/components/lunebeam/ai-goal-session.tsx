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
  sender: 'user' | 'luna';
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
    // Initialize conversation with Luna
    const welcomeMessage: Message = {
      id: '1',
      content: `Hi! I'm Luna, and I'm excited to help you create a goal in ${categoryNames[category as keyof typeof categoryNames]}! 🌟

Let's start by learning about your experience in this area. What interests you most about ${categoryNames[category as keyof typeof categoryNames].toLowerCase()}, and what would you like to improve or achieve?`,
      sender: 'luna',
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
        question: `Help the user create a ${category} goal. Current conversation: ${conversationHistory}. 
        
        If this seems like enough information to create a goal, respond with "GOAL_READY:" followed by a JSON object with:
        {
          "title": "goal title",
          "description": "detailed description", 
          "steps": ["step 1", "step 2", "step 3"],
          "timeEstimate": "time per day estimate"
        }
        
        Otherwise, continue asking probing questions to understand their experience and desired outcomes.`,
        userSnapshot: profile,
        currentGoals: goals,
        context: `goal_creation_${category}`
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
              content: `Perfect! I've gathered enough information to create your goal. Here's what I've understood:

**Goal: ${goalData.title}**

${goalData.description}

**Suggested steps:**
${goalData.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

**Estimated time:** ${goalData.timeEstimate}

Does this look good to you? I can create this as a 7-day micro-goal to get you started!`,
              sender: 'luna',
              timestamp: new Date()
            };

            setMessages(prev => [...prev, summaryMessage]);
            setSessionPhase('summarizing');
            
            // Store the goal data for creation
            (window as any).pendingGoal = { ...goalData, category };
            return;
          } catch (e) {
            console.error('Failed to parse goal JSON:', e);
          }
        }
      }

      // Regular conversation response
      const lunaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'luna',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, lunaMessage]);
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
                {message.sender === 'luna' && (
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
                  {message.content}
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
                  Luna is thinking...
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
                placeholder="Tell Luna about your interests and goals..."
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