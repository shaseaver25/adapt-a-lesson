import { useState } from 'react';
import { StudentGroupForm } from '@/components/StudentGroupForm';
import { LessonOutput } from '@/components/LessonOutput';
import { generateDifferentiatedLesson } from '@/lib/differentiation';
import { StudentGroup } from '@/types/studentGroup';
import { Sparkles, BookOpenCheck } from 'lucide-react';

const Index = () => {
  const [differentiatedLesson, setDifferentiatedLesson] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState<StudentGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDifferentiate = async (group: StudentGroup, lesson: string) => {
    setIsLoading(true);
    setCurrentGroup(group);
    
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const result = generateDifferentiatedLesson(lesson, group);
    setDifferentiatedLesson(result);
    setIsLoading(false);
  };

  const handleReset = () => {
    setDifferentiatedLesson(null);
    setCurrentGroup(null);
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-warm shadow-soft">
              <BookOpenCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">
                Lesson Differentiator
              </h1>
              <p className="text-xs text-muted-foreground">
                Personalize learning for every student
              </p>
            </div>
          </div>
          {differentiatedLesson && (
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              ← Start Over
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!differentiatedLesson ? (
          <div className="max-w-3xl mx-auto">
            {/* Hero section */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Differentiation
              </div>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-3">
                One Lesson, Every Learner
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Enter your student group profile and original lesson content. 
                Get a differentiated version that maintains learning objectives 
                while adjusting for reading level, language needs, and accommodations.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-medium animate-slide-up">
              <StudentGroupForm onSubmit={handleDifferentiate} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Result header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <BookOpenCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Differentiated Lesson Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customized for: <span className="font-medium text-foreground">{currentGroup?.groupName}</span>
                </p>
              </div>
            </div>

            <LessonOutput 
              content={differentiatedLesson} 
              groupName={currentGroup?.groupName || 'lesson'} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built for educators who believe every student deserves access to the curriculum.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
