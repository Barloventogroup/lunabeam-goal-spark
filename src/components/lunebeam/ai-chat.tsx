import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AIService } from '@/services/aiService';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'lune';
  timestamp: Date;
  data?: any;
  choices?: string[];
}

interface AIChatProps {
  context?: 'onboarding' | 'reflection' | 'general';
  goalId?: string;
  reflection?: string;
  userSnapshot?: any;
  currentGoals?: any[];
  onUserMessage?: (text: string) => void;
  onLuneMessage?: (text: string) => void;
}

export function AIChat({ context = 'general', goalId, reflection, userSnapshot, currentGoals, onUserMessage, onLuneMessage }: AIChatProps) {
  const getInitialMessage = () => {
    switch (context) {
      case 'onboarding':
        return `Hey 👋 I'm Lune!

What should I call you?`;
      case 'reflection':
        return `Hey! How did your goal go today?

Want to share what happened?`;
      default:
        return `Hey 👋 I'm Lune, your buddy for goals and stuff.

What's on your mind?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: getInitialMessage(),
      sender: 'lune',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChoiceClick = (choice: string) => {
    sendMessage(choice);
  };

  const sendMessage = async (messageText?: string) => {
    const input = messageText || inputMessage;
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    onUserMessage?.(input.trim());
    setInputMessage('');
    setIsLoading(true);

    try {
      let mode: 'onboarding' | 'goal_setting' | 'assist' = 'assist';
      if (context === 'onboarding') mode = 'onboarding';
      else if (context === 'reflection') mode = 'assist';

      const response = await AIService.getCoachingGuidance({
        question: input.trim(),
        mode,
        userSnapshot,
        currentGoals,
        context: context
      });

      console.log('AI Response:', response);

      // Simple response handling
      let messageContent = '';
      let messageData = null;

      if (response.response_text) {
        messageContent = response.response_text;
      } else if (response.guidance) {
        messageContent = response.guidance;
      } else {
        messageContent = typeof response === 'string' ? response : 'Hmm, not sure I got that. Want to try again?';
      }

      const luneMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        sender: 'lune',
        timestamp: new Date(),
        data: messageData
      };

      setMessages(prev => [...prev, luneMessage]);
      onLuneMessage?.(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Connection Issue",
        description: "I'm having trouble responding right now. Want to try again?",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Oops, having some trouble connecting. What do you want to do?",
        sender: 'lune',
        timestamp: new Date(),
        choices: ["Try again", "Take a break", "Something else"]
      };

      setMessages(prev => [...prev, errorMessage]);
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

  const formatMessage = (message: Message) => {
    const cleanContent = stripMarkup(message.content);
    return <p>{cleanContent}</p>;
  };

  return (
    <Card className="flex flex-col max-h-[70vh] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          Lune
          {context === 'onboarding' && (
            <Badge variant="secondary" className="text-xs">Getting to know you</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="pr-4 max-h-[50vh]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'lune' && (
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                  }`}>
                    {formatMessage(message)}
                  </div>
                  
                  {/* Quick reply choices */}
                  {message.choices && message.choices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.choices.map((choice, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleChoiceClick(choice)}
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        <div className="flex gap-2 mt-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Helper text for accessibility */}
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {context === 'onboarding' && "No rush - you can share more anytime"}
          {context === 'reflection' && "Share whatever feels right"}
          {context === 'general' && "I'm here when you need me"}
        </div>
      </CardContent>
    </Card>
  );
}