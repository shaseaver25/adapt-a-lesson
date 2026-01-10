import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { DifferentiateForm, DifferentiateInput } from '@/components/DifferentiateForm';
import { DifferentiatedLessonOutput } from '@/components/DifferentiatedLessonOutput';
import { AssessmentMethodSelector } from '@/components/assessment/AssessmentMethodSelector';
import { AssessmentOutput } from '@/components/AssessmentOutput';
import { RubricForm } from '@/components/RubricForm';
import { RubricOutput } from '@/components/RubricOutput';
import { ProfileModal } from '@/components/ProfileModal';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { UpgradePromptModal } from '@/components/UpgradePromptModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpenCheck, ShieldCheck, TableProperties, Users, FolderOpen, Volume2, LogIn, LogOut, Settings, UserCircle, Loader2, MessageSquare, HelpCircle } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useDifferentiation } from '@/contexts/DifferentiationContext';
import { DifferentiationProgressModal, createInitialProgressState } from '@/components/DifferentiationProgressModal';
import { useLessonAudio } from '@/hooks/useLessonAudio';
import { useDifferentiationGenerator } from '@/hooks/useDifferentiationGenerator';
import { useAssessmentGenerator } from '@/hooks/useAssessmentGenerator';
import { useRubricGenerator } from '@/hooks/useRubricGenerator';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_TIERS } from '@/lib/pricing';

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCachedLessonContent, clearSelection } = useDifferentiation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  
  // Subscription hook
  const { 
    isSubscribed, 
    tier, 
    subscriptionEnd, 
    isTrialing, 
    trialEnd, 
    daysRemaining,
    loading: subscriptionLoading,
    createCheckout,
  } = useSubscription();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Check subscription status and show upgrade modal if needed
  useEffect(() => {
    if (!authLoading && !subscriptionLoading && user) {
      // If user exists but has no subscription, show upgrade modal
      if (!isSubscribed) {
        setShowUpgradeModal(true);
      }
    }
  }, [authLoading, subscriptionLoading, user, isSubscribed]);

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['differentiate', 'assessment', 'rubric'].includes(tabParam) 
      ? tabParam 
      : 'differentiate';
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Audio generation hook
  const { 
    isGenerating: isGeneratingAudio, 
    progress: audioProgress, 
    audioRecords, 
    vocabularyAudio,
    generateAudio, 
  } = useLessonAudio();

  // Differentiation hook
  const {
    differentiatedLesson,
    selectedGroups,
    originalLessonContent,
    isDifferentiating,
    currentLessonId,
    progressStatus,
    showProgressModal,
    lastDifferentiateInput,
    differentiateError,
    isLessonSaved,
    handleDifferentiate,
    handleRetryDifferentiate,
    handleCancelGeneration,
    handleLessonSaved,
    handleResetDifferentiation,
    setShowProgressModal,
    setProgressStatus,
  } = useDifferentiationGenerator(setCachedLessonContent, clearSelection, generateAudio);

  // Assessment hook
  const {
    generatedAssessment,
    lastAssessmentInput,
    isGeneratingAssessment,
    handleGenerateAssessment,
    handleResetAssessment,
  } = useAssessmentGenerator();

  // Rubric hook
  const {
    generatedRubric,
    currentRubricInput,
    isGeneratingRubric,
    rubricAutoVerification,
    handleGenerateRubric,
    handleResetRubric,
  } = useRubricGenerator();

  // Warn user before leaving if there's unsaved content
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (differentiatedLesson && !isLessonSaved) {
        e.preventDefault();
        e.returnValue = 'You have an unsaved differentiated lesson. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [differentiatedLesson, isLessonSaved]);

  const handleReset = () => {
    if (differentiatedLesson) handleResetDifferentiation();
    else if (generatedAssessment) handleResetAssessment();
    else if (generatedRubric) handleResetRubric();
  };

  const handleUpgradeCheckout = async (selectedTier: 'monthly' | 'yearly') => {
    const tierInfo = PRICING_TIERS[selectedTier];
    await createCheckout(tierInfo.priceId, tierInfo.mode);
  };

  const showResults = differentiatedLesson || generatedAssessment || generatedRubric;

  // Show loading while checking auth and subscription
  if (authLoading || (user && subscriptionLoading)) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Subscription Banner */}
      <SubscriptionBanner 
        isTrialing={isTrialing}
        daysRemaining={daysRemaining}
        tier={tier}
        subscriptionEnd={subscriptionEnd}
        isSubscribed={isSubscribed}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-primary">
              Let's Get REAL
            </h1>
            <p className="text-xs text-muted-foreground">
              Responsive. Equitable. Adaptive. <span className="font-semibold">Learner.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/saved-lessons">
              <Button variant="ghost" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Lessons</span>
              </Button>
            </Link>
            <Link to="/saved-rubrics">
              <Button variant="ghost" size="sm" className="gap-2">
                <TableProperties className="h-4 w-4" />
                <span className="hidden sm:inline">Rubrics</span>
              </Button>
            </Link>
            <Link to="/saved-assessments">
              <Button variant="ghost" size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Assessments</span>
              </Button>
            </Link>
            <Link to="/student-groups">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Student Groups</span>
              </Button>
            </Link>
            <Link to="/audio-usage">
              <Button variant="ghost" size="sm" className="gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Audio</span>
              </Button>
            </Link>
            <Link to="/feedback">
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </Button>
            </Link>
            <Link to="/help">
              <Button variant="ghost" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </Link>
            {showResults && (
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                ← Start Over
              </button>
            )}
            
            {/* Admin link - only visible to admins */}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            
            {/* Auth buttons */}
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button 
                  onClick={signOut}
                  size="sm" 
                  className="gap-2 bg-[#166534] hover:bg-[#14532d] text-white font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Log In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!showResults ? (
          <div className="max-w-3xl mx-auto">
            {/* Hero section */}
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-primary mb-3">
                Let's Get REAL
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                <span className="font-semibold text-primary">R</span>esponsive. <span className="font-semibold text-primary">E</span>quitable. <span className="font-semibold text-primary">A</span>daptive. <span className="font-semibold text-primary">L</span>earner.
              </p>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Create personalized lessons for every learner and design authentic 
                assessments that reveal genuine student thinking.
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="differentiate" className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Lesson Plan Creator</span>
                </TabsTrigger>
                <TabsTrigger value="assessment" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Assessment</span>
                </TabsTrigger>
                <TabsTrigger value="rubric" className="flex items-center gap-2">
                  <TableProperties className="h-4 w-4" />
                  <span className="hidden sm:inline">Rubric</span>
                </TabsTrigger>
              </TabsList>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-medium">
                <TabsContent value="differentiate" className="mt-0">
                  <DifferentiateForm 
                    onSubmit={handleDifferentiate} 
                    isLoading={isDifferentiating}
                    error={differentiateError}
                    onRetry={handleRetryDifferentiate}
                    onCancel={handleCancelGeneration}
                  />
                </TabsContent>

                <TabsContent value="assessment" className="mt-0">
                  <AssessmentMethodSelector onGenerate={handleGenerateAssessment} isLoading={isGeneratingAssessment} />
                </TabsContent>

                <TabsContent value="rubric" className="mt-0">
                  <RubricForm onSubmit={handleGenerateRubric} isLoading={isGeneratingRubric} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : differentiatedLesson ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <BookOpenCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  {lastDifferentiateInput?.lessonName || 'Lesson'} Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customized for {selectedGroups.length} student group{selectedGroups.length !== 1 ? 's' : ''}
                  {isGeneratingAudio && (
                    <span className="ml-2 text-primary">
                      • Generating audio ({audioProgress.generated}/{audioProgress.total})...
                    </span>
                  )}
                  {!isGeneratingAudio && audioRecords.length > 0 && (
                    <span className="ml-2 text-success">
                      • {audioRecords.length} audio files ready
                    </span>
                  )}
                </p>
              </div>
            </div>

            <DifferentiatedLessonOutput 
              lessonData={differentiatedLesson} 
              selectedGroups={selectedGroups}
              lessonTitle={lastDifferentiateInput?.lessonName || 'Differentiated Lesson'}
              originalContent={originalLessonContent}
              onSaved={handleLessonSaved}
              lessonId={currentLessonId}
              preGeneratedAudio={audioRecords}
              preGeneratedVocabularyAudio={vocabularyAudio}
              isGeneratingAudio={isGeneratingAudio}
            />
          </div>
        ) : generatedAssessment ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Authentic Assessment Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generated materials ready for classroom use
                </p>
              </div>
            </div>

            <AssessmentOutput 
              content={generatedAssessment} 
              lessonTitle={lastAssessmentInput?.lessonContext?.title || 'assessment'}
              assessmentInput={lastAssessmentInput}
              onReset={handleResetAssessment}
            />
          </div>
        ) : generatedRubric ? (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <TableProperties className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">
                  Analytic Rubric Ready
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentRubricInput?.numCriteria} criteria with 4 performance levels
                </p>
              </div>
            </div>

            <RubricOutput 
              content={generatedRubric} 
              assessmentTitle={currentRubricInput?.assessmentDescription.slice(0, 50) || 'rubric'}
              autoVerificationAdded={rubricAutoVerification?.added}
              autoVerificationCount={rubricAutoVerification?.count}
              rubricInput={currentRubricInput || undefined}
              vulnerabilityAnalysis={currentRubricInput?.vulnerabilityAnalysis}
            />
          </div>
        ) : null}
      </main>

      {/* Progress Modal */}
      <DifferentiationProgressModal
        isOpen={showProgressModal}
        progress={progressStatus}
        onViewLesson={() => {
          setShowProgressModal(false);
          setProgressStatus(createInitialProgressState());
        }}
        onRetryFailed={() => {
          if (currentLessonId && lastDifferentiateInput && differentiatedLesson) {
            const fullContent = differentiatedLesson.teacherGuide + '\n\n' + 
              differentiatedLesson.studentHandouts.map(h => h.content).join('\n\n');
            generateAudio(currentLessonId, fullContent, lastDifferentiateInput.selectedGroups);
          }
        }}
        onClose={() => {
          if (progressStatus.isComplete) {
            setShowProgressModal(false);
            setProgressStatus(createInitialProgressState());
          }
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="no_subscription"
        onCheckout={handleUpgradeCheckout}
      />

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built for educators who believe every student deserves access to the curriculum.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
