import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SkipReason } from "@/types";

interface SkipReasonModalProps {
  isOpen: boolean;
  stepTitle: string;
  onClose: () => void;
  onConfirm: (reason: SkipReason, customNote?: string) => Promise<void>;
}

const SKIP_REASONS = [
  { value: 'sick' as SkipReason, label: 'Sick', emoji: '🤒' },
  { value: 'busy' as SkipReason, label: 'Too Busy', emoji: '📅' },
  { value: 'tired' as SkipReason, label: 'Too Tired', emoji: '😓' },
  { value: 'not_ready' as SkipReason, label: 'Not Ready', emoji: '🤷' },
  { value: 'forgot' as SkipReason, label: 'Forgot', emoji: '🤦' },
  { value: 'other' as SkipReason, label: 'Other', emoji: '💭' },
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({
  isOpen,
  stepTitle,
  onClose,
  onConfirm
}) => {
  const [selectedReason, setSelectedReason] = useState<SkipReason | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason, selectedReason === 'other' ? customNote : undefined);
      onClose();
      setSelectedReason(null);
      setCustomNote('');
    } catch (error) {
      console.error('Error skipping step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomNote('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why are you skipping today?</DialogTitle>
          <DialogDescription className="text-sm">
            {stepTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {SKIP_REASONS.map((reason) => (
            <Button
              key={reason.value}
              type="button"
              variant={selectedReason === reason.value ? "default" : "outline"}
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setSelectedReason(reason.value)}
            >
              <span className="text-2xl">{reason.emoji}</span>
              <span className="text-sm">{reason.label}</span>
            </Button>
          ))}
        </div>

        {selectedReason === 'other' && (
          <Textarea
            placeholder="Tell us more (optional)..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="resize-none"
            rows={3}
          />
        )}

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? 'Skipping...' : 'Confirm Skip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
