import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, ClipboardList, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "@/components/feedback/StarRating";
import { FeedbackProgress } from "@/components/feedback/FeedbackProgress";
import { useMarketingSurveyForm } from "@/hooks/useMarketingSurveyForm";
import { Logo } from "@/components/ui/Logo";

const ROLES = [
  { value: "classroom_teacher", label: "Classroom Teacher" },
  { value: "esl_ell_specialist", label: "ESL/ELL Specialist" },
  { value: "special_education", label: "Special Education Teacher" },
  { value: "instructional_coach", label: "Instructional Coach" },
  { value: "administrator", label: "Administrator" },
  { value: "other", label: "Other" },
];

const GRADE_LEVELS = [
  { value: "prek-2", label: "PreK–2" },
  { value: "3-5", label: "3–5" },
  { value: "6-8", label: "6–8" },
  { value: "9-12", label: "9–12" },
  { value: "multiple", label: "Multiple levels" },
];

const USAGE_DURATIONS = [
  { value: "less_than_1_month", label: "Less than 1 month" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_plus_months", label: "6+ months" },
];

const FEATURES = [
  { value: "differentiated_lessons", label: "Differentiated lessons" },
  { value: "multilingual_audio", label: "Multilingual audio" },
  { value: "ai_proof_assessments", label: "AI-proof assessments" },
  { value: "rubric_generation", label: "Rubric generation" },
  { value: "iep_504_accommodations", label: "IEP/504 accommodations" },
  { value: "wcag_compliant_pdfs", label: "WCAG-compliant PDFs" },
];

const PREVIOUS_METHODS = [
  { value: "from_scratch", label: "Made them from scratch" },
  { value: "other_tools", label: "Used other tools" },
  { value: "didnt_differentiate", label: "Didn't differentiate consistently" },
  { value: "other", label: "Other" },
];

const LESSONS_PER_WEEK = [
  { value: "1-2", label: "1–2" },
  { value: "3-5", label: "3–5" },
  { value: "6-10", label: "6–10" },
  { value: "10+", label: "10+" },
];

const FREE_EXTENSION_DAYS = 30;

export default function MarketingSurvey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasAlreadyClaimed, setHasAlreadyClaimed] = useState(false);
  const [checkingClaim, setCheckingClaim] = useState(true);
  const [extensionEndDate, setExtensionEndDate] = useState<string | null>(null);

  const {
    formData,
    currentStep,
    updateField,
    toggleArrayField,
    nextStep,
    prevStep,
    clearDraft,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
  } = useMarketingSurveyForm();

  useEffect(() => {
    const checkClaim = async () => {
      if (!user) { setCheckingClaim(false); return; }
      try {
        const { data } = await supabase
          .from("marketing_surveys" as any)
          .select("incentive_claimed")
          .eq("user_id", user.id)
          .eq("incentive_claimed", true)
          .maybeSingle();
        if ((data as any)?.incentive_claimed) setHasAlreadyClaimed(true);
      } catch { /* ignore */ }
      setCheckingClaim(false);
    };
    checkClaim();
  }, [user]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const interval = setInterval(() => {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const count = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount: count, origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount: count, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to submit.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const shouldClaim = !hasAlreadyClaimed;
      const claimDate = shouldClaim ? new Date().toISOString() : null;

      const { error } = await supabase.from("marketing_surveys" as any).insert({
        user_id: user.id,
        primary_role: formData.primary_role,
        grade_levels: formData.grade_levels,
        usage_duration: formData.usage_duration,
        lessons_per_week: formData.lessons_per_week || null,
        features_used: formData.features_used,
        time_saved_rating: formData.time_saved_rating,
        previous_method: formData.previous_method,
        lesson_quality_satisfaction: formData.lesson_quality_satisfaction,
        multilingual_satisfaction: formData.multilingual_satisfaction || null,
        student_impact: formData.student_impact || null,
        nps_score: formData.nps_score,
        wcag_adoption_factor: formData.wcag_adoption_factor || null,
        ocr_complaint: formData.ocr_complaint || null,
        most_valuable_thing: formData.most_valuable_thing,
        improvement_suggestion: formData.improvement_suggestion || null,
        incentive_claimed: shouldClaim,
        incentive_claim_date: claimDate,
      } as any);

      if (error) throw error;

      if (shouldClaim) {
        const { data: existing } = await supabase
          .from("subscription_overrides")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        let newEnd: Date;
        if (existing?.trial_end_date) {
          const cur = new Date(existing.trial_end_date);
          const base = cur > new Date() ? cur : new Date();
          newEnd = new Date(base);
          newEnd.setDate(newEnd.getDate() + FREE_EXTENSION_DAYS);
        } else {
          newEnd = new Date();
          newEnd.setDate(newEnd.getDate() + FREE_EXTENSION_DAYS);
        }

        if (existing) {
          await supabase.from("subscription_overrides").update({
            trial_end_date: newEnd.toISOString(),
            notes: `Extended ${FREE_EXTENSION_DAYS} days for marketing survey on ${new Date().toLocaleDateString()}`,
          }).eq("user_id", user.id);
        } else {
          await supabase.from("subscription_overrides").insert({
            user_id: user.id,
            override_type: "trial",
            trial_end_date: newEnd.toISOString(),
            notes: `${FREE_EXTENSION_DAYS}-day free access for marketing survey`,
          });
        }

        setExtensionEndDate(newEnd.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
      }

      clearDraft();
      setIsSubmitted(true);
      triggerConfetti();
    } catch (err) {
      console.error("Error submitting survey:", err);
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingClaim) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription className="text-base">Your survey has been submitted successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {extensionEndDate && (
              <Alert className="bg-accent/10 border-accent text-left">
                <Gift className="h-4 w-4" />
                <AlertTitle>Free Access Extended!</AlertTitle>
                <AlertDescription>
                  Your free access has been extended by {FREE_EXTENSION_DAYS} days until <strong>{extensionEndDate}</strong>.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate("/studio")} className="w-full">Return to Studio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const npsColor = formData.nps_score <= 6 ? "text-destructive" : formData.nps_score <= 8 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Logo size="small" />
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Marketing Survey</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!hasAlreadyClaimed && (
          <Alert className="mb-6 bg-accent/10 border-accent">
            <Gift className="h-4 w-4" />
            <AlertTitle>Get {FREE_EXTENSION_DAYS} Days Free!</AlertTitle>
            <AlertDescription>
              Complete this survey to receive {FREE_EXTENSION_DAYS} days of free premium access.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <FeedbackProgress currentStep={currentStep} totalSteps={4} />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: About You */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-lg font-semibold">About You</h2>

                <div className="space-y-3">
                  <Label>What is your primary role? <span className="text-destructive">*</span></Label>
                  <RadioGroup value={formData.primary_role} onValueChange={(v) => updateField("primary_role", v)} className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <div key={r.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={r.value} id={`role-${r.value}`} />
                        <Label htmlFor={`role-${r.value}`} className="cursor-pointer">{r.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>What grade level(s) do you primarily serve?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {GRADE_LEVELS.map((g) => (
                      <div key={g.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grade-${g.value}`}
                          checked={formData.grade_levels.includes(g.value)}
                          onCheckedChange={() => toggleArrayField("grade_levels", g.value)}
                        />
                        <Label htmlFor={`grade-${g.value}`} className="cursor-pointer">{g.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>How long have you been using RealPath Learning? <span className="text-destructive">*</span></Label>
                  <RadioGroup value={formData.usage_duration} onValueChange={(v) => updateField("usage_duration", v)} className="grid grid-cols-2 gap-3">
                    {USAGE_DURATIONS.map((d) => (
                      <div key={d.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={d.value} id={`dur-${d.value}`} />
                        <Label htmlFor={`dur-${d.value}`} className="cursor-pointer">{d.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Usage & Value */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-lg font-semibold">Usage & Value</h2>

                <div className="space-y-3">
                  <Label>On average, how many lessons do you generate per week?</Label>
                  <RadioGroup value={formData.lessons_per_week} onValueChange={(v) => updateField("lessons_per_week", v)} className="flex gap-4 flex-wrap">
                    {LESSONS_PER_WEEK.map((l) => (
                      <div key={l.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={l.value} id={`lpw-${l.value}`} />
                        <Label htmlFor={`lpw-${l.value}`} className="cursor-pointer">{l.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Which features do you use most often?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {FEATURES.map((f) => (
                      <div key={f.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feat-${f.value}`}
                          checked={formData.features_used.includes(f.value)}
                          onCheckedChange={() => toggleArrayField("features_used", f.value)}
                        />
                        <Label htmlFor={`feat-${f.value}`} className="cursor-pointer">{f.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>On a scale of 1–10, how much time does RealPath save you each week? <span className="text-destructive">*</span></Label>
                  <div className="px-2">
                    <Slider
                      value={[formData.time_saved_rating]}
                      onValueChange={([v]) => updateField("time_saved_rating", v)}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1 (Minimal)</span>
                      <span className="font-semibold text-sm text-foreground">{formData.time_saved_rating || "–"}</span>
                      <span>10 (Significant)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Before RealPath, how did you create differentiated materials? <span className="text-destructive">*</span></Label>
                  <RadioGroup value={formData.previous_method} onValueChange={(v) => updateField("previous_method", v)} className="grid grid-cols-2 gap-3">
                    {PREVIOUS_METHODS.map((m) => (
                      <div key={m.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={m.value} id={`prev-${m.value}`} />
                        <Label htmlFor={`prev-${m.value}`} className="cursor-pointer">{m.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Satisfaction & Impact */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-lg font-semibold">Satisfaction & Impact</h2>

                <StarRating
                  label="How satisfied are you with the quality of generated lessons?"
                  value={formData.lesson_quality_satisfaction}
                  onChange={(v) => updateField("lesson_quality_satisfaction", v)}
                  required
                />

                <StarRating
                  label="How satisfied are you with the multilingual/audio features?"
                  value={formData.multilingual_satisfaction}
                  onChange={(v) => updateField("multilingual_satisfaction", v)}
                />

                <div className="space-y-3">
                  <Label>Have you noticed a positive impact on student outcomes?</Label>
                  <RadioGroup value={formData.student_impact} onValueChange={(v) => updateField("student_impact", v)} className="flex gap-4 flex-wrap">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "too_early", label: "Too early to tell" },
                    ].map((o) => (
                      <div key={o.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={o.value} id={`impact-${o.value}`} />
                        <Label htmlFor={`impact-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>How likely are you to recommend RealPath Learning to a colleague? <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground">0 = Not at all likely, 10 = Extremely likely</p>
                  <div className="px-2">
                    <Slider
                      value={[formData.nps_score >= 0 ? formData.nps_score : 5]}
                      onValueChange={([v]) => updateField("nps_score", v)}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span className={`font-bold text-lg ${npsColor}`}>{formData.nps_score >= 0 ? formData.nps_score : "–"}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Compliance & Open Feedback */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-lg font-semibold">Compliance & Open Feedback</h2>

                <div className="space-y-3">
                  <Label>Was WCAG 2.1 AA compliance a factor in adopting RealPath Learning?</Label>
                  <RadioGroup value={formData.wcag_adoption_factor} onValueChange={(v) => updateField("wcag_adoption_factor", v)} className="flex gap-4 flex-wrap">
                    {["Yes", "No", "Not sure"].map((o) => (
                      <div key={o} className="flex items-center space-x-2">
                        <RadioGroupItem value={o.toLowerCase().replace(" ", "_")} id={`wcag-${o}`} />
                        <Label htmlFor={`wcag-${o}`} className="cursor-pointer">{o}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Has your school/district received an OCR complaint or audit related to accessibility?</Label>
                  <RadioGroup value={formData.ocr_complaint} onValueChange={(v) => updateField("ocr_complaint", v)} className="flex gap-4 flex-wrap">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "prefer_not_to_say", label: "Prefer not to say" },
                    ].map((o) => (
                      <div key={o.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={o.value} id={`ocr-${o.value}`} />
                        <Label htmlFor={`ocr-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="most_valuable">
                    What is the single most valuable thing RealPath Learning does for you? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="most_valuable"
                    placeholder="Share what matters most to you..."
                    value={formData.most_valuable_thing}
                    onChange={(e) => updateField("most_valuable_thing", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improvement">
                    What is one feature or improvement that would make RealPath significantly better?
                  </Label>
                  <Textarea
                    id="improvement"
                    placeholder="Share your ideas..."
                    value={formData.improvement_suggestion}
                    onChange={(e) => updateField("improvement_suggestion", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid) ||
                    (currentStep === 3 && !isStep3Valid)
                  }
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!isStep4Valid || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit Survey</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
