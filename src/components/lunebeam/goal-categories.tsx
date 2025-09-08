import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Briefcase, 
  Home, 
  Heart, 
  Users,
  Building,
  BookOpen,
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
      title: '🎓 Education - High School / Academic Readiness',
      description: 'Learning new things and growing your brain power - no matter how small the step',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      examples: 'Read 1 page, write 1 sentence, review schedule'
    },
    {
      id: 'employment',
      title: '💼 Employment',
      description: 'Building work skills and confidence - one small step toward your future',
      icon: Briefcase,
      color: 'bg-green-500/10 text-green-600 border-green-200',
      examples: 'Practice interview Q, update resume, send email'
    },
    {
      id: 'health',
      title: '💪 Health & Well-Being',
      description: 'Taking care of your body and mind - the good stuff that makes you feel awesome',
      icon: Heart,
      color: 'bg-red-500/10 text-red-600 border-red-200',
      examples: 'Walk, try a snack, sleep better'
    },
    {
      id: 'independent_living',
      title: '🏠 Independent Living',
      description: 'Everyday life stuff that makes you feel more independent and capable',
      icon: Home,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      examples: 'Make bed, set table, laundry to basket'
    },
    {
      id: 'postsecondary',
      title: '🎓 Postsecondary - Learning After High School',
      description: "Checking out what's next after high school - colleges, trades, certificates, whatever interests you",
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      examples: 'Look at 1 program, visit disability office site, student story'
    },
    {
      id: 'social_skills',
      title: '🤝 Social Skills',
      description: 'Connecting with people in your own comfortable way - even tiny interactions count',
      icon: Users,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      examples: 'Say "hi", eye contact 3s, text "how are you?"'
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