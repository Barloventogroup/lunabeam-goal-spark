import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIService } from '@/services/aiService';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'luna';
  timestamp: Date;
}

interface AIChatProps {
  context?: 'onboarding' | 'reflection' | 'general';
  goalId?: string;
  reflection?: string;
}

export function AIChat({ context = 'general', goalId, reflection }: AIChatProps) {
  const getInitialMessage = () => {
    switch (context) {
      case 'onboarding':
        return `Hi! I'm Lune, your personal AI assistant. I'm excited to get to know you better! Let's start with the basics - what's your first name?`;
      case 'reflection':
        return `Hi! I'm here to help you reflect on your progress. How did your goal work go today?`;
      default:
        return `Hi! I'm Luna, your AI coach. I'm here to help you achieve your goals. How can I support you today?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: getInitialMessage(),
      sender: 'luna',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
      let aiResponse: any;

      switch (context) {
        case 'onboarding':
          aiResponse = await AIService.getOnboardingGuidance({
            step: 'goal_suggestion'
          });
          break;
        case 'reflection':
          if (reflection) {
            aiResponse = await AIService.analyzeReflection({
              reflection,
              goalContext: goalId ? { id: goalId, title: 'Current Goal' } : undefined
            });
          } else {
            aiResponse = await AIService.getCoachingGuidance({
              question: input.trim(),
              context: goalId
            });
          }
          break;
        default:
          aiResponse = await AIService.getCoachingGuidance({
            question: input.trim(),
            context: goalId
          });
          break;
      }

      // Extract the guidance text from the response object
      const responseText = aiResponse?.guidance || aiResponse || 'Sorry, I had trouble understanding that. Could you try asking again?';

      const lunaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        sender: 'luna',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, lunaMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Sorry, I'm having trouble responding right now. Please try again.",
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

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Luna - Your AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
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
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
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
                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                  Luna is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Luna for guidance..."
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}