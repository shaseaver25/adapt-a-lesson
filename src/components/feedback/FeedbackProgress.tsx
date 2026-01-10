import { cn } from "@/lib/utils";

interface FeedbackProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = ["Usage & Satisfaction", "Detailed Feedback", "About You"];

export function FeedbackProgress({ currentStep, totalSteps }: FeedbackProgressProps) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {stepLabels.map((label, index) => (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center gap-2 flex-1",
              index < stepLabels.length - 1 && "relative"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                index + 1 <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "text-xs text-center hidden sm:block",
                index + 1 <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Step {currentStep} of {totalSteps} • {Math.round(progress)}% complete
      </p>
    </div>
  );
}
