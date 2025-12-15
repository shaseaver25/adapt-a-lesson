import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, ArrowLeft } from 'lucide-react';
import { AudioUsageDashboard } from '@/components/AudioUsageDashboard';

export default function AudioUsage() {
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
                Educator Tools
              </h1>
              <p className="text-xs text-muted-foreground">
                Audio Usage Dashboard
              </p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tools
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              Audio Generation Usage
            </h2>
            <p className="text-muted-foreground">
              Track your ElevenLabs TTS usage for differentiated lessons
            </p>
          </div>

          <AudioUsageDashboard />

          {/* Cost Tips */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg">Tips for Managing Audio Costs</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  <strong className="text-foreground">Prioritize key sections:</strong> Generate audio for learning targets and instructions first, as these are most critical for ELL and accommodation students.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  <strong className="text-foreground">Use bilingual vocabulary:</strong> For ELL students, bilingual vocabulary audio helps them connect English terms to their home language efficiently.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  <strong className="text-foreground">Reuse saved lessons:</strong> Once you generate audio for a lesson, save it. The audio URLs persist and can be reused without regenerating.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>
                  <strong className="text-foreground">Export QR codes:</strong> Download student handouts with QR codes so students can access audio from printed materials.
                </span>
              </li>
            </ul>
          </div>

          {/* Pricing Info */}
          <div className="bg-muted/30 rounded-xl p-6 text-center text-sm text-muted-foreground">
            <p>
              Audio is generated using ElevenLabs Multilingual v2 at approximately <strong className="text-foreground">$0.30 per 10,000 characters</strong>.
              The monthly budget helps you track usage and avoid unexpected costs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
