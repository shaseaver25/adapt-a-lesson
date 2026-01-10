import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}

export function StarRating({ value, onChange, label, required }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring rounded"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground hover:text-yellow-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
