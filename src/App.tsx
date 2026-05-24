import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePageViewTracker } from "@/hooks/usePageViewTracker";
import { DifferentiationProvider } from "@/contexts/DifferentiationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/i18n";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import StudentGroups from "./pages/StudentGroups";
import SavedLessons from "./pages/SavedLessons";
import SavedRubrics from "./pages/SavedRubrics";
import SavedAssessments from "./pages/SavedAssessments";
import AudioUsage from "./pages/AudioUsage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SessionManagement from "./pages/SessionManagement";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import LessonView from "./pages/LessonView";
import LessonAudioView from "./pages/LessonAudioView";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Feedback from "./pages/Feedback";
import HelpCenter from "./pages/HelpCenter";
import HelpArticle from "./pages/HelpArticle";
import SubmitTicket from "./pages/SubmitTicket";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";
import MarketingSurvey from "./pages/MarketingSurvey";
import SettingsCanvas from "./pages/SettingsCanvas";

const queryClient = new QueryClient();

function PageViewTracker() {
  usePageViewTracker();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <DifferentiationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PageViewTracker />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/studio" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/sessions" element={<SessionManagement />} />
                <Route path="/student-groups" element={<StudentGroups />} />
                <Route path="/saved-lessons" element={<SavedLessons />} />
                <Route path="/lesson/:id" element={<LessonView />} />
                <Route path="/lesson/:id/audio" element={<LessonAudioView />} />
                <Route path="/saved-rubrics" element={<SavedRubrics />} />
                <Route path="/saved-assessments" element={<SavedAssessments />} />
                <Route path="/audio-usage" element={<AudioUsage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/help/articles" element={<HelpCenter />} />
                <Route path="/help/article/:slug" element={<HelpArticle />} />
                <Route path="/help/tickets" element={<MyTickets />} />
                <Route path="/help/tickets/new" element={<SubmitTicket />} />
                <Route path="/help/tickets/:ticketId" element={<TicketDetail />} />
                <Route path="/marketing-survey" element={<MarketingSurvey />} />
                <Route path="/settings/canvas" element={<SettingsCanvas />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DifferentiationProvider>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
