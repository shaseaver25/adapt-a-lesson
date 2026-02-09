import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ComplianceChecklistProps {
  onCtaClick: () => void;
}

const checklistItems = [
  { id: 'alt_text', label: 'All images have descriptive alt text', category: 'Images & Media' },
  { id: 'color_contrast', label: 'Text meets 4.5:1 color contrast ratio (3:1 for large text)', category: 'Visual Design' },
  { id: 'pdf_accessible', label: 'All PDFs are tagged and screen-reader accessible', category: 'Documents' },
  { id: 'headings', label: 'Proper heading structure (H1, H2, H3) without skipping levels', category: 'Structure' },
  { id: 'keyboard_nav', label: 'All content navigable via keyboard only (no mouse required)', category: 'Navigation' },
  { id: 'video_captions', label: 'All videos have accurate captions/transcripts', category: 'Images & Media' },
  { id: 'link_text', label: 'Link text is descriptive (not "click here" or "read more")', category: 'Navigation' },
  { id: 'tables', label: 'Data tables have proper header markup and structure', category: 'Structure' },
  { id: 'forms', label: 'All form fields have visible labels and error messages', category: 'Interactive Elements' },
  { id: 'reading_order', label: 'Reading order makes sense when using assistive technology', category: 'Structure' },
  { id: 'color_only', label: 'Information not conveyed by color alone', category: 'Visual Design' },
  { id: 'audio_alternatives', label: 'Audio-only content has text alternatives', category: 'Images & Media' },
];

export function ComplianceChecklist({ onCtaClick }: ComplianceChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const handleCheckbox = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    setShowResults(false);
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const compliancePercentage = Math.round((checkedCount / totalCount) * 100);

  const getResultContent = () => {
    if (compliancePercentage === 100) {
      return {
        icon: <CheckCircle className="w-8 h-8 text-primary shrink-0" />,
        borderClass: 'border-primary/30 bg-primary/5',
        title: 'Outstanding! But Can You Maintain It?',
        description: 'Your teachers are creating hundreds of new materials every week. Each one needs this level of compliance.',
        subtitle: 'Manual compliance checking is:',
        bullets: [
          'Time-intensive: 15-30 minutes per document',
          'Expensive: Specialized audits cost $150-300/hour',
          'Inconsistent: Human error leads to gaps',
          'Reactive: Problems found after publishing',
        ],
        cta: 'RealPath Learning automates compliance so teachers create accessible content from the start—no extra work required.',
      };
    }
    if (compliancePercentage >= 75) {
      return {
        icon: <AlertCircle className="w-8 h-8 text-accent shrink-0" />,
        borderClass: 'border-accent/30 bg-accent/5',
        title: `You're ${compliancePercentage}% There—But That's Not Enough`,
        description: 'Under ADA Title II, partial compliance is non-compliance. A single inaccessible document can trigger an OCR complaint.',
        subtitle: 'The unchecked items represent gaps in every teacher-created resource. Multiply that by:',
        bullets: [
          '100s of teachers creating content daily',
          '1,000s of existing materials in your LMS',
          'New lessons, worksheets, and assessments every week',
        ],
        cta: 'RealPath Learning ensures 100% compliance automatically, protecting your district from risk while empowering your teachers.',
      };
    }
    if (compliancePercentage >= 50) {
      return {
        icon: <AlertTriangle className="w-8 h-8 text-secondary shrink-0" />,
        borderClass: 'border-secondary/30 bg-secondary/5',
        title: 'Your District Has Significant Compliance Gaps',
        description: `At ${compliancePercentage}% compliance, your district is at high risk for OCR complaints, which can result in:`,
        subtitle: '',
        bullets: [
          'Federal investigations and mandatory compliance agreements',
          'Legal fees ranging from $50K-500K+',
          'Mandatory remediation of all existing content',
          'Reputational damage to your district',
        ],
        cta: 'RealPath Learning eliminates compliance risk by building accessibility into every lesson from day one.',
      };
    }
    return {
      icon: <XCircle className="w-8 h-8 text-destructive shrink-0" />,
      borderClass: 'border-destructive/30 bg-destructive/5',
      title: 'Critical Compliance Risk: Immediate Action Required',
      description: `At ${compliancePercentage}% compliance, your district is in violation of federal law right now. Every day increases your exposure to:`,
      subtitle: '',
      bullets: [
        'OCR complaints from students or parents',
        'Class action lawsuits (settlements often exceed $1M)',
        'Loss of federal funding',
        'Court-ordered remediation of all district content',
      ],
      cta: 'RealPath Learning provides immediate compliance for new content and a clear path to remediating existing materials.',
    };
  };

  return (
    <section id="compliance-check" className="py-24 px-4 md:px-8 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Alert Bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Badge variant="outline" className="gap-2 py-1.5 px-4 text-sm border-secondary/40 bg-secondary/5 text-secondary font-semibold">
            <Shield className="w-4 h-4" />
            ADA Title II • DOJ WCAG 2.1 AA Compliance
          </Badge>
        </div>

        {/* Main Question */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Is Your Teacher Content{' '}
            <span className="text-secondary italic">Really</span> Compliant?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your LMS platform may be WCAG 2.1 AA compliant, but every PDF, worksheet, and lesson your teachers create must meet these standards:
          </p>
        </div>

        {/* Checklist Card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          {/* Checklist Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
            <h3 className="font-display text-lg font-bold text-foreground">
              Teacher-Created Content Requirements
            </h3>
            <span className="text-sm text-muted-foreground font-medium">
              {checkedCount} of {totalCount} checked
            </span>
          </div>

          {/* Items */}
          <div className="divide-y divide-border/50">
            {checklistItems.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <Checkbox
                  checked={!!checkedItems[item.id]}
                  onCheckedChange={() => handleCheckbox(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground block">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Progress + Submit */}
          <div className="p-5 border-t border-border bg-muted/20 space-y-4">
            <Progress value={compliancePercentage} className="h-2" />
            <Button
              onClick={() => setShowResults(true)}
              size="lg"
              variant="hero"
              className="w-full"
            >
              Check Our Compliance Status
            </Button>
          </div>
        </div>

        {/* Results */}
        {showResults && (() => {
          const result = getResultContent();
          return (
            <div className={`mt-8 rounded-2xl border-2 p-6 md:p-8 animate-fade-in ${result.borderClass}`}>
              <div className="flex gap-4">
                {result.icon}
                <div className="space-y-3">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {result.title}
                  </h3>
                  <p className="text-muted-foreground">{result.description}</p>
                  {result.subtitle && (
                    <p className="text-sm font-semibold text-foreground">{result.subtitle}</p>
                  )}
                  <ul className="space-y-1.5">
                    {result.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-secondary mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-semibold text-primary pt-2">{result.cta}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <Button onClick={onCtaClick} size="lg" className="gap-2">
                  See how we can help!
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Join 100+ certified teachers creating compliant content automatically
                </p>
              </div>
            </div>
          );
        })()}

        {/* Bottom Note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
            <strong>The Reality:</strong> Most schools discover their compliance gaps only after receiving an OCR complaint. Don't wait for a federal investigation to fix what you can prevent today.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '100%', label: 'Compliance-Native' },
            { value: '100+', label: 'Certified Teachers' },
            { value: '$19K', label: 'Monthly Revenue' },
            { value: 'Zero', label: 'Compliance Risk' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 bg-card rounded-xl border border-border/50">
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
