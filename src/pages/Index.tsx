
import { useEffect, useState } from "react";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<string>("untested");
  const [edgeFunctionError, setEdgeFunctionError] = useState<string | null>(null);

  // Debug user object and mark when we're done loading
  useEffect(() => {
    if (!loading) {
      console.log("User object in Index:", user);
      // Use setTimeout to ensure this state update doesn't block rendering
      setTimeout(() => {
        setInitialized(true);
      }, 0);
    }
  }, [user, loading]);

  // Test edge functions to verify they're working with enhanced logging
  useEffect(() => {
    const testEdgeFunctions = async () => {
      if (!user) return;
      
      try {
        console.log("Testing edge functions...");
        setEdgeFunctionStatus("testing");
        console.log("Current auth token:", await supabase.auth.getSession());
        
        // Test the generate-personalized-message function with more detailed logging
        console.log("Invoking edge function with parameters:", { 
          userName: user.user_metadata?.name || "Test User", 
          milestoneType: "test" 
        });
        
        const { data: messageData, error: messageError } = await supabase.functions.invoke('generate-personalized-message', {
          body: { 
            userName: user.user_metadata?.name || "Test User", 
            milestoneType: "test" 
          }
        });
        
        console.log("Edge function raw response:", messageData, messageError);
        
        if (messageError) {
          console.error("Edge function error details:", {
            message: messageError.message,
            name: messageError.name,
            code: messageError.code,
            details: messageError.details,
            hint: messageError.hint,
          });
          setEdgeFunctionStatus("error");
          setEdgeFunctionError(messageError.message);
          toast.error(`Edge function test failed: ${messageError.message}`);
          return;
        }
        
        if (!messageData) {
          console.error("Edge function returned no data");
          setEdgeFunctionStatus("error");
          setEdgeFunctionError("No data returned");
          toast.error("Edge function test failed: No data returned");
          return;
        }
        
        console.log("Edge function success:", messageData);
        setEdgeFunctionStatus("working");
        setEdgeFunctionError(null);
        toast.success("Edge functions are working properly!");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error testing edge functions:", error);
        console.error("Error details:", {
          message: errorMsg,
          stack: error instanceof Error ? error.stack : undefined
        });
        setEdgeFunctionStatus("error");
        setEdgeFunctionError(errorMsg);
        toast.error(`Edge function test error: ${errorMsg}`);
      }
    };

    if (user && initialized) {
      testEdgeFunctions();
    }
  }, [user, initialized]);

  // Show loading state until authentication is initialized
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-downscale-slate">
        <div className="flex flex-col items-center text-downscale-cream">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Debug information for edge function status
  console.log("Edge function status:", edgeFunctionStatus);
  if (edgeFunctionError) {
    console.log("Edge function error:", edgeFunctionError);
  }

  // Render Dashboard if user is logged in, otherwise AuthPage
  return user ? <Dashboard onLogout={signOut} /> : <AuthPage onLogin={() => {}} />;
};

export default Index;
