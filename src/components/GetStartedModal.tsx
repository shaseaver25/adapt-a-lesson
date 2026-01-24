import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, ShieldCheck, TableProperties, Users, Sparkles, ArrowRight } from 'lucide-react';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
}

const features = [
  {
    icon: Users,
    title: 'Create Student Groups',
    description: 'Set up groups based on reading levels, language needs, and learning preferences.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: BookOpenCheck,
    title: 'Build Differentiated Lessons',
    description: 'Transform any lesson into personalized content for each student group.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: ShieldCheck,
    title: 'Design Authentic Assessments',
    description: 'Create AI-resistant assessments that reveal genuine student thinking.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    icon: TableProperties,
    title: 'Generate Smart Rubrics',
    description: 'Build analytic rubrics with built-in verification checkpoints.',
    color: 'text-accent-foreground',
    bgColor: 'bg-accent',
  },
];

export const GetStartedModal = ({ isOpen, onClose, userName }: GetStartedModalProps) => {
  const displayName = userName?.split(' ')[0] || 'there';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold">
            Welcome, {displayName}! 👋
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            You're all set to start creating personalized learning experiences. Here's what you can do:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${feature.bgColor} shrink-0`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Step {index + 1}
                  </span>
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={onClose} 
            size="lg" 
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            Let's Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Need help? Visit our <a href="/help" className="text-primary hover:underline">Help Center</a> anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
