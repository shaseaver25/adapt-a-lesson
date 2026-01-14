import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "This saved me 5+ hours of lesson prep this week. I finally have time to actually teach instead of just planning.",
    author: "Sarah M.",
    role: "5th Grade Math Teacher",
    location: "Minneapolis, MN"
  },
  {
    quote: "My ELL students finally have materials in their home language. The multilingual audio is a game-changer.",
    author: "Maria G.",
    role: "ESL Specialist",
    location: "St. Paul, MN"
  },
  {
    quote: "The authentic assessments mean I can actually measure what my students learned, not what ChatGPT knows.",
    author: "James T.",
    role: "High School Science",
    location: "Duluth, MN"
  }
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  const prev = () => {
    setCurrent((current - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setCurrent((current + 1) % testimonials.length);
  };

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl p-8 md:p-10 shadow-lg border border-border/50">
        <Quote className="w-10 h-10 text-primary/20 mb-4" />
        
        <div className="min-h-[120px] flex items-center">
          <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed italic">
            "{testimonials[current].quote}"
          </p>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{testimonials[current].author}</p>
            <p className="text-sm text-muted-foreground">
              {testimonials[current].role} · {testimonials[current].location}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
