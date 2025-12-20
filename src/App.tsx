import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignOut from "./pages/SignOut";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import SimpleSignOut from "./pages/SimpleSignOut";
import SimpleAdmin from "./pages/SimpleAdmin";
import PhysicalScanner from "./pages/PhysicalScanner";
import SimpleScan from "./pages/SimpleScan";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sign-out" element={<SignOut />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/physical-scanner" element={<PhysicalScanner />} />
          <Route path="/simple" element={<SimpleSignOut />} />
          <Route path="/simple-scan" element={<SimpleScan />} />
          <Route path="/simple-admin" element={<SimpleAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
