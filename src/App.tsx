import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DifferentiationProvider } from "@/contexts/DifferentiationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import StudentGroups from "./pages/StudentGroups";
import SavedLessons from "./pages/SavedLessons";
import SavedRubrics from "./pages/SavedRubrics";
import AudioUsage from "./pages/AudioUsage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <DifferentiationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student-groups" element={<StudentGroups />} />
              <Route path="/saved-lessons" element={<SavedLessons />} />
              <Route path="/saved-rubrics" element={<SavedRubrics />} />
              <Route path="/audio-usage" element={<AudioUsage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DifferentiationProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
