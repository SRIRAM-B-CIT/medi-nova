import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import PatientDetails from "./pages/PatientDetails";
import NearbyHospitals from "./pages/NearbyHospitals";
import CalmCorner from "./pages/CalmCorner";
import Emergency from "./pages/Emergency";
import MedicalChatbot from "./pages/MedicalChatbot";
import DiseaseRisk from "./pages/DiseaseRisk";
import FirstAid from "./pages/FirstAid";
import DiseaseIdentifier from "./pages/DiseaseIdentifier";
import NotFound from "./pages/NotFound";
import CompanionCare from "./pages/CompanionCare";
import VoiceAI from "./pages/VoiceAI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/hospitals" element={
              <ProtectedRoute>
                <Layout>
                  <NearbyHospitals />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/patient-details" element={
              <ProtectedRoute>
                <Layout>
                  <PatientDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calm" element={
              <ProtectedRoute>
                <Layout>
                  <CalmCorner />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute>
                <Layout>
                  <Emergency />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/medical-chatbot" element={
              <ProtectedRoute>
                <Layout>
                  <MedicalChatbot />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/companion-care" element={
              <ProtectedRoute>
                <Layout>
                  <CompanionCare />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/disease-risk" element={
              <ProtectedRoute>
                <Layout>
                  <DiseaseRisk />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/first-aid" element={
              <ProtectedRoute>
                <Layout>
                  <FirstAid />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/disease-identifier" element={
              <ProtectedRoute>
                <Layout>
                  <DiseaseIdentifier />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/voice-ai" element={
              <ProtectedRoute>
                <Layout>
                  <VoiceAI />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;