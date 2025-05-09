
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ShopifyRedirect from './pages/ShopifyRedirect';
import ClinicalInfo from './pages/ClinicalInfo';
import { Toaster } from "sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/purchase/complete" element={<ShopifyRedirect />} />
        <Route path="/clinical" element={<ClinicalInfo />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ShadcnToaster />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
