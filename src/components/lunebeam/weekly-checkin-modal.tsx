import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Trophy, Plus, Calendar, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/services/database";
import type { FamilyCircle, Goal } from "@/types";

interface WeeklyCheckinModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  weekOf?: string;
}

interface Win {
  goal_id: string;
  text: string;
  mood: 'proud' | 'happy' | 'accomplished' | 'relieved';
}

interface Microstep {
  goal_id: string;
  text: string;
  difficulty: number; // 1-5 scale
  visibility: 'private' | 'family';
  schedule: {
    days: string[];
    time: 'morning' | 'afternoon' | 'evening';
  };
}

const moodEmojis = {
  proud: '😊',
  happy: '😄',
  accomplished: '🎉',
  relieved: '😌'
};

const rewardOptions = [
  { id: 'movie', label: 'Pick Friday movie', points: 1 },
  { id: 'snack', label: 'Special snack', points: 1 },
  { id: 'activity', label: '30min favorite activity', points: 2 },
  { id: 'outing', label: 'Small outing', points: 3 }
];

export function WeeklyCheckinModal({ 
  isOpen, 
  onOpenChange, 
  goal, 
  weekOf 
}: WeeklyCheckinModalProps) {
  const [checkinText, setCheckinText] = useState('');
  const [mood, setMood] = useState<'proud' | 'happy' | 'accomplished' | 'relieved'>('proud');
  const [starRating, setStarRating] = useState(0);
  const [mainTakeaway, setMainTakeaway] = useState('');
  const [nextTimeStrategy, setNextTimeStrategy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const handleSaveCheckin = async () => {
    if (!checkinText.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please describe how you did",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setShowConfetti(true);
    
    try {
      // TODO: Save check-in to database
      toast({
        title: "Check-in saved! ✨",
        description: "Great job on your progress"
      });

      // Keep confetti for a moment before closing
      setTimeout(() => {
        onOpenChange(false);
        setCheckinText('');
        setMood('proud');
        setStarRating(0);
        setMainTakeaway('');
        setNextTimeStrategy('');
        setShowConfetti(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Couldn't save that",
        description: "Give it another try when you're ready",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCheckinForm = () => (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="text-left">
          <h3 className="text-lg font-semibold mb-2">Goal: {goal.title}</h3>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="checkin-text">How did you do?</Label>
          <Textarea
            id="checkin-text"
            placeholder="add your reflections here"
            value={checkinText}
            onChange={(e) => setCheckinText(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Label>How was it?</Label>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarRating(star)}
                className="transition-colors hover:scale-110 transform duration-150"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= starRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>How do you feel?</Label>
          <Select value={mood} onValueChange={(value: 'proud' | 'happy' | 'accomplished' | 'relieved') => setMood(value)}>
            <SelectTrigger className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-input shadow-lg z-50">
              <SelectItem value="proud">😊 proud</SelectItem>
              <SelectItem value="happy">😄 happy</SelectItem>
              <SelectItem value="accomplished">🎉 accomplished</SelectItem>
              <SelectItem value="relieved">😌 relieved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="main-takeaway">So what's your main takeaway?</Label>
          <Textarea
            id="main-takeaway"
            placeholder="What did you learn or discover?"
            value={mainTakeaway}
            onChange={(e) => setMainTakeaway(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="next-time-strategy">Now what's one thing you'll try next time (or where else could this help)?</Label>
          <Textarea
            id="next-time-strategy"
            placeholder="Your strategy for next time..."
            value={nextTimeStrategy}
            onChange={(e) => setNextTimeStrategy(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleSaveCheckin}
            disabled={isLoading || !checkinText.trim()}
            variant="checkin"
            className="w-full max-w-md text-base relative overflow-hidden"
            size="sm"
          >
            {isLoading ? "Saving..." : "Check in"}
            {/* Confetti animation overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="confetti-container opacity-0 transition-opacity duration-300"></div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            It's Check-in time ✨
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderCheckinForm()}
        </div>

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="confetti-animation">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{
          __html: `
            .confetti-animation {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            
            .confetti-piece {
              position: absolute;
              width: 8px;
              height: 8px;
              animation: confetti-fall 3s linear forwards;
            }
            
            @keyframes confetti-fall {
              0% {
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
              }
            }
          `
        }} />
      </DialogContent>
    </Dialog>
  );
}