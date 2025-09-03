import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      // TODO: Save check-in to database
      toast({
        title: "Check-in saved! ✨",
        description: "Great job on your progress"
      });

      onOpenChange(false);
      setCheckinText('');
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
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">{goal.title}</h3>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="checkin-text">How did you do?</Label>
          <Textarea
            id="checkin-text"
            placeholder="Walked 10 min M/W/F"
            value={checkinText}
            onChange={(e) => setCheckinText(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleSaveCheckin}
            disabled={isLoading || !checkinText.trim()}
            className="w-full max-w-md"
            size="lg"
          >
            {isLoading ? "Saving..." : "Check In"}
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
      </DialogContent>
    </Dialog>
  );
}