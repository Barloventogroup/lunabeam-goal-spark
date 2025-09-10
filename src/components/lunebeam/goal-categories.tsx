import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { 
  GraduationCap, 
  Briefcase, 
  Home, 
  Heart, 
  Users,
  Building,
  BookOpen,
} from 'lucide-react';

interface GoalCategoriesProps {
  onSelectCategory: (category: string) => void;
  onBack: () => void;
}

export const GoalCategories: React.FC<GoalCategoriesProps> = ({ 
  onSelectCategory, 
  onBack 
}) => {
  const categories = [
    {
      id: 'health',
      title: '💪 Health & Well Being',
      description: 'Taking care of your body and mind - the good stuff that makes you feel awesome',
      icon: Heart,
      color: 'bg-red-500/10 text-red-600 border-red-200',
      examples: 'Walk, Stretch, Better Sleep, Eat Healthier, Drink More Water'
    },
    {
      id: 'education',
      title: '🎓 Education - High School / Academic Readiness',
      description: 'Learning new things and growing your brain power - no matter how small the step',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      examples: 'Read Something, Write Something, Plan Week, Solve a Problem, Review Notes, Study'
    },
    {
      id: 'employment',
      title: '💼 Employment',
      description: 'Building work skills and confidence - one small step toward your future',
      icon: Briefcase,
      color: 'bg-green-500/10 text-green-600 border-green-200',
      examples: 'Practice for Interview, Create Resume, Update Resume, Send Thank-You Letter, Find Companies, Find People that Can Help'
    },
    {
      id: 'independent_living',
      title: '🏠 Independent Living',
      description: 'Everyday life stuff that makes you feel more independent and capable',
      icon: Home,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      examples: 'Make Bed, Set Table, Do Laundry, Cook, Clean Area, Write Shopping List'
    },
    {
      id: 'social_skills',
      title: '🤝 Social / Self-Advocacy',
      description: 'Connecting with people in your own comfortable way - even tiny interactions count',
      icon: Users,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      examples: 'Say Hi, Eye Contact (3 Seconds), Text "How are you?", Handshake / Fist Pump, Give a Compliment'
    },
    {
      id: 'postsecondary',
      title: '🎓 Postsecondary - Learning After High School',
      description: "Checking out what's next after high school - colleges, trades, certificates, whatever interests you",
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      examples: 'Research Colleges/Programs, Prepare Application Materials, Explore Financial Aid, Visit Campuses / Programs, Look for Programs, Visit Disability Office Website, Plan Campus Visit, Review Supports'
    },
    {
      id: 'fun_recreation',
      title: '🎉 Fun / Recreation',
      description: 'Enjoying hobbies and fun activities that bring you joy and relaxation',
      icon: Building,
      color: 'bg-pink-500/10 text-pink-600 border-pink-200',
      examples: 'Play a Sport/Game, Do an Art or Craft, Listen to or Play Music, Read or Watch Something Fun, Do a Fun Activity with Friends, Play a Game, Make Art, Watch a Movie or Show, Build Something, Do a Sport, Take a Photo or Video'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={onBack} />
          <div className="flex-1">
            <h1>What do you want to work on?</h1>
            <p className="text-foreground-soft">Pick what feels right today</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/30"
                onClick={() => onSelectCategory(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full w-12 h-12 flex items-center justify-center ${category.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.title}
                      </h3>
                      <p className="text-sm text-foreground-soft">
                        {category.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Examples: {category.examples}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-caption pt-4">
          Not sure? Pick anything - we can always explore different areas later 😊
        </div>
      </div>
    </div>
  );
};