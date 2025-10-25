import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface FirstTimeReminderProps {
  onNavigateToGoals: () => void;
}

export const FirstTimeReminder: React.FC<FirstTimeReminderProps> = ({ onNavigateToGoals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPath, setShowPath] = useState(false);
  const { profile } = useStore();

  const goalSeed = profile?.interests?.[0] || 'set your first goal';
  const displayName = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : 'you';

  const handleHelpClick = () => {
    setShowPath(true);
  };

  const handleGetStarted = () => {
    onNavigateToGoals();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-soft">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  💡 Your next step is to set your first goal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <div className="text-sm text-muted-foreground">
              {!showPath && (
                <button 
                  onClick={handleHelpClick}
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  Need help setting goals?
                </button>
              )}
            </div>

            {showPath && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground">Here's your path to success:</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    1. Choose Category
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    2. Pick Goal
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    3. Customize
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Popular categories:</p>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">🌱 Health & Well-Being (Walk, Sleep, Eat Better)</p>
                      <p className="text-muted-foreground">📘 Education - High School / Academic Readiness (Reading, Learning)</p>
                      <p className="text-muted-foreground">🗣️ Social Skills (Say Hi, Make Friends)</p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">What you'll get:</p>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">✨ Personalized steps</p>
                      <p className="text-muted-foreground">📅 Flexible schedule</p>
                      <p className="text-muted-foreground">🎯 Progress tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGetStarted}
              className="w-full"
              size="sm"
            >
              Let's Get Started! 🚀
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};