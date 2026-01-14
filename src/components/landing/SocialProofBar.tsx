import { Star, Award, Users } from 'lucide-react';

export function SocialProofBar() {
  return (
    <section className="py-8 px-4 md:px-8 bg-muted/50 border-y border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {/* Award Badge */}
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Hackathon Winners
            </span>
          </div>
          
          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-border" />
          
          {/* Built by Teachers */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Built by Classroom Teachers
            </span>
          </div>
          
          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-border" />
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-accent fill-accent" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">
              Loved by Educators
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
