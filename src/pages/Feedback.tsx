import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, MessageSquare, Gift, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "@/components/feedback/StarRating";
import { FeedbackProgress } from "@/components/feedback/FeedbackProgress";
import { useFeedbackForm, FeedbackFormData } from "@/hooks/useFeedbackForm";
import { Logo } from '@/components/ui/Logo';

const GRADE_LEVELS = [
  { value: "K-2", label: "K-2" },
  { value: "3-5", label: "3-5" },
  { value: "6-8", label: "6-8" },
  { value: "9-12", label: "9-12" },
  { value: "higher-ed", label: "Higher Ed" },
  { value: "adult-ed", label: "Adult Ed" },
];

const SUBJECT_AREAS = [
  { value: "math", label: "Math" },
  { value: "science", label: "Science" },
  { value: "ela", label: "ELA" },
  { value: "social-studies", label: "Social Studies" },
  { value: "cs-technology", label: "CS/Technology" },
  { value: "other", label: "Other" },
];

const FREE_EXTENSION_DAYS = 30;

export default function Feedback() {
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
  } = useFeedbackForm();

  // Check if user has already claimed the feedback incentive
  useEffect(() => {
    const checkIncentiveClaim = async () => {
      if (!user) {
        setCheckingClaim(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_feedback')
          .select('incentive_claimed, incentive_claim_date')
          .eq('user_id', user.id)
          .eq('incentive_claimed', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking incentive claim:', error);
        } else if (data?.incentive_claimed) {
          setHasAlreadyClaimed(true);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setCheckingClaim(false);
      }
    };

    checkIncentiveClaim();
  }, [user]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to submit feedback.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert feedback with incentive claim
      const shouldClaimIncentive = !hasAlreadyClaimed;
      const claimDate = shouldClaimIncentive ? new Date().toISOString() : null;

      const { error: feedbackError } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        usage_frequency: formData.usage_frequency,
        overall_satisfaction: formData.overall_satisfaction,
        ease_of_use: formData.ease_of_use,
        feature_completeness: formData.feature_completeness,
        would_recommend: formData.would_recommend,
        favorite_features: formData.favorite_features || null,
        pain_points: formData.pain_points || null,
        missing_features: formData.missing_features,
        improvement_suggestions: formData.improvement_suggestions || null,
        user_role: formData.user_role,
        years_teaching: formData.years_teaching,
        grade_levels: formData.grade_levels.length > 0 ? formData.grade_levels : null,
        subject_areas: formData.subject_areas.length > 0 ? formData.subject_areas : null,
        use_cases: formData.use_cases || null,
        feedback_type: "general",
        incentive_claimed: shouldClaimIncentive,
        incentive_claim_date: claimDate,
      });

      if (feedbackError) throw feedbackError;

      // If claiming incentive, create/update subscription override
      if (shouldClaimIncentive) {
        // Check if user already has an override
        const { data: existingOverride } = await supabase
          .from('subscription_overrides')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        let newTrialEndDate: Date;

        if (existingOverride?.trial_end_date) {
          // Extend existing trial
          const currentEnd = new Date(existingOverride.trial_end_date);
          const now = new Date();
          // If trial already expired, extend from now; otherwise extend from current end
          const baseDate = currentEnd > now ? currentEnd : now;
          newTrialEndDate = new Date(baseDate);
          newTrialEndDate.setDate(newTrialEndDate.getDate() + FREE_EXTENSION_DAYS);
        } else {
          // Create new trial
          newTrialEndDate = new Date();
          newTrialEndDate.setDate(newTrialEndDate.getDate() + FREE_EXTENSION_DAYS);
        }

        if (existingOverride) {
          // Update existing override
          const { error: updateError } = await supabase
            .from('subscription_overrides')
            .update({
              trial_end_date: newTrialEndDate.toISOString(),
              notes: `Extended ${FREE_EXTENSION_DAYS} days for feedback submission on ${new Date().toLocaleDateString()}`,
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating subscription override:', updateError);
          }
        } else {
          // Create new override
          const { error: insertError } = await supabase
            .from('subscription_overrides')
            .insert({
              user_id: user.id,
              override_type: 'trial',
              trial_end_date: newTrialEndDate.toISOString(),
              notes: `${FREE_EXTENSION_DAYS}-day free access for feedback submission`,
            });

          if (insertError) {
            console.error('Error creating subscription override:', insertError);
          }
        }

        setExtensionEndDate(newTrialEndDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }));
      }

      clearDraft();
      setIsSubmitted(true);
      triggerConfetti();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
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
            <CardDescription className="text-base">
              Your feedback has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {extensionEndDate && (
              <Alert className="bg-accent/10 border-accent text-left">
                <Gift className="h-4 w-4" />
                <AlertTitle>Free Access Extended!</AlertTitle>
                <AlertDescription>
                  Your free access has been extended by {FREE_EXTENSION_DAYS} days. 
                  You now have access until <strong>{extensionEndDate}</strong>.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate("/app")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Logo size="small" />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Share Your Feedback</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Incentive Banner */}
        {!hasAlreadyClaimed && (
          <Alert className="mb-6 bg-accent/10 border-accent">
            <Gift className="h-4 w-4" />
            <AlertTitle>Get {FREE_EXTENSION_DAYS} Days Free!</AlertTitle>
            <AlertDescription>
              Complete this feedback form to receive {FREE_EXTENSION_DAYS} days of free access to all premium features. 
              Your insights help us build a better platform for educators.
            </AlertDescription>
          </Alert>
        )}

        {hasAlreadyClaimed && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Thanks for your previous feedback!</AlertTitle>
            <AlertDescription>
              You've already claimed your free extension. You can still submit additional feedback to help us improve.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <FeedbackProgress currentStep={currentStep} totalSteps={3} />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Usage & Satisfaction */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <Label>
                    How often do you use the platform?
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.usage_frequency}
                    onValueChange={(value) => updateField("usage_frequency", value)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" },
                      { value: "rarely", label: "Rarely" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <StarRating
                  label="Overall satisfaction"
                  value={formData.overall_satisfaction}
                  onChange={(value) => updateField("overall_satisfaction", value)}
                  required
                />

                <StarRating
                  label="How easy is the platform to use?"
                  value={formData.ease_of_use}
                  onChange={(value) => updateField("ease_of_use", value)}
                  required
                />

                <StarRating
                  label="Does the platform have the features you need?"
                  value={formData.feature_completeness}
                  onChange={(value) => updateField("feature_completeness", value)}
                  required
                />

                <div className="space-y-3">
                  <Label>
                    Would you recommend this to a colleague?
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.would_recommend === null ? "" : formData.would_recommend ? "yes" : "no"}
                    onValueChange={(value) => updateField("would_recommend", value === "yes")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="recommend-yes" />
                      <Label htmlFor="recommend-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="recommend-no" />
                      <Label htmlFor="recommend-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Detailed Feedback */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="favorite_features">What are your favorite features?</Label>
                  <Textarea
                    id="favorite_features"
                    placeholder="Tell us what you love about the platform..."
                    value={formData.favorite_features}
                    onChange={(e) => updateField("favorite_features", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pain_points">
                    What challenges or frustrations have you experienced?
                  </Label>
                  <Textarea
                    id="pain_points"
                    placeholder="Share any difficulties you've encountered..."
                    value={formData.pain_points}
                    onChange={(e) => updateField("pain_points", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="missing_features">
                    What features are missing that you wish we had?
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Textarea
                    id="missing_features"
                    placeholder="Describe features you'd like to see..."
                    value={formData.missing_features}
                    onChange={(e) => updateField("missing_features", e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improvement_suggestions">
                    Any other suggestions for improvement?
                  </Label>
                  <Textarea
                    id="improvement_suggestions"
                    placeholder="Share any additional thoughts..."
                    value={formData.improvement_suggestions}
                    onChange={(e) => updateField("improvement_suggestions", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: About You */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label>
                    What's your primary role?
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={formData.user_role}
                    onValueChange={(value) => updateField("user_role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="coach">Instructional Coach</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_teaching">
                    How many years have you been in education?
                  </Label>
                  <Input
                    id="years_teaching"
                    type="number"
                    min={0}
                    max={50}
                    placeholder="Enter years"
                    value={formData.years_teaching ?? ""}
                    onChange={(e) =>
                      updateField("years_teaching", e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>What grade levels do you work with?</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {GRADE_LEVELS.map((grade) => (
                      <div key={grade.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grade-${grade.value}`}
                          checked={formData.grade_levels.includes(grade.value)}
                          onCheckedChange={() => toggleArrayField("grade_levels", grade.value)}
                        />
                        <Label htmlFor={`grade-${grade.value}`} className="cursor-pointer">
                          {grade.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What subject areas?</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SUBJECT_AREAS.map((subject) => (
                      <div key={subject.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.value}`}
                          checked={formData.subject_areas.includes(subject.value)}
                          onCheckedChange={() => toggleArrayField("subject_areas", subject.value)}
                        />
                        <Label htmlFor={`subject-${subject.value}`} className="cursor-pointer">
                          {subject.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="use_cases">How are you using this platform?</Label>
                  <Textarea
                    id="use_cases"
                    placeholder="Describe your main use cases..."
                    value={formData.use_cases}
                    onChange={(e) => updateField("use_cases", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
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
