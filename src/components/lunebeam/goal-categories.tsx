import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Briefcase, 
  Home, 
  Heart, 
  Users,
  ArrowLeft
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
      id: 'education',
      title: 'Education',
      description: 'Learning, skills, courses, certifications',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      examples: 'Reading, online courses, studying'
    },
    {
      id: 'employment',
      title: 'Employment',
      description: 'Job skills, career development, work habits',
      icon: Briefcase,
      color: 'bg-green-500/10 text-green-600 border-green-200',
      examples: 'Interview skills, networking, productivity'
    },
    {
      id: 'independent_living',
      title: 'Independent Living',
      description: 'Daily life skills, self-care, organization',
      icon: Home,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      examples: 'Cooking, budgeting, time management'
    },
    {
      id: 'health',
      title: 'Health',
      description: 'Physical wellness, mental health, self-care',
      icon: Heart,
      color: 'bg-red-500/10 text-red-600 border-red-200',
      examples: 'Exercise, nutrition, mindfulness'
    },
    {
      id: 'social_skills',
      title: 'Social Skills',
      description: 'Communication, relationships, community',
      icon: Users,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      examples: 'Making friends, conversation, teamwork'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">What do you want to work on?</h1>
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

        <div className="text-center text-sm text-muted-foreground pt-4">
          Not sure? Pick anything - we can always explore different areas later 😊
        </div>
      </div>
    </div>
  );
};