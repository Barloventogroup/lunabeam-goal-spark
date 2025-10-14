import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/lunebeam/star-rating';
import { IndependenceSlider } from '@/components/lunebeam/independence-slider';
import { ConfidenceRating } from '@/components/lunebeam/confidence-rating';
import { SkillAssessmentWizard } from '@/components/lunebeam/skill-assessment-wizard';
import { ProgressiveMasteryCheckIn } from '@/components/lunebeam/progressive-mastery-checkin';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

export default function TestComponents() {
  // StarRating states
  const [starValue, setStarValue] = useState(0);
  const [starValueSmall, setStarValueSmall] = useState(3);
  const [starValueLarge, setStarValueLarge] = useState(4);

  // IndependenceSlider state
  const [independenceValue, setIndependenceValue] = useState(3);

  // ConfidenceRating state
  const [confidenceValue, setConfidenceValue] = useState(0);

  // SkillAssessmentWizard state
  const [showAssessment, setShowAssessment] = useState(false);

  // ProgressiveMasteryCheckIn state
  const [showCheckIn, setShowCheckIn] = useState(false);

  const handleAssessmentComplete = (assessment: any) => {
    console.log('Assessment complete:', assessment);
    alert(`Assessment complete! Level: ${assessment.level_label}, Score: ${assessment.calculated_level}`);
    setShowAssessment(false);
  };

  const handleCheckInComplete = async (checkInData: any) => {
    console.log('Check-in data:', checkInData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Check-in saved successfully!');
  };

  const handleCheckInSkip = async () => {
    console.log('Check-in skipped');
    await new Promise(resolve => setTimeout(resolve, 500));
    alert('Step completed without check-in');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Component Testing Page</h1>
          <p className="text-muted-foreground">
            Visual tests for Progressive Mastery components
          </p>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Test on mobile</span>
            <Separator orientation="vertical" className="h-4" />
            <Tablet className="h-4 w-4" />
            <span>Test on tablet</span>
            <Separator orientation="vertical" className="h-4" />
            <Monitor className="h-4 w-4" />
            <span>Test on desktop</span>
          </div>
        </div>

        <Separator />

        {/* StarRating Component */}
        <Card>
          <CardHeader>
            <CardTitle>StarRating Component</CardTitle>
            <CardDescription>Quality rating with 1-5 stars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Default (md) with labels:</p>
                <StarRating
                  value={starValue}
                  onChange={setStarValue}
                  showLabels={true}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Current value: {starValue || 'Not set'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Small (sm):</p>
                <StarRating
                  value={starValueSmall}
                  onChange={setStarValueSmall}
                  size="sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Current value: {starValueSmall}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Large (lg) with custom labels:</p>
                <StarRating
                  value={starValueLarge}
                  onChange={setStarValueLarge}
                  size="lg"
                  showLabels={true}
                  labels={['Awful', 'Bad', 'OK', 'Great', 'Amazing']}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Current value: {starValueLarge}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Read-only:</p>
                <StarRating
                  value={5}
                  readonly={true}
                  showLabels={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IndependenceSlider Component */}
        <Card>
          <CardHeader>
            <CardTitle>IndependenceSlider Component</CardTitle>
            <CardDescription>1-5 scale for measuring help needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <IndependenceSlider
              value={independenceValue}
              onChange={setIndependenceValue}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Badge variant="secondary">Current Value</Badge>
                <p className="mt-1">{independenceValue}</p>
              </div>
              <div>
                <Badge variant="secondary">Label</Badge>
                <p className="mt-1">
                  {independenceValue === 0 ? 'Not set' : 
                   independenceValue === 1 ? 'Full Support' :
                   independenceValue === 2 ? 'Lots of Help' :
                   independenceValue === 3 ? 'Some Help' :
                   independenceValue === 4 ? 'Independent' : 'Teaching Others'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ConfidenceRating Component */}
        <Card>
          <CardHeader>
            <CardTitle>ConfidenceRating Component</CardTitle>
            <CardDescription>Emoji-based confidence/mood rating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfidenceRating
              value={confidenceValue}
              onChange={setConfidenceValue}
              showLabel={true}
            />
            <div className="text-sm">
              <Badge variant="secondary">Current Value</Badge>
              <p className="mt-1">{confidenceValue || 'Not set'}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Without label:</p>
              <ConfidenceRating
                value={confidenceValue}
                onChange={setConfidenceValue}
                showLabel={false}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Read-only:</p>
              <ConfidenceRating
                value={4}
                onChange={() => {}}
                readonly={true}
                showLabel={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* SkillAssessmentWizard Component */}
        <Card>
          <CardHeader>
            <CardTitle>SkillAssessmentWizard Component</CardTitle>
            <CardDescription>3-question wizard for skill level assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This wizard guides users through 3 questions to assess their skill level:
              experience, confidence, and current independence.
            </p>
            <Button onClick={() => setShowAssessment(true)}>
              Launch Assessment Wizard
            </Button>
          </CardContent>
        </Card>

        {/* ProgressiveMasteryCheckIn Component */}
        <Card>
          <CardHeader>
            <CardTitle>ProgressiveMasteryCheckIn Component</CardTitle>
            <CardDescription>Enhanced check-in modal for step completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Collects quality rating, independence level, time spent, confidence before/after,
              and optional notes when completing a Progressive Mastery step.
            </p>
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="w-fit">Required Fields</Badge>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li>Quality Rating (1-5 stars)</li>
                  <li>Independence Level (1-5 slider)</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="w-fit">Optional Fields</Badge>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li>Time Spent (1-480 minutes)</li>
                  <li>Confidence Before/After (1-5 scale)</li>
                  <li>Notes (max 500 characters)</li>
                </ul>
              </div>
            </div>
            <Button onClick={() => setShowCheckIn(true)}>
              Launch Check-In Modal
            </Button>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Desktop Testing:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Verify all components render correctly</li>
                <li>Test hover states on star ratings</li>
                <li>Test keyboard navigation (Tab, Arrow keys)</li>
                <li>Verify tooltips appear on hover</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Mobile Testing:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Click the phone icon above the preview</li>
                <li>Test touch interactions on all components</li>
                <li>Verify text is readable (no truncation)</li>
                <li>Check that modals are scrollable</li>
                <li>Test quick-select time buttons in check-in modal</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Tablet Testing:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Click the tablet icon above the preview</li>
                <li>Verify layout adapts correctly</li>
                <li>Test that collapsible sections work</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Functionality Tests:</h4>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>StarRating: Click each star, verify hover effects</li>
                <li>IndependenceSlider: Drag slider, click track, use arrow keys</li>
                <li>ConfidenceRating: Click each emoji button</li>
                <li>SkillAssessment: Complete all 3 questions, go back/forward</li>
                <li>CheckIn: Fill required fields, test optional fields, test skip</li>
                <li>CheckIn: Test character counter (type near 500 limit)</li>
                <li>CheckIn: Test validation (try to submit without required fields)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showAssessment && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <SkillAssessmentWizard
            goalTitle="Cooking Scrambled Eggs"
            onComplete={handleAssessmentComplete}
            onBack={() => setShowAssessment(false)}
          />
        </div>
      )}

      {showCheckIn && (
        <ProgressiveMasteryCheckIn
          isOpen={showCheckIn}
          onClose={() => setShowCheckIn(false)}
          step={{
            id: 'test-step-1',
            title: 'Practice whisking eggs for 30 seconds',
            explainer: 'Use a whisk or fork to beat the eggs until the yolk and white are fully mixed',
          }}
          goal={{
            id: 'test-goal-1',
            title: 'Learn to cook scrambled eggs',
            goal_type: 'progressive_mastery',
          }}
          onComplete={handleCheckInComplete}
          onSkip={handleCheckInSkip}
        />
      )}
    </div>
  );
}
