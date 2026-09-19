import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import SafetyMap from '@/pages/SafetyMap';
import RiskPrediction from '@/pages/RiskPrediction';
import SmartRoute from '@/pages/SmartRoute';
import WomenSafety from '@/pages/WomenSafety';
import GeoFencing from '@/pages/GeoFencing';
import Emergency from '@/pages/Emergency';
import AIAssistant from '@/pages/AIAssistant';
import Admin from '@/pages/Admin';
import ArSafety from '@/pages/ArSafety';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/safety-map" element={<SafetyMap />} />
        <Route path="/risk-prediction" element={<RiskPrediction />} />
        <Route path="/smart-route" element={<SmartRoute />} />
        <Route path="/women-safety" element={<WomenSafety />} />
        <Route path="/geo-fencing" element={<GeoFencing />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/ar-safety" element={<ArSafety />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
