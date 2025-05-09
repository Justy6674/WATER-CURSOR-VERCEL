
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Logo from "@/components/svg/Logo";

export default function ShopifyRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // Get order ID and email from Shopify's URL parameters
  const orderId = searchParams.get("order_id");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!orderId || !email) {
      setError("Missing required purchase information");
    }
  }, [orderId, email]);

  const handleStartNow = () => {
    navigate("/auth", { 
      state: { 
        email,
        message: "Welcome to Water-4-WeightLoss! Please create your account to get started." 
      } 
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-downscale-slate">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-24 w-auto" />
          <h1 className="mt-4 text-3xl font-bold text-downscale-brown">
            Thank You For Your Purchase!
          </h1>
          <p className="mt-2 text-downscale-cream/80">
            Your journey to better hydration starts here
          </p>
        </div>

        <Card className="bg-white/5 border-downscale-brown/20">
          <CardHeader>
            <h2 className="text-xl font-semibold text-center text-downscale-brown">
              {error ? "Oops!" : "Ready to Start?"}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="text-center">
                <p className="text-red-400">{error}</p>
                <p className="mt-2 text-downscale-cream/80">
                  Please return to Shopify and try again, or contact support.
                </p>
              </div>
            ) : (
              <>
                <p className="text-downscale-cream/80 text-center">
                  Your order #{orderId} has been confirmed. Click below to set up your account and start tracking your hydration journey!
                </p>
                <Button 
                  className="w-full bg-downscale-blue hover:bg-downscale-blue/90"
                  onClick={handleStartNow}
                >
                  Create Your Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
