import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Evento from "./pages/Evento";
import Presentes from "./pages/Presentes";
import Checkout from "./pages/Checkout";
import Confirmar from "./pages/Confirmar";
import Recados from "./pages/Recados";
import Agradecimento from "./pages/Agradecimento";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminConvidados from "./pages/admin/AdminConvidados";
import AdminPresentes from "./pages/admin/AdminPresentes";
import AdminRecados from "./pages/admin/AdminRecados";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/evento" element={<Evento />} />
          <Route path="/presentes" element={<Presentes />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmar" element={<Confirmar />} />
          <Route path="/recados" element={<Recados />} />
          <Route path="/agradecimento" element={<Agradecimento />} />
          <Route path="/admin" element={<Auth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="convidados" element={<AdminConvidados />} />
            <Route path="presentes" element={<AdminPresentes />} />
            <Route path="recados" element={<AdminRecados />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
