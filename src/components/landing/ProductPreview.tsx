import { useState, useEffect } from 'react';
import { FileText, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export function ProductPreview() {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const steps = [
    { label: 'Enter Topic', icon: FileText, text: '"Photosynthesis for 5th Grade"' },
    { label: 'Select Groups', icon: Users, text: '3 reading levels, 2 ELL students' },
    { label: 'Generate', icon: Sparkles, text: 'AI creates differentiated lessons...' },
    { label: 'Complete!', icon: CheckCircle2, text: '4 customized handouts ready!' },
  ];

  useEffect(() => {
    if (!isAnimating) return;
    
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    
    return () => clearInterval(timer);
  }, [isAnimating, steps.length]);

  return (
    <div 
      className="bg-card rounded-3xl p-6 md:p-8 shadow-2xl border border-border/50 animate-fade-in relative overflow-hidden"
      style={{ animationDelay: '0.2s' }}
      onMouseEnter={() => setIsAnimating(false)}
      onMouseLeave={() => setIsAnimating(true)}
    >
      {/* Gradient top bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-primary to-accent"
        style={{ borderRadius: '24px 24px 0 0' }}
      />
      
      {/* Window controls */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-accent/60" />
        <div className="w-3 h-3 rounded-full bg-primary/60" />
        <span className="ml-3 text-sm text-muted-foreground font-medium">
          Authentic Learning Studio
        </span>
      </div>
      
      {/* Steps visualization */}
      <div className="space-y-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isComplete = step > i;
          
          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                isActive 
                  ? 'bg-primary/10 border border-primary/30 scale-[1.02]' 
                  : isComplete 
                    ? 'bg-muted/50 border border-transparent' 
                    : 'bg-muted/30 border border-transparent opacity-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : isComplete 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm transition-colors ${
                  isActive || isComplete ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {s.label}
                </div>
                <div className={`text-sm truncate transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {s.text}
                </div>
              </div>
              {isComplete && (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar */}
      <div className="mt-6 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-secondary via-primary to-accent transition-all duration-500"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        Hover to pause animation
      </p>
    </div>
  );
}
