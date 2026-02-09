import { CheckCircle, XCircle } from 'lucide-react';

export function CostComparison() {
  return (
    <section className="py-24 px-4 md:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-destructive rounded-t-2xl px-8 py-4">
          <h2 className="font-display text-2xl font-bold text-destructive-foreground text-center">
            The Real Cost of Non-Compliance
          </h2>
        </div>

        <div className="bg-card rounded-b-2xl border border-t-0 border-border shadow-lg p-8 md:p-12">
          <p className="text-lg text-muted-foreground text-center mb-10 max-w-3xl mx-auto">
            Districts face a choice: invest in compliance proactively, or pay exponentially more after an OCR complaint.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* With RealPath */}
            <div className="bg-primary/5 rounded-xl p-8 border-2 border-primary/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary rounded-full p-2">
                  <CheckCircle className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">With RealPath Learning</h3>
              </div>

              <div className="mb-6">
                <div className="font-display text-5xl font-bold text-primary mb-2">$24K</div>
                <div className="text-sm text-muted-foreground">Annual cost for 100-teacher district</div>
              </div>

              <div className="space-y-4">
                {[
                  { title: '100% Compliant from Day 1', desc: 'Every lesson automatically meets WCAG 2.1 AA' },
                  { title: 'Zero Compliance Risk', desc: 'Protected from OCR complaints and lawsuits' },
                  { title: 'Teacher Time Saved', desc: '5-10 hours per teacher per week' },
                  { title: 'Better Student Outcomes', desc: 'Every student gets personalized, accessible materials' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Without */}
            <div className="bg-destructive/5 rounded-xl p-8 border-2 border-destructive/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-destructive rounded-full p-2">
                  <XCircle className="w-6 h-6 text-destructive-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">Without Compliance</h3>
              </div>

              <div className="mb-6">
                <div className="font-display text-5xl font-bold text-destructive mb-2">$500K+</div>
                <div className="text-sm text-muted-foreground">Average cost of a single OCR complaint</div>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Legal Fees: $50K-500K+', desc: 'Defense costs and settlements' },
                  { title: 'Mandatory Remediation', desc: 'Court-ordered fixes to all existing content' },
                  { title: 'Federal Investigation', desc: 'OCR compliance reviews and oversight' },
                  { title: 'Reputational Damage', desc: 'Public record of civil rights violations' },
                  { title: 'Potential Loss of Federal Funding', desc: 'Millions in annual Title funding at risk' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROI Callout */}
          <div className="mt-10 gradient-warm rounded-xl p-8 text-center">
            <div className="text-primary-foreground mb-4">
              <div className="font-display text-5xl font-bold mb-2">20x ROI</div>
              <div className="text-xl">Prevent $500K+ in compliance costs for $24K/year</div>
            </div>
            <p className="text-primary-foreground/80 text-sm max-w-2xl mx-auto">
              One OCR complaint costs 20 years of RealPath Learning. Districts can't afford to wait until they're investigated—by then it's too late.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
