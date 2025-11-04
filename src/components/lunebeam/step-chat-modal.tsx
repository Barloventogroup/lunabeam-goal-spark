import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Loader2, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getLunaIcon } from '@/utils/iconGenerator';
import type { Step, Goal } from '@/types';
import { cleanStepTitle } from '@/utils/stepUtils';
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
  suggestedSubstep?: {
    title: string;
    description: string;
    step_id: string;
    is_planned: boolean;
  };
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
          conversationHistory: messages.slice(-6)
        }
      });

      if (error) throw error;

      // Handle COOLDOWN_ACTIVE classification
      if (data.classification === 'COOLDOWN_ACTIVE') {
        setCooldownUntil(data.cooldown_until);
        setCooldownLevel(data.cooldown_level);
        
        // Start countdown timer
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

      // Add assistant message with optional substep suggestion
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestedSubstep: data.suggestedSubstep || undefined
      };
      setMessages(prev => [...prev, assistantMessage]);

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

  const handleAddSubstep = async (substep: any) => {
    if (!substep) return;
    
    setIsLoading(true);
    try {
      // Create scaffolding step instead of substep
      const { data: parentStep } = await supabase
        .from('steps')
        .select('order_index, scaffolding_level')
        .eq('id', substep.step_id)
        .single();

      const { data, error } = await supabase
        .from('steps')
        .insert({
          goal_id: goal?.id,
          parent_step_id: substep.step_id,
          title: substep.title,
          notes: substep.description,
          is_scaffolding: true,
          scaffolding_level: (parentStep?.scaffolding_level || 0) + 1,
          order_index: (parentStep?.order_index || 0) + 1,
          status: 'not_started',
          type: 'action',
          is_required: true,
          points: 2,
          is_planned: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Substep Added!",
        description: `"${substep.title}" has been added to your plan.`,
        variant: "default"
      });

      // Trigger parent reload to refresh substeps display
      if (onStepsUpdate && step) {
        onStepsUpdate([step]);
      }

      // Add confirmation message to chat
      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `✅ Added "${substep.title}" to your plan! Would you like me to suggest another substep to break this down further?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);

    } catch (error) {
      console.error('Error adding substep:', error);
      toast({
        title: "Error",
        description: "Failed to add substep. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReflection = async () => {
    if (!reflectionQ1.trim() || !reflectionQ2.trim() || !step) {
      toast({
        title: "Incomplete Reflection",
        description: "Please answer both reflection questions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('step-assistance', {
        body: {
          action: 'submit_reflection',
          reflection_q1: reflectionQ1,
          reflection_q2: reflectionQ2,
          stepId: step.id,
          step,
          goal
        }
      });

      if (error) throw error;

      if (data.reframing_statement) {
        setReframingStatement(data.reframing_statement);
        toast({
          title: "Reflection Submitted",
          description: "Thank you for reflecting. You can now unlock the chat.",
          variant: "default"
        });
      }
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
              Helping with: "{cleanStepTitle(step.title)}"
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Cooldown Timer Display */}
          {cooldownUntil && new Date(cooldownUntil) > new Date() && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-900">
                Cooldown active: {getTimeRemaining(cooldownUntil)} remaining
              </span>
            </div>
          )}

          {/* Reflection Form */}
          {requiresReflection && !reframingStatement && (
            <div className="p-4 space-y-4 bg-muted rounded-lg mb-4">
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
            <div className="p-4 space-y-4 bg-green-50 rounded-lg mb-4">
              <p className="text-sm">{reframingStatement}</p>
              <Button onClick={handleUnlockChat} disabled={isLoading}>
                Reset Chat
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && message.suggestedSubstep ? (
                    // Special rendering for substep suggestions
                    <>
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-normal">L</span>
                      </div>
                      <div className="max-w-[80%] flex flex-col gap-2">
                        {message.content && (
                          <div className="bg-muted p-2 rounded-lg text-sm" style={{ whiteSpace: 'pre-line' }}>
                            {stripMarkup(message.content)}
                          </div>
                        )}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
                    // Regular message rendering
                    <>
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
                    </>
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
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};