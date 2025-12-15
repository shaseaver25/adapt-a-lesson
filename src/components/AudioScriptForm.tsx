import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AudioScriptInput, LANGUAGES, READING_LEVELS } from '@/types/audioScript';
import { FileAudio, Languages, GraduationCap } from 'lucide-react';

interface AudioScriptFormProps {
  onSubmit: (input: AudioScriptInput) => void;
  isLoading?: boolean;
}

export function AudioScriptForm({ onSubmit, isLoading }: AudioScriptFormProps) {
  const [lessonContent, setLessonContent] = useState('');
  const [language, setLanguage] = useState('English');
  const [readingLevel, setReadingLevel] = useState('Middle School');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AudioScriptInput = {
      lessonContent,
      language,
      readingLevel,
    };
    onSubmit(input);
  };

  const isValid = lessonContent.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Lesson Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <FileAudio className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Lesson Content</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lessonContent">
            Paste your lesson content (markdown supported)
          </Label>
          <Textarea
            id="lessonContent"
            placeholder="Paste your lesson content here. This can include markdown formatting, tables, visual placeholders like [VISUAL: diagram], etc. The AI will convert it to natural spoken text."
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            rows={10}
            required
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            The AI will convert markdown, tables, and visual descriptions into natural spoken language.
          </p>
        </div>
      </div>

      {/* Language & Reading Level */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Languages className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Audio Settings</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Target Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="readingLevel">Reading Level</Label>
            <Select value={readingLevel} onValueChange={setReadingLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {READING_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading || !isValid}
      >
        {isLoading ? (
          <span className="animate-pulse-soft">Preparing Audio Script...</span>
        ) : (
          'Generate Audio Script'
        )}
      </Button>
    </form>
  );
}
