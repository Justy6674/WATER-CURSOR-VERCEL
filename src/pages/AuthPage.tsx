
import { useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Logo from "@/components/svg/Logo";

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      onLogin();
    }
  }, [onLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-downscale-slate">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-24 w-auto" />
          <h1 className="mt-4 text-3xl font-bold text-downscale-brown">
            Water-4-WeightLoss
          </h1>
          <p className="mt-2 text-downscale-cream/80">
            Track your daily hydration to support your weight loss goals
          </p>
        </div>

        <Card className="bg-white/5 border-downscale-brown/20">
          <CardHeader>
            <h2 className="text-xl font-semibold text-center text-downscale-brown">
              Sign in or create an account
            </h2>
          </CardHeader>
          <CardContent>
            <AuthForm onSuccess={onLogin} />
          </CardContent>
        </Card>
        
        <p className="text-sm text-center text-downscale-cream/60">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
