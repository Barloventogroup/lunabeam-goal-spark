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
import { RoundBasedSuggestionEngine } from './round-based-suggestion-engine';

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
  const [sessionPhase, setSessionPhase] = useState<'greeting' | 'suggestions' | 'summarizing' | 'complete'>('greeting');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
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

I'm Lune, and I'm here to help you figure out something fun for ${categoryNames[category as keyof typeof categoryNames]}.`,
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

  const handleGreetingResponse = (response: 'yes' | 'no') => {
    if (response === 'yes') {
      setSessionPhase('suggestions');
      const luneMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Cool! Let me suggest some ideas for you.',
        sender: 'lune',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, luneMessage]);
    } else {
      const luneMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'No worries! Come back anytime you want to set a goal 😊',
        sender: 'lune',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, luneMessage]);
      setTimeout(() => onBack(), 1500);
    }
  };

  const handleSuggestionSelected = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    
    // Create goal directly with follow-up context - NO SIZE SELECTION
    const goalTitle = suggestion.followUpChoice 
      ? `${suggestion.text} - ${suggestion.followUpChoice}`
      : suggestion.text;
    
    const convertedGoal = {
      title: goalTitle,
      description: `A ${category} goal: ${suggestion.text}`,
      category: category,
      steps: [
        'Start with a small step',
        'Keep going at your pace', 
        'Celebrate your progress'
      ],
      timeEstimate: '15-30 minutes'
    };

    const summaryMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `Perfect! Here's your goal:

**${convertedGoal.title}**

This should take about ${convertedGoal.timeEstimate}.

Sound good?`,
      sender: 'lune',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, summaryMessage]);
    setSessionPhase('summarizing');
    (window as any).pendingGoal = convertedGoal;
  };

  const handleMetaAction = (action: 'new_ideas' | 'explain' | 'write_own' | 'pause') => {
    switch (action) {
      case 'new_ideas':
        // Reset suggestions to show new ideas
        setSessionPhase('suggestions');
        const newIdeasMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sure! Let me show you some fresh ideas.',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newIdeasMessage]);
        break;
      case 'write_own':
        setSessionPhase('complete');
        const writeOwnMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Perfect! What goal would you like to work on? Just type it below.',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, writeOwnMessage]);
        break;
      case 'pause':
        const pauseMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'All good! Take your time. Come back whenever you feel ready 😊',
          sender: 'lune',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, pauseMessage]);
        setTimeout(() => onBack(), 1500);
        break;
    }
  };

  // REMOVED handleSizeSelected - no more size questions!

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

    if (sessionPhase === 'complete') {
      // User is writing their own goal
      const convertedGoal = {
        title: input.trim(),
        description: 'Custom goal',
        category: category,
        steps: ['Day 1-3: Get started', 'Day 4-5: Keep going', 'Day 6-7: Finish strong'],
        timeEstimate: '30 minutes per day'
      };

      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Love it! Here's your goal:

**${convertedGoal.title}**

Your week: ${convertedGoal.steps.join(' → ')}

Sound good?`,
        sender: 'lune',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
      setSessionPhase('summarizing');
      (window as any).pendingGoal = convertedGoal;
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
          {sessionPhase === 'greeting' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleGreetingResponse('no')}
                className="flex-1"
              >
                Not now
              </Button>
              <Button 
                onClick={() => handleGreetingResponse('yes')}
                className="flex-1"
              >
                Yes, let's go
              </Button>
            </div>
          ) : sessionPhase === 'suggestions' ? (
            <RoundBasedSuggestionEngine
              category={category}
              onSelectOption={handleSuggestionSelected}
              onMetaAction={handleMetaAction}
            />
          ) : sessionPhase === 'summarizing' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSessionPhase('suggestions')}
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
                placeholder="Tell me your goal idea..."
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