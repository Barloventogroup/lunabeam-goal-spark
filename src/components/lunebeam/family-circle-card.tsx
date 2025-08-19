import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Settings, Calendar, Trophy } from "lucide-react";
import { FamilyInviteModal } from "./family-invite-modal";
import { WeeklyCheckinModal } from "./weekly-checkin-modal";
import { database } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import type { FamilyCircle, CircleMembership, SelectedGoal } from "@/types";

interface FamilyCircleCardProps {
  circle: FamilyCircle;
  goals: SelectedGoal[];
  onNavigate?: (view: string, data?: any) => void;
}

const roleColors = {
  individual: 'bg-blue-500',
  parent_guide: 'bg-green-500', 
  cheerleader: 'bg-yellow-500',
  coach: 'bg-purple-500'
};

const roleLabels = {
  individual: 'Individual',
  parent_guide: 'Parent-Guide',
  cheerleader: 'Cheerleader', 
  coach: 'Coach'
};

export function FamilyCircleCard({ circle, goals, onNavigate }: FamilyCircleCardProps) {
  const [memberships, setMemberships] = useState<CircleMembership[]>([]);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMemberships();
  }, [circle.id]);

  const loadMemberships = async () => {
    setIsLoading(true);
    try {
      const data = await database.getCircleMemberships(circle.id);
      setMemberships(data);
    } catch (error) {
      toast({
        title: "Failed to load members",
        description: "Please refresh the page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const isCheckinTime = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    // Sunday evening between 6-10 PM
    return day === 0 && hour >= 18 && hour <= 22;
  };

  return (
    <>
      <Card 
        className="relative cursor-pointer hover:bg-card-soft transition-smooth" 
        onClick={() => {
          console.log('Family circle card clicked:', circle);
          onNavigate?.('family-circle-detail', circle);
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {circle.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {memberships.length} member{memberships.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Family Members</h4>
              <FamilyInviteModal 
                circle={circle}
                trigger={
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                }
              />
            </div>

            {memberships.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
                <p className="text-sm">Invite family members to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {memberships.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback 
                          className={`text-white ${roleColors[membership.role]}`}
                        >
                          {membership.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Member</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabels[membership.role]}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={membership.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {membership.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check-in Banner */}
          {isCheckinTime() && (
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">It's Check-in time ✨</p>
                    <p className="text-sm text-muted-foreground">
                      Ready to plan your week?
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsCheckinOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Start Check-in
                </Button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-sm font-medium">{goals.length}</p>
              <p className="text-xs text-muted-foreground">Active Goals</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-sm font-medium">0</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <WeeklyCheckinModal
        isOpen={isCheckinOpen}
        onOpenChange={setIsCheckinOpen}
        circle={circle}
        goals={goals}
        weekOf={getCurrentWeek()}
      />
    </>
  );
}