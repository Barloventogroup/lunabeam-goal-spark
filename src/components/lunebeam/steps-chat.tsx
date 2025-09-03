import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, ArrowLeft } from 'lucide-react';
import type { Goal, Step } from '@/types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface StepsChatProps {
  goal: Goal;
  steps: Step[];
  isOpen: boolean;
  onClose: () => void;
}

export const StepsChat: React.FC<StepsChatProps> = ({ goal, steps, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [offTopicWarningShown, setOffTopicWarningShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hi! I'm here to help with your goal: "${goal.title}". Ask me anything about your steps, how to tackle them, or what to do if you're stuck. Let's keep this focused on your current goal and steps.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, goal.title, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if message is about current goal/steps
      const isOnTopic = isMessageOnTopic(input.trim());
      
      if (!isOnTopic) {
        if (!offTopicWarningShown) {
          const warningMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Let's keep this chat focused on your current steps. You can explore other features from the home screen.",
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, warningMessage]);
          setOffTopicWarningShown(true);
        } else {
          // End chat after second off-topic message
          const endMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "I'll help you get back to your plan now. Feel free to return when you have questions about your current goal and steps!",
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, endMessage]);
          setTimeout(() => onClose(), 2000);
        }
        setIsLoading(false);
        return;
      }

      // Reset off-topic warning if back on topic
      setOffTopicWarningShown(false);

      // TODO: Implement actual AI response
      // For now, provide helpful responses based on keywords
      const response = generateResponse(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble right now. Try asking again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isMessageOnTopic = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const goalWords = goal.title.toLowerCase().split(' ');
    const stepWords = steps.flatMap(s => s.title.toLowerCase().split(' '));
    
    // Keywords that indicate goal/step-related questions
    const onTopicKeywords = [
      'step', 'steps', 'how', 'why', 'when', 'what', 'where',
      'start', 'begin', 'next', 'order', 'sequence', 'help',
      'stuck', 'confused', 'difficult', 'hard', 'easy',
      'skip', 'done', 'complete', 'finish', 'progress',
      ...goalWords,
      ...stepWords
    ];

    // Off-topic indicators
    const offTopicKeywords = [
      'weather', 'news', 'sports', 'movie', 'music', 'recipe',
      'different goal', 'other goal', 'new goal', 'change goal',
      'account', 'profile', 'settings', 'logout', 'delete'
    ];

    const hasOffTopicWords = offTopicKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    const hasOnTopicWords = onTopicKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    return !hasOffTopicWords && hasOnTopicWords;
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('too big') || lowerInput.includes('overwhelming')) {
      return "I hear you! When a step feels too big, try breaking it into 2-3 smaller actions. What part of this step could you do in just 2-5 minutes?";
    }
    
    if (lowerInput.includes('confused') || lowerInput.includes('don\'t understand')) {
      return "No worries! Let me help clarify. Which specific step is confusing? I can break down what it means and why it's important for your goal.";
    }
    
    if (lowerInput.includes('where to start') || lowerInput.includes('first step')) {
      const firstStep = steps.find(s => s.precursors.length === 0);
      if (firstStep) {
        return `Start with "${firstStep.title}". ${firstStep.explainer || 'This is a good first step because it has no dependencies and will unlock other steps.'}`;
      }
      return "Look for the step with no dependencies - that's usually the best place to start!";
    }
    
    if (lowerInput.includes('order') || lowerInput.includes('sequence')) {
      return "Your steps are ordered by dependencies. Complete steps with no blockers first, then move to the ones they unlock. The checkboxes will guide you!";
    }
    
    if (lowerInput.includes('skip') || lowerInput.includes('not relevant')) {
      return "That's totally fine! Everyone's path is different. You can mark a step as 'Not relevant' from the menu, and we'll hide it for you.";
    }
    
    if (lowerInput.includes('stuck') || lowerInput.includes('help')) {
      return "When you're stuck, try the 'More help' option on the step for extra guidance. Or tell me which specific step is giving you trouble!";
    }
    
    return "I'm here to help with your current goal and steps. What specific step would you like guidance on, or what part of your goal feels unclear?";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md h-96 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">StepCoach</CardTitle>
            <p className="text-sm text-muted-foreground">
              Help with: {goal.title}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Ask about your steps..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};