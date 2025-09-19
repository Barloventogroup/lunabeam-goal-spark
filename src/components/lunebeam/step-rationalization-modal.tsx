import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StepRationalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  onComplete: () => void;
}

interface DuplicateGroup {
  titles: string[];
  mergedTitle: string;
  mergedDescription: string;
  ids: string[];
  stepId: string;
}

export const StepRationalizationModal: React.FC<StepRationalizationModalProps> = ({
  isOpen,
  onClose,
  goalId,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const scanForDuplicates = async () => {
    setIsProcessing(true);
    try {
      // Get all substeps for reading goal
      const { data: substeps, error } = await supabase
        .from('substeps')
        .select(`
          id,
          title,
          description,
          step_id,
          steps!inner(goal_id)
        `)
        .eq('steps.goal_id', goalId);

      if (error) throw error;

      const groups: DuplicateGroup[] = [];

      // Group 1: Reading material selection
      const readingMaterialSteps = substeps?.filter(s => 
        s.title.includes('Pick What to Read') ||
        s.title.includes('Decide What Sounds Fun') ||
        s.title.includes('Pick Something Short')
      ) || [];

      if (readingMaterialSteps.length > 1) {
        groups.push({
          titles: readingMaterialSteps.map(s => s.title),
          mergedTitle: 'Choose Your Reading Material',
          mergedDescription: 'Pick something you want to read—book, article, comic, manga, or short story. Choose something engaging and manageable that you actually enjoy. (5 min)',
          ids: readingMaterialSteps.map(s => s.id),
          stepId: readingMaterialSteps[0].step_id
        });
      }

      // Group 2: Reading space setup
      const readingSpaceSteps = substeps?.filter(s => 
        s.title.includes('Find Your Reading Spot') ||
        s.title.includes('Grab Your Reading Spot')
      ) || [];

      if (readingSpaceSteps.length > 1) {
        groups.push({
          titles: readingSpaceSteps.map(s => s.title),
          mergedTitle: 'Set Up Your Reading Space',
          mergedDescription: 'Find a comfortable, distraction-free spot (bed, couch, favorite corner). Make it cozy like your ideal hangout space. (2 min)',
          ids: readingSpaceSteps.map(s => s.id),
          stepId: readingSpaceSteps[0].step_id
        });
      }

      // Group 3: Reading session setup
      const sessionSteps = substeps?.filter(s => 
        s.title.includes('Set a Timer') ||
        s.title.includes('Start Reading')
      ) || [];

      if (sessionSteps.length > 1) {
        groups.push({
          titles: sessionSteps.map(s => s.title),
          mergedTitle: 'Begin Your Reading Session',
          mergedDescription: 'Set a timer for 5-15 minutes, then dive in. No pressure to finish everything—just enjoy the process. (15 min)',
          ids: sessionSteps.map(s => s.id),
          stepId: sessionSteps[0].step_id
        });
      }

      setDuplicateGroups(groups);
      setHasScanned(true);
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      toast.error('Failed to scan for duplicates');
    } finally {
      setIsProcessing(false);
    }
  };

  const rationalizeDuplicates = async () => {
    setIsProcessing(true);
    try {
      let totalMerged = 0;

      for (const group of duplicateGroups) {
        // Create merged substep
        const { error: insertError } = await supabase
          .from('substeps')
          .insert({
            step_id: group.stepId,
            title: group.mergedTitle,
            description: group.mergedDescription,
            is_planned: true
          });

        if (insertError) {
          console.error('Error creating merged substep:', insertError);
          continue;
        }

        // Delete the duplicates
        const { error: deleteError } = await supabase
          .from('substeps')
          .delete()
          .in('id', group.ids);

        if (!deleteError) {
          totalMerged += group.ids.length;
        }
      }

      toast.success(`Successfully merged ${totalMerged} duplicate steps into ${duplicateGroups.length} streamlined steps`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error rationalizing duplicates:', error);
      toast.error('Failed to rationalize duplicates');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Step Rationalization</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!hasScanned ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Scanning for duplicate and similar steps that can be merged...
              </p>
              <Button 
                onClick={scanForDuplicates}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan for Duplicates'
                )}
              </Button>
            </div>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-muted-foreground">
                No duplicate steps found. Your steps are already optimized!
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  Found {duplicateGroups.length} groups of duplicate steps
                </span>
              </div>

              {duplicateGroups.map((group, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Group {index + 1}: {group.mergedTitle}</h4>
                  <p className="text-sm text-muted-foreground">{group.mergedDescription}</p>
                  <div className="text-xs">
                    <span className="font-medium">Will merge:</span>
                    <ul className="list-disc list-inside ml-2 text-muted-foreground">
                      {group.titles.map((title, i) => (
                        <li key={i}>{title}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button 
                  onClick={rationalizeDuplicates}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    'Merge Duplicates'
                  )}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};