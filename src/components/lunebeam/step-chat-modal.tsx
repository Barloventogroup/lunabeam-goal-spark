import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getLunaIcon } from '@/utils/iconGenerator';
import type { Step, Goal } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface StepChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: Step | null;
  goal: Goal | null;
  onStepsUpdate?: (newSteps: Step[]) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const StepChatModal: React.FC<StepChatModalProps> = ({
  isOpen,
  onClose,
  step,
  goal,
  onStepsUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate Luna icon URLs for different sizes
  const lunaIcon16 = getLunaIcon(16);
  const lunaIcon24 = getLunaIcon(24);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation when modal opens with a step
  useEffect(() => {
    if (isOpen && step && !isInitialized) {
      initializeConversation();
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setMessages([]);
    }
  }, [isOpen, step, isInitialized]);

  const initializeConversation = () => {
    const initialMessage: ChatMessage = {
      id: `init-${Date.now()}`,
      role: 'assistant',
      content: `Hi! I'm Luna, and I'm here to help you with this step: "${step?.title}"\n\nI can help you:\n• Break this down into smaller, more manageable pieces\n• Clarify what exactly needs to be done\n• Provide specific examples or resources\n• Create additional sub-steps if needed\n\nWhat specifically would you like help with?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !step || !goal) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('step-assistance', {
        body: {
          step: {
            id: step.id,
            title: step.title,
            notes: step.notes,
            explainer: step.explainer,
            estimated_effort_min: step.estimated_effort_min
          },
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            domain: goal.domain
          },
          userMessage: inputValue.trim(),
          conversationHistory: messages.slice(-6) // Last 6 messages for context
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if new steps were suggested
      if (data.suggestedSteps && data.suggestedSteps.length > 0) {
        toast({
          title: "New sub-steps suggested!",
          description: `I've suggested ${data.suggestedSteps.length} additional steps to help break this down.`
        });

        if (onStepsUpdate) {
          onStepsUpdate(data.suggestedSteps);
        }
      }

    } catch (error) {
      console.error('Error getting step assistance:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <img src={lunaIcon16} alt="Luna" className="h-4 w-4" />
            Luna
          </DialogTitle>
          {step && (
            <p className="text-xs text-muted-foreground truncate">
              Helping with: "{step.title}"
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <img src={lunaIcon16} alt="Luna" className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-2 rounded-lg whitespace-pre-wrap text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <img src={lunaIcon16} alt="Luna" className="h-3 w-3" />
                  </div>
                  <div className="bg-muted p-2 rounded-lg">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t pt-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Luna for help breaking down this step..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};