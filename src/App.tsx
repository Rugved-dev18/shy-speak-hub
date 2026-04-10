import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import AskQuestion from "@/pages/AskQuestion";
import Sessions from "@/pages/Sessions";
import SessionDetail from "@/pages/SessionDetail";
import Community from "@/pages/Community";
import GroupTasks from "@/pages/GroupTasks";
import Conversations from "@/pages/Conversations";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/ask" element={<AskQuestion />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/session/:id" element={<SessionDetail />} />
            <Route path="/community" element={<Community />} />
            <Route path="/tasks" element={<GroupTasks />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
