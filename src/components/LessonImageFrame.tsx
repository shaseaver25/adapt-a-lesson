import React from 'react';

interface LessonImageFrameProps {
  src: string;
  alt: string;
}

const LessonImageFrame: React.FC<LessonImageFrameProps> = ({ src, alt }) => {
  if (!src) return null;
  
  return (
    <figure className="my-6 mx-auto max-w-[600px]">
      <div className="relative w-full aspect-[3/2] bg-muted border-4 border-primary/20 rounded-lg shadow-soft overflow-hidden">
        <img 
          src={src} 
          alt={alt || 'Lesson diagram'}
          className="absolute inset-0 w-full h-full object-contain p-2"
        />
      </div>
      {alt && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  );
};

export default LessonImageFrame;
