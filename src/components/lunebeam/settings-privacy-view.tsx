import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Lock, Users, MessageSquare, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingsPrivacyViewProps {
  onBack: () => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({ onBack }) => {
  const { profile } = useStore();
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'supporters' | 'private'>('supporters');
  const [goalSharing, setGoalSharing] = useState<'all' | 'supporters' | 'private'>('supporters');
  const [progressSharing, setProgressSharing] = useState<'realtime' | 'weekly' | 'manual'>('weekly');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, [profile]);

  const loadPrivacySettings = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_visibility, goal_sharing, progress_sharing')
        .eq('user_id', profile.user_id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileVisibility((data.profile_visibility || 'supporters') as 'public' | 'supporters' | 'private');
        setGoalSharing((data.goal_sharing || 'supporters') as 'all' | 'supporters' | 'private');
        setProgressSharing((data.progress_sharing || 'weekly') as 'realtime' | 'weekly' | 'manual');
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_visibility: profileVisibility,
          goal_sharing: goalSharing,
          progress_sharing: progressSharing
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      {/* Header */}
      <div className="fixed left-0 right-0 top-safe z-40 px-6 pb-4 pt-4 bg-card/80 backdrop-blur border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Settings & Privacy</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-11">
          Control who can see your profile and progress
        </p>
      </div>

      <div className="px-6 pt-6 pb-24 space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Profile Visibility</h3>
          </div>
          <div className="space-y-2">
            <Card 
              className={`cursor-pointer transition-all ${
                profileVisibility === 'public' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProfileVisibility('public')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-muted-foreground">
                      Anyone can view your profile and achievements
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                profileVisibility === 'supporters' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProfileVisibility('supporters')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Supporters Only</div>
                    <div className="text-sm text-muted-foreground">
                      Only your supporters can see your profile
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                profileVisibility === 'private' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProfileVisibility('private')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">
                      Only you can see your profile
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Goal Sharing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Goal Sharing</h3>
          </div>
          <div className="space-y-2">
            <Card 
              className={`cursor-pointer transition-all ${
                goalSharing === 'all' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setGoalSharing('all')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">All Goals</div>
                    <div className="text-sm text-muted-foreground">
                      Share all your goals with supporters
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                goalSharing === 'supporters' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setGoalSharing('supporters')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Selected Goals</div>
                    <div className="text-sm text-muted-foreground">
                      Only share goals you choose with specific supporters
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                goalSharing === 'private' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setGoalSharing('private')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <EyeOff className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">
                      Keep all goals private
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Sharing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Progress Updates</h3>
          </div>
          <div className="space-y-2">
            <Card 
              className={`cursor-pointer transition-all ${
                progressSharing === 'realtime' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProgressSharing('realtime')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Real-time</div>
                    <div className="text-sm text-muted-foreground">
                      Share progress as it happens
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                progressSharing === 'weekly' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProgressSharing('weekly')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Weekly Summary</div>
                    <div className="text-sm text-muted-foreground">
                      Share a weekly progress report
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                progressSharing === 'manual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200'
              }`}
              onClick={() => setProgressSharing('manual')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Manual Only</div>
                    <div className="text-sm text-muted-foreground">
                      You choose when to share updates
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
