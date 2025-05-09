
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { SimpleWaterTracker } from "@/components/water/SimpleWaterTracker";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { WaterHistoryView } from "@/components/water/WaterHistoryView";
import { ConfettiOverlay } from "@/components/water/ConfettiOverlay";
import { NotificationSetup } from "@/components/user/NotificationSetup";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // If no user, show loading (should be handled by Index.tsx)
  if (!user) {
    return <div className="min-h-screen bg-downscale-slate flex items-center justify-center">
      <p className="text-downscale-cream">Loading dashboard...</p>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-downscale-slate text-downscale-cream">
      <Header user={user} onLogout={onLogout} />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold mb-6 text-center text-downscale-cream">Your Daily Hydration</h1>
        <div className="max-w-2xl mx-auto">
          <SimpleWaterTracker />
          
          <NotificationSetup />
          
          <div className="mt-6">
            <Button
              variant="ghost"
              className="flex items-center justify-center w-full text-downscale-cream border border-downscale-brown/20 hover:bg-downscale-blue/10"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide History
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View History
                </>
              )}
            </Button>
            
            {showHistory && (
              <div className="mt-4">
                <WaterHistoryView />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}

export default Dashboard;
