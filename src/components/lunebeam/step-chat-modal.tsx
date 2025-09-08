import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Loader2, X } from 'lucide-react';
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
  const [shouldHideInput, setShouldHideInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate Luna icons for different sizes (same design for all uses)
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
      setShouldHideInput(false);
    }
  }, [isOpen, step, isInitialized]);

  useEffect(() => {
    if (isOpen && !shouldHideInput) {
      // Delay to ensure the dialog is mounted
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, shouldHideInput]);

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

      // Check if we should redirect (reached chat limit)
      if (data.shouldRedirect) {
        setShouldHideInput(true);
        // Don't auto-close - let user close manually when ready
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

  const stripMarkup = (text: string): string => {
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
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks to max 2
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .replace(/[ \t]+/g, ' '); // Normalize spaces and tabs
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Prevent global shortcuts (like '/') from hijacking input
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] h-[80vh] sm:h-[600px] flex flex-col z-[60] p-4 sm:p-6" onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-normal">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-normal">L</span>
            </div>
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
                     <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                       <span className="text-white text-xs font-normal">L</span>
                     </div>
                  )}
                   <div
                     className={`max-w-[80%] p-2 rounded-lg text-sm ${
                       message.role === 'user'
                         ? 'bg-primary text-primary-foreground ml-auto'
                         : 'bg-muted'
                     }`}
                     style={{ whiteSpace: 'pre-line' }}
                   >
                    {stripMarkup(message.content)}
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
                   <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                     <span className="text-white text-xs font-normal">L</span>
                   </div>
                  <div className="bg-muted p-2 rounded-lg">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t pt-3 mt-4 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Luna for help..."
                disabled={isLoading}
                className="flex-1 text-sm"
                autoFocus
                ref={inputRef}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="px-3 py-2 h-9 w-auto min-w-[40px] flex-shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            {shouldHideInput && (
              <p className="text-xs text-muted-foreground mt-2">
                Chat session completed. Close this window to return to your steps.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};