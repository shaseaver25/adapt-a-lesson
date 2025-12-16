import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Image, Download, RefreshCw } from 'lucide-react';
import { useGraphicOrganizer, suggestOrganizerType } from '@/hooks/useGraphicOrganizer';
import type { GraphicOrganizerType } from '@/contexts/DifferentiationContext';

const ORGANIZER_OPTIONS: { value: GraphicOrganizerType; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto-select', description: 'Let AI choose the best type' },
  { value: 'venn-diagram', label: 'Venn Diagram', description: 'Compare & contrast' },
  { value: 't-chart', label: 'T-Chart', description: 'Two categories side by side' },
  { value: 'flow-chart', label: 'Flow Chart', description: 'Steps in a process' },
  { value: 'cause-effect', label: 'Cause & Effect', description: 'Show relationships' },
  { value: 'web-diagram', label: 'Web Diagram', description: 'Main idea + details' },
  { value: 'frayer-model', label: 'Frayer Model', description: 'Deep vocabulary study' },
  { value: 'story-map', label: 'Story Map', description: 'Narrative elements' },
  { value: 'claim-evidence', label: 'Claim-Evidence-Reasoning', description: 'Argument structure' },
  { value: 'none', label: 'None', description: 'No graphic organizer' },
];

interface GraphicOrganizerGeneratorProps {
  lessonContent?: string;
  lessonId?: string;
  groupId?: string;
  language?: string;
  selectedType: GraphicOrganizerType;
  onTypeChange: (type: GraphicOrganizerType) => void;
  onImageGenerated?: (imageUrl: string, type: GraphicOrganizerType) => void;
}

export function GraphicOrganizerGenerator({
  lessonContent = '',
  lessonId,
  groupId,
  language = 'English',
  selectedType,
  onTypeChange,
  onImageGenerated,
}: GraphicOrganizerGeneratorProps) {
  const { generateOrganizer, isGenerating, error } = useGraphicOrganizer();
  const [topic, setTopic] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedType, setGeneratedType] = useState<string | null>(null);

  const handleGenerate = async () => {
    let typeToGenerate = selectedType;
    
    // Auto-select based on content
    if (selectedType === 'auto' && lessonContent) {
      typeToGenerate = suggestOrganizerType(lessonContent);
    } else if (selectedType === 'auto') {
      typeToGenerate = 'web-diagram';
    }

    const result = await generateOrganizer(
      typeToGenerate,
      topic || 'Educational Graphic Organizer',
      language,
      lessonId,
      groupId
    );

    if (result) {
      setGeneratedImage(result.imageUrl);
      setGeneratedType(result.organizerType);
      onImageGenerated?.(result.imageUrl, typeToGenerate);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `graphic-organizer-${generatedType || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedType === 'none') {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Image className="h-4 w-4 text-amber-600" />
          Graphic Organizer Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizer-type">Organizer Type</Label>
            <Select value={selectedType} onValueChange={(v) => onTypeChange(v as GraphicOrganizerType)}>
              <SelectTrigger id="organizer-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic/Title (optional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Compare Plants vs Animals"
              className="bg-white"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Image className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {generatedImage && (
            <>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {generatedImage && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">
              Generated {generatedType?.replace('-', ' ')}:
            </p>
            <img
              src={generatedImage}
              alt={`Generated ${generatedType} graphic organizer`}
              className="max-w-full h-auto rounded border"
            />
          </div>
        )}

        {!generatedImage && !isGenerating && (
          <p className="text-sm text-muted-foreground">
            Click "Generate Image" to create an AI-generated graphic organizer that will be embedded in your DOCX exports.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
