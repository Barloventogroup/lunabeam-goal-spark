import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getLunaIcon } from '@/utils/iconGenerator';
import type { Step, Goal } from '@/types';
import { cleanStepTitle } from '@/utils/stepUtils';
import { useToast } from '@/hooks/use-toast';

interface LunaChatScreenProps {
  isOpen: boolean;
  onClose: () => void;
  step: Step | null;
  goal: Goal | null;
  onStepsUpdate?: (newSteps: Step[]) => void;
  onStepsChange?: () => void;
  onOpenSubstepDrawer?: (stepId: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedSubstep?: {
    title: string;
    description: string;
    step_id: string;
    is_planned: boolean;
  };
}

export const LunaChatScreen: React.FC<LunaChatScreenProps> = ({
  isOpen,
  onClose,
  step,
  goal,
  onStepsUpdate,
  onStepsChange,
  onOpenSubstepDrawer
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldHideInput, setShouldHideInput] = useState(false);
  const [showGoalResetOptions, setShowGoalResetOptions] = useState(false);
  
  // Cooldown system state
  const [irrelevanceCount, setIrrelevanceCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [cooldownLevel, setCooldownLevel] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [requiresReflection, setRequiresReflection] = useState(false);
  const [reflectionQ1, setReflectionQ1] = useState('');
  const [reflectionQ2, setReflectionQ2] = useState('');
  const [reframingStatement, setReframingStatement] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
      setInputValue('');
      setShouldHideInput(false);
      setShowGoalResetOptions(false);
      // Reset cooldown state
      setIrrelevanceCount(0);
      setCooldownUntil(null);
      setCooldownLevel(0);
      setIsLocked(false);
      setRequiresReflection(false);
      setReflectionQ1('');
      setReflectionQ2('');
      setReframingStatement('');
    }
  }, [isOpen, step, isInitialized]);

  // Reset cooldown state when step changes
  useEffect(() => {
    if (step) {
      setIrrelevanceCount(0);
      setCooldownUntil(null);
      setCooldownLevel(0);
      setIsLocked(false);
      setRequiresReflection(false);
      setReflectionQ1('');
      setReflectionQ2('');
      setReframingStatement('');
    }
  }, [step?.id]);

  useEffect(() => {
    if (isOpen && !shouldHideInput) {
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
          conversationHistory: messages.slice(-6)
        }
      });

      if (error) throw error;

      // Handle COOLDOWN_ACTIVE classification
      if (data.classification === 'COOLDOWN_ACTIVE') {
        setCooldownUntil(data.cooldown_until);
        setCooldownLevel(data.cooldown_level);
        
        const checkCooldown = setInterval(() => {
          if (new Date(data.cooldown_until) <= new Date()) {
            clearInterval(checkCooldown);
            setCooldownUntil(null);
          }
        }, 1000);
      }

      // Handle REQUIRES_REFLECTION classification
      if (data.classification === 'REQUIRES_REFLECTION') {
        setIsLocked(true);
        setRequiresReflection(true);
      }

      // Handle SUPPORTER_REQUIRED classification
      if (data.classification === 'SUPPORTER_REQUIRED') {
        setIsLocked(true);
        toast({
          title: "Supporter Notified",
          description: "Your supporter has been notified that you need assistance.",
          variant: "default"
        });
      }

      // Handle GOAL_DRIFT classification
      if (data.classification === 'GOAL_DRIFT' && data.requiresGoalReset) {
        setShowGoalResetOptions(true);
      }

      // Update irrelevance count
      if (data.irrelevance_count !== undefined) {
        setIrrelevanceCount(data.irrelevance_count);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date(),
        suggestedSubstep: data.suggestedSubstep
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubstep = async (substep: any) => {
    if (!substep || !step) return;
    
    setIsLoading(true);
    try {
      const { data: newSubstep, error } = await supabase
        .from('steps')
        .insert({
          goal_id: step.goal_id,
          parent_step_id: step.id,
          title: substep.title,
          notes: substep.description,
          status: 'not_started',
          is_required: true,
          is_supporter_step: false,
          order_index: 999,
          is_planned: substep.is_planned || false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sub-step Added",
        description: `"${substep.title}" has been added to your plan.`,
        variant: "default"
      });

      if (onStepsChange) {
        onStepsChange();
      }

      const confirmationMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `Great! I've added "${substep.title}" to your plan. Is there anything else I can help you with?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    } catch (error) {
      console.error('Error adding substep:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to add sub-step: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReflection = async () => {
    if (!step || !reflectionQ1.trim() || !reflectionQ2.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('step-assistance', {
        body: {
          action: 'submit_reflection',
          stepId: step.id,
          reflectionQ1,
          reflectionQ2
        }
      });

      if (error) throw error;

      setRequiresReflection(false);
      setReframingStatement(data.reframing_statement);

      toast({
        title: "Reflection Submitted",
        description: "Thank you for your reflection.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error submitting reflection:', error);
      toast({
        title: "Error",
        description: "Failed to submit reflection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockChat = async () => {
    if (!step) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('step-assistance', {
        body: {
          action: 'unlock_chat',
          stepId: step.id
        }
      });

      if (error) throw error;

      setIsLocked(false);
      setRequiresReflection(false);
      setReflectionQ1('');
      setReflectionQ2('');
      setReframingStatement('');
      setCooldownUntil(null);
      setCooldownLevel(0);
      setIrrelevanceCount(0);

      toast({
        title: "Chat Unlocked",
        description: "You can now continue with your coaching session.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error unlocking chat:', error);
      toast({
        title: "Error",
        description: "Failed to unlock chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRemaining = (until: string): string => {
    const seconds = Math.ceil((new Date(until).getTime() - Date.now()) / 1000);
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  const stripMarkup = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#+\s*(.*)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[ \t]+/g, ' ');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  };

  if (!isOpen || !step || !goal) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-background flex flex-col pt-safe-only">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-xs font-medium">L</span>
            </div>
            <span className="text-base font-medium">Luna</span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            Helping with: "{cleanStepTitle(step.title)}"
          </span>
        </div>
      </header>

      {/* Main chat area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pb-safe-nav">
        {/* Cooldown Timer Display */}
        {cooldownUntil && new Date(cooldownUntil) > new Date() && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-900 dark:text-amber-100">
              Cooldown active: {getTimeRemaining(cooldownUntil)} remaining
            </span>
          </div>
        )}

        {/* Reflection Form */}
        {requiresReflection && !reframingStatement && (
          <div className="mx-4 mt-3 p-4 space-y-4 bg-muted rounded-lg">
            <h3 className="font-semibold">Mandatory Reflection</h3>
            <div>
              <label className="text-sm font-medium">Q1: What felt the hardest in the last 5 minutes?</label>
              <Textarea 
                value={reflectionQ1} 
                onChange={(e) => setReflectionQ1(e.target.value)}
                placeholder="Describe what was difficult..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Q2: If you could change one thing about the original Micro-Step, what would it be?</label>
              <Textarea 
                value={reflectionQ2} 
                onChange={(e) => setReflectionQ2(e.target.value)}
                placeholder="What would you change..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSubmitReflection}
              disabled={!reflectionQ1.trim() || !reflectionQ2.trim() || isLoading}
            >
              Submit Reflection
            </Button>
          </div>
        )}

        {/* Reframing Statement & Unlock Button */}
        {reframingStatement && (
          <div className="mx-4 mt-3 p-4 space-y-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm">{reframingStatement}</p>
            <Button onClick={handleUnlockChat} disabled={isLoading}>
              Reset Chat
            </Button>
          </div>
        )}

        {/* Scrollable messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 px-4 py-3 pb-24">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && message.suggestedSubstep ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-xs font-medium">L</span>
                    </div>
                    <div className="max-w-[80%] flex flex-col gap-2">
                      {message.content && (
                        <div className="bg-muted p-3 rounded-lg text-sm" style={{ whiteSpace: 'pre-line' }}>
                          {stripMarkup(message.content)}
                        </div>
                      )}
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-1">{message.suggestedSubstep.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{message.suggestedSubstep.description}</p>
                        <Button 
                          onClick={() => handleAddSubstep(message.suggestedSubstep)}
                          size="sm"
                          className="w-full"
                          disabled={isLoading}
                        >
                          Add to Plan
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-xs font-medium">L</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
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
                  </>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-xs font-medium">L</span>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-3" />
          </div>
        </ScrollArea>
      </div>

      {/* Input area - fixed at bottom, repositions above keyboard */}
      <div className="fixed left-0 right-0 bottom-0 border-t px-4 pt-3 pb-safe-only kb-aware-fixed bg-background z-10">
          {showGoalResetOptions ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Would you like to exit and create a new goal?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowGoalResetOptions(false);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Stay on Current Goal
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = '/';
                    onClose();
                  }}
                  className="flex-1"
                >
                  Exit to Goals Wizard
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-end">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  placeholder="Ask Luna for help..."
                  disabled={isLoading || !!cooldownUntil || isLocked}
                  className="flex-1 text-sm"
                  autoFocus
                  ref={inputRef}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim() || !!cooldownUntil || isLocked}
                  size="sm"
                  className="h-10 w-10 p-0 flex-shrink-0"
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
            </>
          )}
        </div>
    </div>
  );
};
